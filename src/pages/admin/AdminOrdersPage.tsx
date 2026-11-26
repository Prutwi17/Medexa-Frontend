import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, Package, Search } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Select,
} from '@/components/ui';
import { ordersApi } from '@/features/orders/ordersApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { CheckoutSession, Order, OrderPaymentStatus, OrderStatus } from '@/types/orders';

export function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [parentCheckout, setParentCheckout] = useState<CheckoutSession | null>(null);

  const debouncedQuery = useDebounce(searchInput, 250);

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', { statusFilter, paymentFilter, debouncedQuery, page }],
    queryFn: () =>
      ordersApi.listAdminOrders({
        status: (statusFilter || undefined) as OrderStatus | undefined,
        paymentStatus: (paymentFilter || undefined) as OrderPaymentStatus | undefined,
        q: debouncedQuery.trim() || undefined,
        page,
        size: 15,
      }),
  });

  const inspectOrder = async (orderId: number) => {
    const data = await ordersApi.getAdminOrder(orderId);
    setSelectedOrder(data);
  };

  const inspectCheckout = async (checkoutReference: string) => {
    const data = await ordersApi.getAdminParentCheckout(checkoutReference);
    setParentCheckout(data);
  };

  if (ordersQuery.isLoading) {
    return <PageLoader message="Loading platform orders..." />;
  }

  const orders = ordersQuery.data?.items ?? [];
  const pagination = ordersQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Marketplace Order Monitoring</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Monitor parent checkout sessions, split child pharmacy orders, commission payouts, and refund statuses.
        </p>
      </div>

      <Card className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Search Order #, Customer, or Pharmacy"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(0);
          }}
          placeholder="ORD-... or Pharmacy"
          leftAddon={<Search className="h-4 w-4" />}
        />
        <Select
          label="Order Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
            { value: 'PLACED', label: 'Placed' },
            { value: 'PHARMACY_ACCEPTED', label: 'Pharmacy Accepted' },
            { value: 'PHARMACY_REJECTED', label: 'Pharmacy Rejected' },
            { value: 'PREPARING', label: 'Preparing' },
            { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
            { value: 'CANCELLED', label: 'Cancelled' },
            { value: 'FAILED', label: 'Failed' },
          ]}
        />
        <Select
          label="Payment Status"
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(0);
          }}
          options={[
            { value: '', label: 'All Payment States' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'PAID', label: 'Paid' },
            { value: 'REFUND_REQUESTED', label: 'Refund Requested' },
            { value: 'REFUNDED', label: 'Refunded' },
            { value: 'FAILED', label: 'Failed' },
          ]}
        />
      </Card>

      {ordersQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to fetch platform orders"
          description={normalizeApiError(ordersQuery.error).message}
        />
      ) : orders.length === 0 ? (
        <Card className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No orders match current filters</h2>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-ink-primary">{order.orderNumber}</span>
                  <Badge variant="brand">{order.status}</Badge>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                  {order.refundStatus !== 'NONE' && (
                    <Badge variant="danger">Refund: {order.refundStatus}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-secondary">
                  <strong>Pharmacy:</strong> {order.pharmacyName} • <strong>Customer:</strong>{' '}
                  {order.customerName} ({order.customerEmail})
                </p>
                <p className="text-xs text-ink-muted tabular-nums">
                  Total ₹{order.grandTotal.toFixed(2)} • Commission ₹
                  {(order.platformCommissionAmount ?? 0).toFixed(2)} • Payout ₹
                  {(order.pharmacyPayoutAmount ?? 0).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void inspectCheckout(order.checkoutReference)}
                >
                  Parent Checkout
                </Button>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                  onClick={() => void inspectOrder(order.id)}
                >
                  Inspect Order
                </Button>
              </div>
            </Card>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-ink-secondary">
                Page {pagination.page + 1} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPrevious}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Child Order Modal */}
      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Admin Inspection — ${selectedOrder.orderNumber}` : 'Order'}
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3 space-y-1">
              <p>
                <strong>Parent Checkout:</strong> {selectedOrder.checkoutReference}
              </p>
              <p>
                <strong>Pharmacy:</strong> {selectedOrder.pharmacyName} ({selectedOrder.pharmacyCity})
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})
              </p>
              <p className="tabular-nums">
                <strong>Subtotal:</strong> ₹{selectedOrder.itemsSubtotal.toFixed(2)} •{' '}
                <strong>Delivery:</strong> ₹{selectedOrder.deliveryFee.toFixed(2)} •{' '}
                <strong>Tax:</strong> ₹{selectedOrder.taxAmount.toFixed(2)} •{' '}
                <strong>Total:</strong> ₹{selectedOrder.grandTotal.toFixed(2)}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold uppercase text-ink-muted">Status History</h3>
              <ol className="space-y-1 border-s-2 border-brand-200 ps-3">
                {selectedOrder.statusHistory.map((h) => (
                  <li key={h.id}>
                    <strong>{h.newStatus}</strong> ({h.actorRole}): {h.notes}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      {/* Parent Checkout Session Modal */}
      <Modal
        open={Boolean(parentCheckout)}
        onClose={() => setParentCheckout(null)}
        title={parentCheckout ? `Parent Checkout — ${parentCheckout.checkoutReference}` : 'Checkout'}
      >
        {parentCheckout && (
          <div className="space-y-3 text-xs">
            <p>
              <strong>Status:</strong> {parentCheckout.status} • <strong>Grand Total:</strong> ₹
              {parentCheckout.grandTotal.toFixed(2)}
            </p>
            <div className="space-y-2">
              {parentCheckout.orders.map((child) => (
                <div
                  key={child.id}
                  className="rounded-[var(--medexa-radius-sm)] border border-border-subtle p-2.5 flex justify-between"
                >
                  <div>
                    <p className="font-bold text-ink-primary">{child.orderNumber}</p>
                    <p className="text-ink-secondary">{child.pharmacyName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="neutral">{child.status}</Badge>
                    <p className="mt-1 font-bold tabular-nums">₹{child.grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
