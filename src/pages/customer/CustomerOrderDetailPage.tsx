import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Download, FileText, KeyRound, MapPin, RefreshCw, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Modal, PageLoader, Textarea } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { ordersApi } from '@/features/orders/ordersApi';
import { paymentsApi } from '@/features/payments/paymentsApi';
import { normalizeApiError } from '@/lib/errorHandler';

export function CustomerOrderDetailPage() {
  const { orderId = '0' } = useParams();
  const numericOrderId = Number(orderId);
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['customer', 'orders', numericOrderId],
    queryFn: () => ordersApi.getCustomerOrder(numericOrderId),
    enabled: Number.isFinite(numericOrderId) && numericOrderId > 0,
  });

  const canViewInvoice =
    detailQuery.data?.paymentStatus === 'PAID' ||
    detailQuery.data?.paymentStatus === 'REFUND_REQUESTED' ||
    detailQuery.data?.paymentStatus === 'REFUNDED';

  const invoiceQuery = useQuery({
    queryKey: ['customer', 'orders', numericOrderId, 'invoice'],
    queryFn: () => paymentsApi.getCustomerInvoice(numericOrderId),
    enabled: Number.isFinite(numericOrderId) && numericOrderId > 0 && Boolean(canViewInvoice),
  });

  const trackingQuery = useQuery({
    queryKey: ['customer', 'orders', numericOrderId, 'tracking'],
    queryFn: () => deliveryApi.getCustomerTracking(numericOrderId),
    enabled: Number.isFinite(numericOrderId) && numericOrderId > 0,
    refetchInterval: (q) => {
      const s = q.state.data?.orderStatus;
      return s && s !== 'DELIVERED' && s !== 'CANCELLED' && s !== 'FAILED' && s !== 'PHARMACY_REJECTED'
        ? 8000
        : false;
    },
  });

  const regenerateOtpMutation = useMutation({
    mutationFn: () => deliveryApi.regenerateCustomerOtp(numericOrderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders', numericOrderId, 'tracking'] });
      notify({
        variant: 'success',
        title: 'Fresh OTP Generated',
        message: 'Share the new 6-digit delivery OTP with your rider at handover.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Cannot Refresh OTP', message: normalizeApiError(err).message });
    },
  });

  const openProofImage = async () => {
    try {
      const blob = await deliveryApi.fetchCustomerProofBlob(numericOrderId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Proof Unavailable', message: normalizeApiError(err).message });
    }
  };

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelCustomerOrder(numericOrderId, cancelReason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
      setCancelOpen(false);
      setCancelReason('');
      notify({
        variant: 'info',
        title: 'Order Cancelled',
        message: 'Inventory restored cleanly and refund eligibility updated.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Cancellation Failed', message: normalizeApiError(err).message });
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      paymentsApi.createCustomerRefund(numericOrderId, {
        reason: refundReason.trim(),
        idempotencyKey: `rfd-${numericOrderId}-${Date.now()}`,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'refunds'] });
      setRefundOpen(false);
      setRefundReason('');
      notify({
        variant: 'success',
        title: 'Refund Requested',
        message: 'Your refund request has been logged for processing.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Refund Request Failed', message: normalizeApiError(err).message });
    },
  });

  const handleDownloadPdf = async () => {
    if (!detailQuery.data) return;
    setDownloadingPdf(true);
    try {
      await paymentsApi.downloadInvoicePdf('customer', detailQuery.data.id, detailQuery.data.orderNumber);
    } catch (err) {
      notify({ variant: 'error', title: 'Invoice Download Failed', message: normalizeApiError(err).message });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (detailQuery.isLoading) {
    return <PageLoader message="Loading order timeline and items..." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <AlertBanner
        variant="error"
        title="Order not found"
        description={normalizeApiError(detailQuery.error).message}
      />
    );
  }

  const order = detailQuery.data;
  const canRequestRefund = order.refundEligible && order.refundStatus === 'ELIGIBLE';

  const submitCancel = (e: FormEvent) => {
    e.preventDefault();
    cancelMutation.mutate();
  };

  const submitRefund = (e: FormEvent) => {
    e.preventDefault();
    refundMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={ROUTES.CUSTOMER_ORDERS}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to All Orders</span>
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-ink-primary">{order.orderNumber}</h1>
              <Badge variant="brand">{order.status}</Badge>
              <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'neutral'}>
                {order.paymentStatus}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-secondary">
              Parent Checkout: <span className="font-mono">{order.checkoutReference}</span> • Delivery Assignment:{' '}
              {order.deliveryAssignmentStatus}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canViewInvoice && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={downloadingPdf}
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => void handleDownloadPdf()}
              >
                Download PDF Invoice
              </Button>
            )}
            {order.cancellableByCustomer && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={() => setCancelOpen(true)}
              >
                Cancel Order
              </Button>
            )}
            {canRequestRefund && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => setRefundOpen(true)}
              >
                Request Refund
              </Button>
            )}
          </div>
        </div>
      </div>

      {order.refundStatus !== 'NONE' && (
        <AlertBanner
          variant="info"
          title={`Refund Status: ${order.refundStatus}`}
          description={order.refundReason || order.cancellationReason || 'Refund status tracked on this child order.'}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary">Ordered Medicines</h2>
            <div className="divide-y divide-border-subtle">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/medicines/${item.medicineSlug}`}
                      className="font-semibold text-ink-primary hover:text-brand-700 hover:underline"
                    >
                      {item.medicineName}
                    </Link>
                    <p className="text-xs text-ink-secondary">
                      {item.brand} • {item.packSize} • Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant={item.prescriptionRequired ? 'warning' : 'success'}>
                        {item.prescriptionRequired ? `Rx (${item.classificationCode})` : 'OTC'}
                      </Badge>
                      {item.prescriptionReference && (
                        <Badge variant="neutral">Rx: {item.prescriptionReference}</Badge>
                      )}
                    </div>
                    {item.batchAllocationsSummary && (
                      <p className="mt-1 text-[11px] text-ink-muted">
                        Batches allocated (FEFO): {item.batchAllocationsSummary}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm font-bold text-ink-primary tabular-nums">
                    ₹{item.lineSubtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary">Live Delivery, OTP &amp; Fulfillment Status</h2>
            {trackingQuery.data ? (
              <div className="space-y-4 text-xs">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3">
                    <span className="text-ink-muted">Pharmacy Preparation</span>
                    <p className="mt-1 font-bold text-ink-primary">{trackingQuery.data.orderStatus}</p>
                    {trackingQuery.data.readyAt && (
                      <p className="text-[11px] text-ink-muted">
                        Packed: {new Date(trackingQuery.data.readyAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3">
                    <span className="text-ink-muted">Rider Assignment</span>
                    <p className="mt-1 font-bold text-ink-primary">
                      {trackingQuery.data.deliveryAssignmentStatus}
                    </p>
                    {trackingQuery.data.assignedRiderName && (
                      <p className="text-[11px] text-ink-secondary">
                        Rider: {trackingQuery.data.assignedRiderName} ({trackingQuery.data.assignedRiderVehicleType}{' '}
                        {trackingQuery.data.assignedRiderVehicleNumber})
                      </p>
                    )}
                  </div>
                  <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3">
                    <span className="text-ink-muted">Delivery Status</span>
                    <p className="mt-1 font-bold text-ink-primary">
                      {trackingQuery.data.deliveryStatus || 'Awaiting Dispatch'}
                    </p>
                    {trackingQuery.data.deliveryEtaMinutes && (
                      <p className="text-[11px] text-ink-muted">
                        ETA ~{trackingQuery.data.deliveryEtaMinutes} mins
                      </p>
                    )}
                  </div>
                </div>

                {trackingQuery.data.assignedRiderPhone && (
                  <p className="text-ink-secondary">
                    Rider Contact: <strong>{trackingQuery.data.assignedRiderPhone}</strong>
                    {trackingQuery.data.riderLatitude != null && trackingQuery.data.riderLongitude != null
                      ? ` • Live GPS: ${trackingQuery.data.riderLatitude}, ${trackingQuery.data.riderLongitude}`
                      : ''}
                  </p>
                )}

                <div className="rounded-[var(--medexa-radius-md)] border border-brand-600/30 bg-brand-50/60 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-ink-primary text-sm">
                      <KeyRound className="h-4 w-4 text-brand-700" aria-hidden="true" />
                      <span>Doorstep Delivery OTP Instructions</span>
                    </div>
                    {trackingQuery.data.deliveryStatus === 'OUT_FOR_DELIVERY' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={regenerateOtpMutation.isPending}
                        onClick={() => regenerateOtpMutation.mutate()}
                      >
                        Generate Fresh OTP
                      </Button>
                    )}
                  </div>

                  <p className="text-ink-secondary">{trackingQuery.data.otpInstructions}</p>

                  {trackingQuery.data.deliveryOtp && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="rounded-[var(--medexa-radius-sm)] bg-white px-4 py-2 font-mono text-2xl font-bold tracking-widest text-brand-800 shadow-xs border border-brand-200">
                        {trackingQuery.data.deliveryOtp}
                      </span>
                      <div className="text-[11px] text-ink-muted">
                        <p>
                          Attempts used: {trackingQuery.data.otpAttempts} / {trackingQuery.data.maxOtpAttempts}
                        </p>
                        {trackingQuery.data.otpExpiresAt && (
                          <p>Valid until {new Date(trackingQuery.data.otpExpiresAt).toLocaleTimeString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {trackingQuery.data.hasDeliveryProof && (
                  <div className="flex items-center justify-between rounded-[var(--medexa-radius-sm)] border border-border-subtle p-3">
                    <span className="flex items-center gap-2 font-semibold text-ink-primary">
                      <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                      Delivery Handover Proof Recorded ({trackingQuery.data.proofType})
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={() => void openProofImage()}>
                      View Proof Photo
                    </Button>
                  </div>
                )}

                {trackingQuery.data.deliveryTimeline.length > 0 && (
                  <div>
                    <h3 className="font-bold text-ink-primary flex items-center gap-1.5 mb-2">
                      <Truck className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                      <span>Delivery Dispatch Timeline</span>
                    </h3>
                    <ol className="space-y-2 border-s-2 border-brand-200 ps-3">
                      {trackingQuery.data.deliveryTimeline.map((ev) => (
                        <li key={ev.id}>
                          <p className="font-semibold text-ink-primary">
                            {ev.eventType} ({ev.newStatus})
                          </p>
                          {ev.notes && <p className="text-ink-secondary">{ev.notes}</p>}
                          <p className="text-[11px] text-ink-muted">
                            {new Date(ev.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary">Order Tracking Timeline</h2>
            <ol className="space-y-3 border-s-2 border-brand-200 ps-4">
              {order.statusHistory.map((step) => (
                <li key={step.id} className="text-xs">
                  <p className="font-bold text-ink-primary">
                    {step.newStatus}{' '}
                    <span className="font-normal text-ink-muted">
                      ({step.actorName} • {step.actorRole})
                    </span>
                  </p>
                  {step.notes && <p className="text-ink-secondary">{step.notes}</p>}
                  <p className="text-[11px] text-ink-muted">
                    {new Date(step.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary">Price Breakdown</h2>
            <dl className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-ink-secondary">Items Subtotal</dt>
                <dd className="font-semibold">₹{order.itemsSubtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-secondary">Coupon Discount</dt>
                <dd className="font-semibold text-brand-700">-₹{order.discountAmount.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-secondary">Delivery Fee</dt>
                <dd className="font-semibold">₹{order.deliveryFee.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-secondary">Taxes</dt>
                <dd className="font-semibold">₹{order.taxAmount.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold">
                <dt>Order Total</dt>
                <dd>₹{order.grandTotal.toFixed(2)}</dd>
              </div>
            </dl>
            {invoiceQuery.data && (
              <div className="border-t border-border-subtle pt-3 text-xs text-ink-secondary space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-ink-primary">
                  <FileText className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                  <span>Invoice {invoiceQuery.data.invoiceNumber}</span>
                </div>
                {invoiceQuery.data.paymentReference && (
                  <p className="font-mono text-[11px]">Pay Ref: {invoiceQuery.data.paymentReference}</p>
                )}
                {invoiceQuery.data.taxNote && (
                  <p className="text-[11px] text-ink-muted">{invoiceQuery.data.taxNote}</p>
                )}
              </div>
            )}
          </Card>

          <Card className="space-y-3 text-xs text-ink-secondary">
            <div className="flex items-center gap-2 font-bold text-ink-primary text-sm">
              <Building2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Dispensing Pharmacy</span>
            </div>
            <p className="font-semibold text-ink-primary">{order.pharmacyName}</p>
            <p>{order.pharmacyCity}</p>

            <div className="flex items-center gap-2 font-bold text-ink-primary text-sm border-t border-border-subtle pt-3">
              <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Delivery Address</span>
            </div>
            <p className="font-semibold text-ink-primary">
              {order.shippingRecipientName} ({order.shippingPhone})
            </p>
            <p>
              {order.shippingAddress}, {order.shippingCity}, {order.shippingState} — {order.shippingPostalCode}
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Cancel Order ${order.orderNumber}`}
        description="Eligible orders restore batch inventory automatically and enable refund eligibility for paid transactions."
      >
        <form onSubmit={submitCancel} className="space-y-4">
          <Textarea
            label="Cancellation Reason"
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Explain why you want to cancel this pharmacy order"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Order
            </Button>
            <Button type="submit" variant="danger" loading={cancelMutation.isPending}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title={`Request Refund for ${order.orderNumber}`}
        description={`Order total ₹${order.grandTotal.toFixed(2)} is eligible for refund review.`}
      >
        <form onSubmit={submitRefund} className="space-y-4">
          <Textarea
            label="Refund Reason"
            required
            rows={3}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Provide details for refund settlement"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={refundMutation.isPending}>
              Submit Refund Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
