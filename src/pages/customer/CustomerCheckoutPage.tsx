import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, PageLoader, Select } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { ordersApi } from '@/features/orders/ordersApi';
import { paymentsApi } from '@/features/payments/paymentsApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { CheckoutSession } from '@/types/orders';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, callback: (resp: { error?: { code?: string; description?: string; metadata?: { payment_id?: string } } }) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CustomerCheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [activeSession, setActiveSession] = useState<CheckoutSession | null>(null);
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `chk-${crypto.randomUUID()}`
      : `chk-${Date.now()}`
  );

  // Gateway callback / manual verification inputs for environments without live popup
  const [manualPaymentId, setManualPaymentId] = useState('');
  const [manualSignature, setManualSignature] = useState('');

  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: storefrontApi.listAddresses,
  });

  const addresses = addressesQuery.data ?? [];
  const activeAddressId = selectedAddressId ?? addresses.find((a) => a.defaultAddress)?.id;

  const previewQuery = useQuery({
    queryKey: ['customer', 'checkout', 'preview', activeAddressId ?? 'none', appliedCoupon],
    queryFn: () =>
      ordersApi.previewCheckout({
        addressId: activeAddressId,
        couponCode: appliedCoupon || undefined,
      }),
    enabled: !activeSession,
  });

  const createSessionMutation = useMutation({
    mutationFn: () => {
      if (!activeAddressId) {
        throw new Error('Select a delivery address before proceeding to payment.');
      }
      return ordersApi.createCheckoutSession({
        addressId: activeAddressId,
        couponCode: appliedCoupon || undefined,
        idempotencyKey,
      });
    },
    onSuccess: (session) => {
      setActiveSession(session);
      notify({
        variant: 'success',
        title: 'Checkout Session Prepared',
        message: `Batch inventory reserved under ${session.checkoutReference}.`,
      });
    },
    onError: (err) => {
      notify({
        variant: 'error',
        title: 'Checkout Validation Failed',
        message: normalizeApiError(err).message,
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (vars: { paymentId: string; orderId: string; signature: string }) => {
      if (!activeSession) throw new Error('No active checkout session.');
      return ordersApi.confirmPayment(activeSession.checkoutReference, {
        razorpayPaymentId: vars.paymentId,
        razorpayOrderId: vars.orderId,
        razorpaySignature: vars.signature,
      });
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'payments'] });
      if (updated.status === 'PAID') {
        notify({
          variant: 'success',
          title: 'Payment Verified & Orders Placed',
          message: `Parent checkout ${updated.checkoutReference} placed ${updated.orders.length} pharmacy order(s).`,
        });
        navigate(`/customer/checkout/confirmation/${updated.checkoutReference}`);
      } else if (updated.status === 'FAILED' || updated.status === 'CANCELLED' || updated.status === 'EXPIRED') {
        notify({
          variant: 'error',
          title: `Payment ${updated.status}`,
          message: updated.failureReason || 'Payment did not complete; reserved inventory has been released.',
        });
        navigate(`/customer/checkout/status/${updated.checkoutReference}?outcome=failed`);
      } else {
        notify({
          variant: 'info',
          title: 'Payment Pending Capture Verification',
          message: 'Payment authorization received. Tracking backend capture confirmation...',
        });
        navigate(`/customer/checkout/status/${updated.checkoutReference}?outcome=pending`);
      }
    },
    onError: (err) => {
      notify({
        variant: 'error',
        title: 'Payment Verification Failed',
        message: normalizeApiError(err).message,
      });
    },
  });

  const cancelSessionMutation = useMutation({
    mutationFn: () => {
      if (!activeSession) throw new Error('No checkout session to cancel.');
      return ordersApi.cancelCheckoutSession(activeSession.checkoutReference, 'Cancelled from payment screen');
    },
    onSuccess: () => {
      setActiveSession(null);
      notify({
        variant: 'info',
        title: 'Checkout Cancelled',
        message: 'Reserved batch inventory has been released back to pharmacies.',
      });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'checkout', 'preview'] });
    },
  });

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    setAppliedCoupon(couponInput.trim().toUpperCase());
  };

  const handleOpenRazorpay = async () => {
    if (!activeSession) return;
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay || !activeSession.razorpayKeyId) {
      notify({
        variant: 'warning',
        title: 'Razorpay SDK Unavailable',
        message: 'Check network access or complete verification below with your gateway signature.',
      });
      return;
    }

    const rzp = new window.Razorpay({
      key: activeSession.razorpayKeyId,
      amount: activeSession.amountInPaise,
      currency: activeSession.currency,
      name: 'Medexa Healthcare Marketplace',
      description: `Multi-Pharmacy Order ${activeSession.checkoutReference}`,
      order_id: activeSession.razorpayOrderId,
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        confirmPaymentMutation.mutate({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      prefill: {
        name: activeSession.deliveryRecipientName,
        contact: activeSession.deliveryPhone,
      },
      theme: {
        color: '#0b6e4f',
      },
      modal: {
        ondismiss: () => {
          notify({
            variant: 'info',
            title: 'Payment Window Closed',
            message: 'Checking or waiting on payment status. Your inventory reservation remains active briefly.',
          });
        },
      },
    });
    rzp.on?.('payment.failed', (failureResp) => {
      const code = failureResp.error?.code;
      const desc = failureResp.error?.description || 'Payment failed in Razorpay Checkout';
      const failedPayId = failureResp.error?.metadata?.payment_id;
      void paymentsApi
        .reportCheckoutFailure(activeSession.checkoutReference, {
          razorpayPaymentId: failedPayId,
          errorCode: code,
          errorDescription: desc,
          releaseStock: true,
        })
        .catch(() => undefined)
        .finally(() => {
          void queryClient.invalidateQueries({ queryKey: ['customer', 'payments'] });
          void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
          navigate(`/customer/checkout/status/${activeSession.checkoutReference}?outcome=failed`);
        });
    });
    rzp.open();
  };

  if (addressesQuery.isLoading || (!activeSession && previewQuery.isLoading)) {
    return <PageLoader message="Validating multi-pharmacy pricing, prescriptions, and zones..." />;
  }

  const preview = previewQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to={ROUTES.CUSTOMER_CART}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink-primary">
            {activeSession ? 'Payment Preparation' : 'Multi-Pharmacy Checkout'}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {activeSession
              ? 'Complete verified payment before your FEFO inventory reservation expires.'
              : 'All subtotals, coupons, zone delivery fees, taxes, and split pharmacy orders are computed server-side.'}
          </p>
        </div>

        <div className="min-w-52">
          <label htmlFor="checkout-progress" className="block text-xs font-semibold text-ink-secondary mb-1">
            {activeSession ? 'Step 2 of 3: Payment Verification' : 'Step 1 of 3: Address & Review'}
          </label>
          <progress
            id="checkout-progress"
            max={3}
            value={activeSession ? 2 : 1}
            className="medexa-progress w-full h-2.5"
          />
        </div>
      </div>

      {!activeSession && preview && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {/* Delivery Address Selection */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <span>1. Delivery Address</span>
                </h2>
                <Link to={ROUTES.CUSTOMER_ADDRESSES} className="text-xs font-semibold text-brand-700 hover:underline">
                  Manage Addresses
                </Link>
              </div>

              {addresses.length === 0 ? (
                <AlertBanner
                  variant="warning"
                  title="No saved delivery addresses"
                  description="Add a delivery address in Customer Addresses before checking out."
                />
              ) : (
                <Select
                  label="Select Delivery Location"
                  value={activeAddressId ? String(activeAddressId) : ''}
                  onChange={(e) => setSelectedAddressId(e.target.value ? Number(e.target.value) : undefined)}
                  options={addresses.map((addr) => ({
                    value: String(addr.id),
                    label: `${addr.label} — ${addr.addressLine1}, ${addr.city} (${addr.postalCode})${
                      addr.defaultAddress ? ' [Default]' : ''
                    }`,
                  }))}
                />
              )}
            </Card>

            {/* Split Pharmacy Breakdowns */}
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-ink-primary">
                2. Child Orders by Dispensing Pharmacy ({preview.pharmacyBreakdowns.length})
              </h2>

              <div className="space-y-3">
                {preview.pharmacyBreakdowns.map((group) => (
                  <div
                    key={group.pharmacyId}
                    className="rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
                        <span className="font-semibold text-ink-primary">{group.pharmacyName}</span>
                        <span className="text-xs text-ink-muted">({group.pharmacyCity})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={group.serviceable ? 'success' : 'danger'}>
                          {group.serviceable
                            ? `Zone Verified (~${group.estimatedDeliveryMinutes} mins)`
                            : 'Zone Unserviceable'}
                        </Badge>
                        <Badge variant={group.readyForCheckout ? 'brand' : 'warning'}>
                          {group.itemCount} unit(s)
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs text-ink-secondary sm:grid-cols-4 tabular-nums">
                      <span>Items: ₹{group.itemsSubtotal.toFixed(2)}</span>
                      <span>Discount: -₹{group.discountAllocated.toFixed(2)}</span>
                      <span>Delivery: ₹{group.deliveryFee.toFixed(2)}</span>
                      <span className="font-bold text-ink-primary">
                        Tax ₹{group.taxAmount.toFixed(2)} • Total ₹{group.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {group.blockers.length > 0 && (
                      <p className="text-xs font-medium text-[#b42318]">
                        Blocker: {group.blockers.join(' • ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {preview.blockers.length > 0 && (
                <AlertBanner
                  variant="error"
                  title="Checkout Blocked"
                  description={preview.blockers.join(' • ')}
                />
              )}
            </Card>
          </div>

          {/* Right Summary & Coupon */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-ink-primary">3. Coupon &amp; Server Total</h2>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Promo / Discount Coupon"
                    placeholder="WELCOME10 or MEDEXA50"
                    leftAddon={<Tag className="h-4 w-4" />}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                </div>
                <Button type="submit" variant="outline" className="self-end">
                  Apply
                </Button>
              </form>

              {preview.couponMessage && (
                <p
                  className={`text-xs font-medium ${
                    preview.couponApplied ? 'text-brand-800' : 'text-[#b42318]'
                  }`}
                >
                  {preview.couponMessage}
                </p>
              )}

              <dl className="space-y-2 border-t border-border-subtle pt-3 text-sm tabular-nums">
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Medicine Subtotal</dt>
                  <dd className="font-semibold">₹{preview.itemsSubtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Eligible Discount</dt>
                  <dd className="font-semibold text-brand-700">-₹{preview.discountAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Delivery Fees</dt>
                  <dd className="font-semibold">₹{preview.deliveryFeeTotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Applicable Tax ({preview.taxRatePercent}% GST)</dt>
                  <dd className="font-semibold">₹{preview.taxAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold text-ink-primary">
                  <dt>Final Total</dt>
                  <dd>₹{preview.grandTotal.toFixed(2)}</dd>
                </div>
              </dl>

              <Button
                type="button"
                fullWidth
                disabled={!preview.checkoutAllowed}
                loading={createSessionMutation.isPending}
                onClick={() => createSessionMutation.mutate()}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Reserve Stock &amp; Prepare Payment
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Active Reserved Checkout Payment Screen */}
      {activeSession && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-700">
                    {activeSession.checkoutReference}
                  </span>
                  <h2 className="text-lg font-bold text-ink-primary">
                    Stock Reserved Across {activeSession.orders.length} Child Order(s)
                  </h2>
                </div>
                <Badge variant="warning">{activeSession.status}</Badge>
              </div>

              <AlertBanner
                variant="info"
                title="FEFO Reservation Active"
                description={`Complete payment before ${new Date(activeSession.expiresAt).toLocaleTimeString()} to prevent automatic stock release.`}
              />

              <div className="divide-y divide-border-subtle">
                {activeSession.orders.map((child) => (
                  <div key={child.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-ink-primary">
                        {child.orderNumber} — {child.pharmacyName}
                      </p>
                      <p className="text-xs text-ink-secondary">
                        {child.items.length} line item(s) • Delivery Fee ₹{child.deliveryFee.toFixed(2)} • Tax ₹
                        {child.taxAmount.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-ink-primary tabular-nums">
                      ₹{child.grandTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-ink-primary">Gateway Callback / Signature Verification</h3>
              <p className="text-xs text-ink-secondary">
                Pay via Razorpay Checkout below, or submit a signed Razorpay payment verification payload for{' '}
                <code className="font-mono">{activeSession.razorpayOrderId}</code>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Razorpay Payment ID"
                  value={manualPaymentId}
                  onChange={(e) => setManualPaymentId(e.target.value)}
                  placeholder="pay_..."
                />
                <Input
                  label="HMAC-SHA256 Signature"
                  value={manualSignature}
                  onChange={(e) => setManualSignature(e.target.value)}
                  placeholder="hex signature"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!manualPaymentId || !manualSignature}
                loading={confirmPaymentMutation.isPending}
                onClick={() =>
                  confirmPaymentMutation.mutate({
                    paymentId: manualPaymentId.trim(),
                    orderId: activeSession.razorpayOrderId ?? '',
                    signature: manualSignature.trim(),
                  })
                }
              >
                Verify Signature &amp; Confirm Orders
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-ink-primary">Payable Amount</h2>
              <p className="text-3xl font-bold text-ink-primary tabular-nums">
                ₹{activeSession.grandTotal.toFixed(2)}
              </p>
              <p className="text-xs text-ink-secondary">
                Delivering to: {activeSession.deliveryRecipientName}, {activeSession.deliveryAddressLine1},{' '}
                {activeSession.deliveryCity} ({activeSession.deliveryPostalCode})
              </p>

              <Button
                type="button"
                fullWidth
                size="lg"
                onClick={() => void handleOpenRazorpay()}
                loading={confirmPaymentMutation.isPending}
                leftIcon={<CreditCard className="h-4 w-4" />}
              >
                Pay ₹{activeSession.grandTotal.toFixed(2)} with Razorpay
              </Button>

              <Button
                type="button"
                fullWidth
                variant="outline"
                onClick={() => navigate(`/customer/checkout/status/${activeSession.checkoutReference}`)}
              >
                Check Backend Payment Status
              </Button>

              <Button
                type="button"
                fullWidth
                variant="outline"
                loading={cancelSessionMutation.isPending}
                onClick={() => cancelSessionMutation.mutate()}
                leftIcon={<AlertTriangle className="h-4 w-4" />}
              >
                Cancel Checkout &amp; Release Stock
              </Button>

              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <CheckCircle2 className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                <span>Idempotent payment verification guarantees stock is never deducted twice.</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
