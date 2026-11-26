import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Building2, CheckCircle2, Package } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, PageLoader } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { ordersApi } from '@/features/orders/ordersApi';
import { normalizeApiError } from '@/lib/errorHandler';

export function OrderConfirmationPage() {
  const { checkoutReference = '' } = useParams();

  const sessionQuery = useQuery({
    queryKey: ['customer', 'checkout', 'session', checkoutReference],
    queryFn: () => ordersApi.getCheckoutSession(checkoutReference),
    enabled: Boolean(checkoutReference),
  });

  if (sessionQuery.isLoading) {
    return <PageLoader message="Loading your confirmed orders..." />;
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <AlertBanner
        variant="error"
        title="Checkout confirmation unavailable"
        description={normalizeApiError(sessionQuery.error).message}
      />
    );
  }

  const session = sessionQuery.data;

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="border-brand-600/40 bg-brand-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-7 w-7 text-brand-700 shrink-0" aria-hidden="true" />
            <div>
              <Badge variant="brand">Checkout {session.status}</Badge>
              <h1 className="mt-2 text-2xl font-bold text-ink-primary">
                Orders Confirmed ({session.checkoutReference})
              </h1>
              <p className="mt-1 text-sm text-ink-secondary">
                Payment reference <span className="font-mono">{session.paymentReference}</span> verified.
                Your purchase has been split into {session.orders.length} independent pharmacy order(s).
              </p>
            </div>
          </div>

          <div className="text-right tabular-nums">
            <span className="text-xs text-ink-muted">Total Paid</span>
            <p className="text-2xl font-bold text-ink-primary">₹{session.grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {session.orders.map((order) => (
          <Card key={order.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
                <div>
                  <span className="font-mono text-sm font-bold text-ink-primary">{order.orderNumber}</span>
                  <p className="text-xs text-ink-secondary">
                    {order.pharmacyName} • {order.pharmacyCity}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">{order.status}</Badge>
                <span className="font-bold text-sm tabular-nums">₹{order.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <ul className="space-y-1 text-xs text-ink-secondary">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.medicineName} × {item.quantity}
                  </span>
                  <span className="font-semibold tabular-nums">₹{item.lineSubtotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-end pt-1">
              <Link to={`/customer/orders/${order.id}`}>
                <Button size="sm" variant="outline" leftIcon={<Package className="h-3.5 w-3.5" />}>
                  Track Pharmacy Order
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to={ROUTES.CUSTOMER_ORDERS}>
          <Button>View All Orders</Button>
        </Link>
        <Link to={ROUTES.MEDICINES}>
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
