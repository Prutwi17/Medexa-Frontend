import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import { AlertBanner, Badge, Button, Card, PageLoader } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { ordersApi } from '@/features/orders/ordersApi';
import { paymentsApi } from '@/features/payments/paymentsApi';
import { normalizeApiError } from '@/lib/errorHandler';

export function CheckoutPaymentStatusPage() {
  const { checkoutReference = '' } = useParams();
  const [searchParams] = useSearchParams();
  const outcomeHint = searchParams.get('outcome');
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [downloadingOrderId, setDownloadingOrderId] = useState<number | null>(null);

  const sessionQuery = useQuery({
    queryKey: ['customer', 'checkout', 'session', checkoutReference],
    queryFn: () => ordersApi.getCheckoutSession(checkoutReference),
    enabled: Boolean(checkoutReference),
    refetchInterval: (query) => (query.state.data?.status === 'AWAITING_PAYMENT' ? 5000 : false),
  });

  const paymentQuery = useQuery({
    queryKey: ['customer', 'payment', sessionQuery.data?.paymentReference ?? 'none'],
    queryFn: () => paymentsApi.getCustomerPayment(sessionQuery.data!.paymentReference!),
    enabled: Boolean(sessionQuery.data?.paymentReference),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'CREATED' || status === 'AUTHORIZED' ? 5000 : false;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => {
      const payRef = sessionQuery.data?.paymentReference;
      if (!payRef) {
        throw new Error('Payment reference is not available yet.');
      }
      return paymentsApi.verifyCustomerPayment(payRef, paymentQuery.data?.gatewayPaymentId ?? undefined);
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'checkout', 'session', checkoutReference] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'payment'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
      notify({
        variant: updated.status === 'CAPTURED' ? 'success' : updated.status === 'FAILED' ? 'error' : 'info',
        title: `Gateway Status: ${updated.status}`,
        message: `Verified server-side with Razorpay (${updated.lastGatewayStatus || updated.status}).`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Server Verification Failed', message: normalizeApiError(err).message });
    },
  });

  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
    setDownloadingOrderId(orderId);
    try {
      await paymentsApi.downloadInvoicePdf('customer', orderId, orderNumber);
    } catch (err) {
      notify({ variant: 'error', title: 'Invoice Download Failed', message: normalizeApiError(err).message });
    } finally {
      setDownloadingOrderId(null);
    }
  };

  if (sessionQuery.isLoading) {
    return <PageLoader message="Checking server-verified payment status..." />;
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <AlertBanner
        variant="error"
        title="Checkout session unavailable"
        description={normalizeApiError(sessionQuery.error).message}
      />
    );
  }

  const session = sessionQuery.data;
  const payment = paymentQuery.data;

  const isPaid = session.status === 'PAID' || payment?.status === 'CAPTURED';
  const isFailed =
    session.status === 'FAILED' ||
    session.status === 'EXPIRED' ||
    session.status === 'CANCELLED' ||
    payment?.status === 'FAILED' ||
    outcomeHint === 'failed';

  return (
    <div className="max-w-3xl space-y-6">
      <Card
        className={
          isPaid
            ? 'border-brand-600/40 bg-brand-50/70 space-y-4'
            : isFailed
              ? 'border-[#fda29b] bg-[#fef3f2] space-y-4'
              : 'border-amber-300 bg-amber-50/60 space-y-4'
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {isPaid ? (
              <CheckCircle2 className="mt-0.5 h-7 w-7 text-brand-700 shrink-0" aria-hidden="true" />
            ) : isFailed ? (
              <XCircle className="mt-0.5 h-7 w-7 text-[#b42318] shrink-0" aria-hidden="true" />
            ) : (
              <Clock className="mt-0.5 h-7 w-7 text-amber-700 shrink-0" aria-hidden="true" />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isPaid ? 'success' : isFailed ? 'danger' : 'warning'}>
                  Checkout: {session.status}
                </Badge>
                {payment && <Badge variant="neutral">Payment: {payment.status}</Badge>}
              </div>

              <h1 className="mt-2 text-2xl font-bold text-ink-primary">
                {isPaid
                  ? 'Payment Verified & Confirmed'
                  : isFailed
                    ? 'Payment Not Completed'
                    : 'Payment Pending Server Verification'}
              </h1>

              <p className="mt-1 text-sm text-ink-secondary">
                {isPaid
                  ? `Razorpay capture verified server-side for checkout ${session.checkoutReference}. Invoices are ready below.`
                  : isFailed
                    ? session.failureReason ||
                      payment?.failureReason ||
                      'Your payment failed, timed out, or was cancelled. Reserved inventory has been released.'
                    : 'Orders are only finalized after backend signature or webhook capture verification completes.'}
              </p>
            </div>
          </div>

          <div className="text-right tabular-nums">
            <span className="text-xs text-ink-muted">Order Total</span>
            <p className="text-2xl font-bold text-ink-primary">₹{session.grandTotal.toFixed(2)}</p>
          </div>
        </div>

        <dl className="grid gap-3 border-t border-border-subtle pt-4 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-ink-muted">Checkout Reference</dt>
            <dd className="font-mono font-semibold text-ink-primary">{session.checkoutReference}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Internal Payment Ref</dt>
            <dd className="font-mono font-semibold text-ink-primary">{session.paymentReference || 'Pending'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Razorpay Order / Payment ID</dt>
            <dd className="font-mono font-semibold text-ink-primary">
              {payment?.gatewayPaymentId || session.razorpayOrderId || '—'}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3 pt-2">
          {!isPaid && !isFailed && session.paymentReference && (
            <Button
              type="button"
              onClick={() => verifyMutation.mutate()}
              loading={verifyMutation.isPending}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Verify Payment Status Now
            </Button>
          )}
          {isPaid && (
            <Link to={`/customer/checkout/confirmation/${session.checkoutReference}`}>
              <Button leftIcon={<CheckCircle2 className="h-4 w-4" />}>View Confirmed Orders</Button>
            </Link>
          )}
          {isFailed && (
            <Link to={ROUTES.CUSTOMER_CART}>
              <Button leftIcon={<ShoppingCart className="h-4 w-4" />}>Return to Cart &amp; Retry</Button>
            </Link>
          )}
          <Link to={ROUTES.CUSTOMER_PAYMENTS}>
            <Button variant="outline" leftIcon={<CreditCard className="h-4 w-4" />}>
              Payment History
            </Button>
          </Link>
        </div>
      </Card>

      {isPaid && session.orders.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-ink-primary">Download Pharmacy PDF Invoices</h2>
          <div className="divide-y divide-border-subtle">
            {session.orders.map((order) => (
              <div key={order.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-ink-primary">{order.orderNumber}</p>
                  <p className="text-xs text-ink-secondary">
                    {order.pharmacyName} • ₹{order.grandTotal.toFixed(2)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={downloadingOrderId === order.id}
                  onClick={() => void handleDownloadInvoice(order.id, order.orderNumber)}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download PDF Invoice
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!isPaid && !isFailed && (
        <AlertBanner
          variant="info"
          title="Delayed UPI / Bank Confirmations"
          description="If money was debited by your bank, do not pay twice immediately. This page checks server verification every 5 seconds and updates automatically when Razorpay sends capture confirmation."
        />
      )}

      {isFailed && (
        <AlertBanner
          variant="warning"
          title="No Double Deduction"
          description="Any batch stock reserved for this failed checkout attempt has been automatically released. You can safely review your cart and start a fresh payment."
        />
      )}

      {payment && payment.events.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-primary">
            <AlertCircle className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Payment Verification Timeline</span>
          </div>
          <ol className="space-y-2 border-s-2 border-brand-200 ps-3 text-xs">
            {payment.events.map((ev) => (
              <li key={ev.id}>
                <p className="font-semibold text-ink-primary">
                  {ev.eventType} ({ev.newStatus}){' '}
                  <span className="font-normal text-ink-muted">via {ev.eventSource}</span>
                </p>
                {ev.notes && <p className="text-ink-secondary">{ev.notes}</p>}
                <p className="text-[11px] text-ink-muted">{new Date(ev.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
