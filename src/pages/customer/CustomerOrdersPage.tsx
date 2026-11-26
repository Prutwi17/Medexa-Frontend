import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, PageLoader, Tabs } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { ordersApi } from '@/features/orders/ordersApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { OrderStatus } from '@/types/orders';

type OrderTab = 'ALL' | 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'CANCELLED';

function statusBadgeVariant(status: OrderStatus): 'brand' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'PLACED' || status === 'PHARMACY_ACCEPTED') return 'brand';
  if (status === 'READY_FOR_PICKUP' || status === 'DELIVERED') return 'success';
  if (status === 'CANCELLED' || status === 'PHARMACY_REJECTED' || status === 'FAILED') return 'danger';
  return 'warning';
}

export function CustomerOrdersPage() {
  const [tab, setTab] = useState<OrderTab>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const debouncedQuery = useDebounce(searchInput, 250);

  const ordersQuery = useQuery({
    queryKey: ['customer', 'orders', { tab, debouncedQuery, page }],
    queryFn: () =>
      ordersApi.listCustomerOrders({
        status: tab === 'ALL' ? undefined : (tab as OrderStatus),
        q: debouncedQuery.trim() || undefined,
        page,
        size: 10,
      }),
  });

  if (ordersQuery.isLoading) {
    return <PageLoader message="Loading your pharmacy order history..." />;
  }

  const orders = ordersQuery.data?.items ?? [];
  const pagination = ordersQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Order History &amp; Tracking</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Track individual child orders per dispensing pharmacy, view timelines, cancel eligible orders, or request refunds.
          </p>
        </div>
        <Link to={ROUTES.MEDICINES}>
          <Button variant="outline" size="sm">
            Shop Medicines
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-12 items-end">
        <div className="sm:col-span-5">
          <Input
            label="Search by Order # or Pharmacy"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            placeholder="ORD-... or Pharmacy name"
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="sm:col-span-7">
          <Tabs<OrderTab>
            label="Filter orders by status"
            value={tab}
            onChange={(next) => {
              setTab(next);
              setPage(0);
            }}
            options={[
              { value: 'ALL', label: 'All Orders' },
              { value: 'PLACED', label: 'Placed' },
              { value: 'PREPARING', label: 'Preparing' },
              { value: 'READY_FOR_PICKUP', label: 'Ready' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {ordersQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to fetch orders"
          description={normalizeApiError(ordersQuery.error).message}
        />
      ) : orders.length === 0 ? (
        <Card className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No matching orders</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Placed pharmacy orders and their live status transitions appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-primary">{order.orderNumber}</span>
                    <Badge variant={statusBadgeVariant(order.status)}>{order.status}</Badge>
                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'neutral'}>
                      Payment: {order.paymentStatus}
                    </Badge>
                    {order.refundStatus !== 'NONE' && (
                      <Badge variant="warning">Refund: {order.refundStatus}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink-primary">
                    {order.pharmacyName} ({order.pharmacyCity})
                  </p>
                  <p className="text-xs text-ink-muted">
                    Parent Checkout: <span className="font-mono">{order.checkoutReference}</span> •{' '}
                    {order.items.length} item(s) • Placed {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right tabular-nums">
                    <span className="text-xs text-ink-muted">Order Total</span>
                    <p className="text-lg font-bold text-ink-primary">₹{order.grandTotal.toFixed(2)}</p>
                  </div>
                  <Link to={`/customer/orders/${order.id}`}>
                    <Button size="sm">View &amp; Track</Button>
                  </Link>
                </div>
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
    </div>
  );
}
