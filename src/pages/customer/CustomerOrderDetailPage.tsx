import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, RefreshCw, XCircle } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Modal, PageLoader, Textarea } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { ordersApi } from '@/features/orders/ordersApi';
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

  const detailQuery = useQuery({
    queryKey: ['customer', 'orders', numericOrderId],
    queryFn: () => ordersApi.getCustomerOrder(numericOrderId),
    enabled: Number.isFinite(numericOrderId) && numericOrderId > 0,
  });

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
    mutationFn: () => ordersApi.requestRefund(numericOrderId, refundReason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
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
