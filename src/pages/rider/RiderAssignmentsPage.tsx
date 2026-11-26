import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, PackageCheck, Truck } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, PageLoader, Select } from '@/components/ui';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import type { DeliveryStatus } from '@/types/delivery';

export function RiderAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const historyQuery = useQuery({
    queryKey: ['rider', 'deliveries', 'history', statusFilter],
    queryFn: () =>
      deliveryApi.listRiderDeliveryHistory({
        status: (statusFilter || undefined) as DeliveryStatus | undefined,
        size: 30,
      }),
  });

  if (historyQuery.isLoading) {
    return <PageLoader message="Loading your assigned and completed deliveries..." />;
  }

  const deliveries = historyQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Rider Assignments &amp; Delivery History</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Review active pickups, completed deliveries, proof status, and payouts.
        </p>
      </div>

      <div className="max-w-xs">
        <Select
          label="Filter by Delivery Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All Deliveries' },
            { value: 'ASSIGNED', label: 'Assigned' },
            { value: 'ACCEPTED', label: 'Accepted' },
            { value: 'PICKED_UP', label: 'Picked Up' },
            { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { value: 'DELIVERED', label: 'Delivered' },
            { value: 'FAILED', label: 'Failed / Exception' },
          ]}
        />
      </div>

      {deliveries.length === 0 ? (
        <AlertBanner
          variant="info"
          title="No matching deliveries found"
          description="Accepted and completed medicine deliveries appear here automatically."
        />
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <Card key={d.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Truck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                    <span className="font-mono text-sm font-bold text-ink-primary">{d.deliveryReference}</span>
                    <Badge
                      variant={
                        d.status === 'DELIVERED'
                          ? 'success'
                          : d.status === 'FAILED'
                            ? 'danger'
                            : 'brand'
                      }
                    >
                      {d.status}
                    </Badge>
                    <Badge variant="neutral">{d.orderNumber}</Badge>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-ink-secondary">
                    <p className="flex items-center gap-1.5">
                      <PackageCheck className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                      <span>
                        <strong>Pickup:</strong> {d.pharmacyName} ({d.pharmacyPostalCode})
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                      <span>
                        <strong>Drop:</strong> {d.customerAddress}, {d.customerCity} - {d.customerPostalCode}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right tabular-nums">
                  <p className="text-base font-bold text-ink-primary">₹{d.estimatedEarning.toFixed(2)}</p>
                  <p className="text-xs text-ink-muted">{d.distanceKm} km</p>
                  <Link to={`/rider/deliveries/${d.id}`} className="mt-2 inline-block">
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                      Manage / Timeline
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
