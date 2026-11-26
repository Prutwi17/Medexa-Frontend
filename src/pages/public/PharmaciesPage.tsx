import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { AlertBanner, Badge, Card, CardDescription, CardTitle, Input, PageLoader } from '@/components/ui';
import { catalogApi } from '@/features/catalog/catalogApi';
import { useDebounce } from '@/hooks/useDebounce';

export function PharmaciesPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 250);

  const pharmaciesQuery = useQuery({
    queryKey: ['public', 'pharmacies', debouncedQuery],
    queryFn: () => catalogApi.listPublicPharmacies({ q: debouncedQuery.trim() || undefined, size: 24 }),
  });

  const pharmacies = pharmaciesQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Verified Partner Pharmacies</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Drug-license-verified pharmacies currently authorized to dispense orders on Medexa.
          </p>
        </div>
        <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          License Verified Network
        </Badge>
      </div>

      <Card className="mt-6">
        <div className="max-w-md">
          <Input
            label="Search pharmacies by name or city"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. Bengaluru, CarePlus"
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {pharmaciesQuery.isLoading ? (
        <PageLoader message="Loading verified pharmacies..." />
      ) : pharmaciesQuery.isError ? (
        <AlertBanner
          className="mt-6"
          variant="error"
          title="Unable to load pharmacies"
          description={(pharmaciesQuery.error as { message?: string })?.message || 'Check backend service.'}
        />
      ) : pharmacies.length === 0 ? (
        <Card className="mt-6 py-10 text-center">
          <Building2 className="mx-auto h-9 w-9 text-ink-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-ink-secondary">
            No verified active pharmacies match your query yet.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} elevated>
              <div className="flex items-start justify-between gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--medexa-radius-md)] bg-brand-100 text-brand-700">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <Badge variant={pharmacy.acceptingOrders ? 'success' : 'neutral'}>
                  {pharmacy.acceptingOrders ? 'Accepting Orders' : 'Temporarily Closed'}
                </Badge>
              </div>
              <CardTitle className="mt-3">{pharmacy.pharmacyName}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                <span>
                  {pharmacy.city}, {pharmacy.state} • {pharmacy.postalCode}
                </span>
              </CardDescription>

              <div className="mt-4 border-t border-border-subtle pt-3">
                <p className="text-xs font-semibold text-ink-secondary">Active Delivery Zones</p>
                {pharmacy.deliveryZones.length === 0 ? (
                  <p className="mt-1 text-xs text-ink-muted">Standard city pickup coverage</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pharmacy.deliveryZones.map((zone) => (
                      <Badge key={zone.id} variant="neutral">
                        {zone.postalCode} ({zone.estimatedDeliveryMinutes}m)
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
