import { Building2, FileCheck2, Lock, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardDescription, CardTitle } from '@/components/ui';
import { ROUTES } from '@/config/routes';

const CLINICAL_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Drug-License Verified Pharmacies',
    description:
      'Every pharmacy operating on Medexa submits valid retail drug licenses and registered pharmacist credentials for admin approval before listing products.',
  },
  {
    icon: FileCheck2,
    title: 'Pharmacist-Verified Prescriptions',
    description:
      'Schedule H, H1, and X medicines require uploaded medical prescriptions approved by authorized pharmacy personnel prior to dispatch.',
  },
  {
    icon: Truck,
    title: 'Batch Traceability & FEFO Inventory',
    description:
      'Orders reserve stock using First-Expiry-First-Out batch rules with full stock movement history and expiry protection.',
  },
  {
    icon: Lock,
    title: 'OTP-Protected Handover & Auditability',
    description:
      'Independent order tracking per dispensing pharmacy paired with OTP confirmation ensures authentic patient-side delivery.',
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <Badge variant="brand" icon={<Building2 className="h-3.5 w-3.5" />}>
          About Medexa
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-primary sm:text-4xl">
          Clinical-grade multi-vendor medicine delivery built on accountability.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-secondary">
          Medexa connects patients with verified local pharmacies through a regulated digital
          storefront. Instead of opaque fulfillment, every listing, batch, prescription approval, and
          delivery zone is verified against pharmacy licenses and government-recognized schedule rules.
        </p>
      </header>

      <section aria-labelledby="pillars-heading" className="grid gap-5 sm:grid-cols-2">
        <h2 id="pillars-heading" className="visually-hidden">
          Clinical Safety Pillars
        </h2>
        {CLINICAL_PILLARS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="h-full">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--medexa-radius-md)] bg-brand-100 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="mt-3">{item.title}</CardTitle>
              <CardDescription className="mt-1.5 text-sm leading-relaxed">
                {item.description}
              </CardDescription>
            </Card>
          );
        })}
      </section>

      <Card className="bg-surface-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-ink-primary">Strict Non-Substitution Policy</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Medexa never automatically substitutes prescribed molecules or strengths. Medicines are
              dispensed strictly as approved by a licensed practitioner and reviewed by the dispensing
              pharmacy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.MEDICINES}>
              <Button>Explore Catalog</Button>
            </Link>
            <Link to={ROUTES.PHARMACIES}>
              <Button variant="outline">Verified Pharmacies</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
