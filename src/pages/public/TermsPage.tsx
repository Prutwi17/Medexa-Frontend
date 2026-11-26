import { Badge, Card } from '@/components/ui';

export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <Badge variant="brand">Marketplace Governance</Badge>
        <h1 className="mt-3 text-3xl font-bold text-ink-primary">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Rules governing medicine listings, prescription verification, pricing, and delivery fulfillment.
        </p>
      </div>

      <Card className="space-y-4 text-sm leading-relaxed text-ink-secondary">
        <section>
          <h2 className="text-base font-bold text-ink-primary">1. Verified Pharmacy Dispensing</h2>
          <p className="mt-1">
            Medexa operates exclusively with pharmacies verified by administrative review. Unapproved or
            suspended pharmacies cannot list or fulfill medicines.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-primary">2. Prescription Gatekeeping &amp; Non-Substitution</h2>
          <p className="mt-1">
            Medicines governed by Schedule H, Schedule H1, Schedule X, or flagged Rx-required cannot be
            dispatched without an approved, unexpired prescription. Automatic substitution of prescribed
            medications is never performed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-primary">3. Batch Pricing, Stock &amp; Delivery Zones</h2>
          <p className="mt-1">
            All unit prices, delivery zone fees, minimum order thresholds, and quantity caps are enforced
            server-side using First-Expiry-First-Out (FEFO) batch stock records.
          </p>
        </section>
      </Card>
    </div>
  );
}
