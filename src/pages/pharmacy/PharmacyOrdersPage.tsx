import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, Package, Search, Truck, XCircle } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Tabs,
  Textarea,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ordersApi } from '@/features/orders/ordersApi';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { Order, OrderStatus } from '@/types/orders';

type QueueTab = 'PLACED' | 'PHARMACY_ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ALL';

function badgeForStatus(status: OrderStatus): 'brand' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'PLACED' || status === 'PHARMACY_ACCEPTED') return 'brand';
  if (status === 'READY_FOR_PICKUP' || status === 'DELIVERED') return 'success';
  if (status === 'PHARMACY_REJECTED' || status === 'CANCELLED' || status === 'FAILED') return 'danger';
  return 'warning';
}

export function PharmacyOrdersPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<QueueTab>('PLACED');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 250);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['pharmacy', 'orders', { tab, debouncedQuery }],
    queryFn: () =>
      ordersApi.listPharmacyOrders({
        status: tab === 'ALL' ? undefined : (tab as OrderStatus),
        q: debouncedQuery.trim() || undefined,
        size: 30,
      }),
  });

  const decisionMutation = useMutation({
    mutationFn: (vars: { orderId: number; accepted: boolean; reason?: string }) =>
      ordersApi.decidePharmacyOrder(vars.orderId, {
        accepted: vars.accepted,
        reason: vars.reason,
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      setRejectOrder(null);
      setRejectReason('');
      if (detailOrder?.id === updated.id) setDetailOrder(updated);
      notify({
        variant: 'success',
        title: `Order ${updated.status}`,
        message: `${updated.orderNumber} updated.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Action Failed', message: normalizeApiError(err).message });
    },
  });

  const progressMutation = useMutation({
    mutationFn: (vars: { orderId: number; status: 'PREPARING' | 'READY_FOR_PICKUP' }) =>
      ordersApi.updatePharmacyOrderStatus(vars.orderId, { status: vars.status }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'] });
      if (detailOrder?.id === updated.id) setDetailOrder(updated);
      notify({
        variant: 'success',
        title: `Order ${updated.status}`,
        message: `${updated.orderNumber} moved cleanly to ${updated.status}.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Status Update Failed', message: normalizeApiError(err).message });
    },
  });

  const inspectOrder = async (orderId: number) => {
    try {
      const full = await ordersApi.getPharmacyOrder(orderId);
      setDetailOrder(full);
    } catch (err) {
      notify({ variant: 'error', title: 'Unable to Load Order', message: normalizeApiError(err).message });
    }
  };

  const openPrescriptionDocument = async (prescriptionId: number) => {
    try {
      const blob = await storefrontApi.fetchPharmacyPrescriptionBlob(prescriptionId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Cannot View Prescription', message: normalizeApiError(err).message });
    }
  };

  const handleRejectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rejectOrder) return;
    decisionMutation.mutate({
      orderId: rejectOrder.id,
      accepted: false,
      reason: rejectReason.trim(),
    });
  };

  if (ordersQuery.isLoading) {
    return <PageLoader message="Loading pharmacy fulfillment orders..." />;
  }

  const orders = ordersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Pharmacy Order Fulfillment Queue</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Review incoming paid orders, inspect attached prescriptions, accept or reject, and advance preparation stages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-12 items-end">
        <div className="sm:col-span-4">
          <Input
            label="Search Order # or Customer"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ORD-... or patient name"
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="sm:col-span-8">
          <Tabs<QueueTab>
            label="Filter pharmacy order queue"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'PLACED', label: 'Incoming Placed' },
              { value: 'PHARMACY_ACCEPTED', label: 'Accepted' },
              { value: 'PREPARING', label: 'Preparing' },
              { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
              { value: 'ALL', label: 'Order History' },
            ]}
          />
        </div>
      </div>

      {ordersQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to fetch pharmacy orders"
          description={normalizeApiError(ordersQuery.error).message}
        />
      ) : orders.length === 0 ? (
        <Card className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No orders in this queue</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Verified customer orders routed to your pharmacy appear here after payment confirmation.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-primary">{order.orderNumber}</span>
                    <Badge variant={badgeForStatus(order.status)}>{order.status}</Badge>
                    {order.requiresPrescription && (
                      <Badge variant={order.allPrescriptionsVerified ? 'success' : 'warning'}>
                        {order.allPrescriptionsVerified ? 'Rx Verified' : 'Rx Pending'}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink-primary">
                    Customer: {order.customerName} ({order.shippingPhone}) • {order.shippingCity}{' '}
                    {order.shippingPostalCode}
                  </p>
                  <p className="text-xs text-ink-secondary tabular-nums">
                    Grand Total: ₹{order.grandTotal.toFixed(2)} • Net Payout: ₹
                    {(order.pharmacyPayoutAmount ?? 0).toFixed(2)} • Items: {order.items.length}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => void inspectOrder(order.id)}
                  >
                    Details
                  </Button>

                  {order.status === 'PLACED' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        loading={decisionMutation.isPending}
                        onClick={() => decisionMutation.mutate({ orderId: order.id, accepted: true })}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setRejectOrder(order);
                          setRejectReason('');
                        }}
                        leftIcon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {order.status === 'PHARMACY_ACCEPTED' && (
                    <Button
                      type="button"
                      size="sm"
                      loading={progressMutation.isPending}
                      onClick={() => progressMutation.mutate({ orderId: order.id, status: 'PREPARING' })}
                    >
                      Start Preparing
                    </Button>
                  )}

                  {(order.status === 'PHARMACY_ACCEPTED' || order.status === 'PREPARING') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={progressMutation.isPending}
                      onClick={() =>
                        progressMutation.mutate({ orderId: order.id, status: 'READY_FOR_PICKUP' })
                      }
                      leftIcon={<Truck className="h-3.5 w-3.5" />}
                    >
                      Mark Ready for Pickup
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `Order Details — ${detailOrder.orderNumber}` : 'Order Details'}
      >
        {detailOrder && (
          <div className="space-y-4 text-sm">
            <div className="rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3 text-xs space-y-1">
              <p>
                <strong>Customer:</strong> {detailOrder.customerName} ({detailOrder.customerEmail})
              </p>
              <p>
                <strong>Delivery Address:</strong> {detailOrder.shippingAddress}, {detailOrder.shippingCity} -{' '}
                {detailOrder.shippingPostalCode}
              </p>
              <p className="tabular-nums">
                <strong>Order Total:</strong> ₹{detailOrder.grandTotal.toFixed(2)} •{' '}
                <strong>Commission:</strong> ₹{(detailOrder.platformCommissionAmount ?? 0).toFixed(2)} •{' '}
                <strong>Pharmacy Payout:</strong> ₹{(detailOrder.pharmacyPayoutAmount ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">Line Items</h3>
              {detailOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--medexa-radius-sm)] border border-border-subtle p-2.5 text-xs space-y-1"
                >
                  <div className="flex justify-between font-semibold text-ink-primary">
                    <span>
                      {item.medicineName} × {item.quantity}
                    </span>
                    <span className="tabular-nums">₹{item.lineSubtotal.toFixed(2)}</span>
                  </div>
                  {item.batchAllocationsSummary && (
                    <p className="text-ink-muted">Batches: {item.batchAllocationsSummary}</p>
                  )}
                  {item.prescriptionRequired && item.prescriptionId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void openPrescriptionDocument(item.prescriptionId!)}
                    >
                      Inspect Authorized Rx ({item.prescriptionReference})
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">Status History</h3>
              <ol className="mt-2 space-y-1.5 border-s-2 border-brand-200 ps-3 text-xs">
                {detailOrder.statusHistory.map((h) => (
                  <li key={h.id}>
                    <strong>{h.newStatus}</strong> — {h.notes} ({new Date(h.createdAt).toLocaleString()})
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        open={Boolean(rejectOrder)}
        onClose={() => setRejectOrder(null)}
        title={rejectOrder ? `Reject Order ${rejectOrder.orderNumber}` : 'Reject Order'}
        description="Rejecting a paid order restores FEFO batch stock automatically and marks the order eligible for refund."
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <Textarea
            label="Mandatory Rejection Reason"
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Damaged batch discovered on shelf check, incomplete prescription"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={decisionMutation.isPending}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
