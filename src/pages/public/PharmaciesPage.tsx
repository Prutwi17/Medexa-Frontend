import { Building2, ShieldCheck } from 'lucide-react';
import { AlertBanner, Badge, Card, CardDescription, CardTitle } from '@/components/ui';

export function PharmaciesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Verified Partner Pharmacies</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Only drug-license-verified pharmacies approved by Medexa compliance administrators can
            dispense orders.
          </p>
        </div>
        <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          License Verified Network
        </Badge>
      </div>

      <AlertBanner
        className="mt-6"
        variant="info"
        title="Pharmacy Directory Connects in Phase 3"
        description="Verified pharmacy profiles, delivery pin codes, and operating hours will load from the Pharmacy API."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <Building2 className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <CardTitle className="mt-3">Drug License Screening</CardTitle>
          <CardDescription className="mt-1 text-xs">
            Pharmacies submit Form 20/21 license credentials and pharmacist registration details for
            admin verification.
          </CardDescription>
        </Card>
        <Card>
          <Building2 className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <CardTitle className="mt-3">Zone-Based Serviceability</CardTitle>
          <CardDescription className="mt-1 text-xs">
            Each pharmacy defines active delivery zones so customers see accurate availability and SLA.
          </CardDescription>
        </Card>
        <Card>
          <Building2 className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <CardTitle className="mt-3">Independent Order Fulfillment</CardTitle>
          <CardDescription className="mt-1 text-xs">
            Multi-pharmacy carts split automatically into pharmacy-scoped orders with dedicated riders.
          </CardDescription>
        </Card>
      </div>
    </div>
  );
}
