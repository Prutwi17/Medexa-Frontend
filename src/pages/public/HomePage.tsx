import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Lock,
  Pill,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { AlertBanner, Badge, Button, Card, CardDescription, CardTitle, Modal } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { useHealthCheck } from '@/features/system/useHealthCheck';

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Licensed Pharmacy Verification',
    description:
      'Every partner pharmacy undergoes drug license validation and zone verification before listing medicines.',
  },
  {
    icon: FileCheck2,
    title: 'Pharmacist-Reviewed Prescriptions',
    description:
      'Schedule-controlled medicines require an approved prescription reviewed by authorized pharmacy personnel.',
  },
  {
    icon: Pill,
    title: 'Batch & Expiry Traceability',
    description:
      'Real-time batch reservations protect stock integrity and ensure medicines meet shelf-life thresholds.',
  },
  {
    icon: Lock,
    title: 'OTP-Confirmed Handover',
    description:
      'Every pharmacy order is independently tracked and verified at your doorstep with a delivery confirmation OTP.',
  },
];

const CATEGORIES = [
  { name: 'Prescription Care', count: 'Rx Required', icon: ClipboardCheck },
  { name: 'Chronic Therapy', count: 'Cardiac & Diabetes', icon: Activity },
  { name: 'Antibiotics & Infection', count: 'Licensed Dispensing', icon: ShieldCheck },
  { name: 'Pain & Fever Relief', count: 'OTC Essentials', icon: Pill },
];

const ROLE_PORTALS = [
  {
    role: 'Customer',
    title: 'Patient & Caregiver Portal',
    description: 'Search medicines, upload prescriptions, manage multi-pharmacy carts, and track OTP deliveries.',
    to: ROUTES.CUSTOMER_DASHBOARD,
    cta: 'Open Customer Portal',
  },
  {
    role: 'Pharmacy',
    title: 'Pharmacy Partner Console',
    description: 'Manage drug license status, batch inventory, prescription reviews, orders, and payout ledgers.',
    to: ROUTES.PHARMACY_DASHBOARD,
    cta: 'Open Pharmacy Console',
  },
  {
    role: 'Rider',
    title: 'Delivery Rider Hub',
    description: 'Accept system-assigned pharmacy pickups, update transit milestones, and confirm doorstep OTPs.',
    to: ROUTES.RIDER_DASHBOARD,
    cta: 'Open Rider Hub',
  },
  {
    role: 'Admin',
    title: 'Operations Command',
    description: 'Verify pharmacy licenses, approve medicine listings, oversee payouts, and inspect audit trails.',
    to: ROUTES.ADMIN_DASHBOARD,
    cta: 'Open Admin Operations',
  },
];

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rxGuideOpen, setRxGuideOpen] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const healthQuery = useHealthCheck();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate(ROUTES.MEDICINES);
      return;
    }
    navigate(`${ROUTES.MEDICINES}?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-border-subtle bg-gradient-to-b from-brand-50/80 to-surface-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" icon={<Building2 className="h-3.5 w-3.5" />}>
                Multi-Vendor Licensed Pharmacy Network
              </Badge>
              {healthQuery.isSuccess && (
                <Badge variant="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                  API Connected
                </Badge>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-primary sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
              Verified medicines delivered from licensed neighborhood pharmacies.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
              Search approved medicines across verified pharmacies, submit prescriptions for
              pharmacist validation, check out across multiple pharmacies in a single payment, and
              receive OTP-verified doorstep delivery.
            </p>

            {/* Semantic Search Form */}
            <search className="mt-7">
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-2.5 rounded-[var(--medexa-radius-lg)] border border-border-subtle bg-surface-canvas p-2 shadow-[var(--medexa-shadow-sm)] sm:flex-row sm:items-center"
              >
                <label htmlFor="hero-medicine-search" className="visually-hidden">
                  Search medicines by name, composition, or category
                </label>
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute inset-inline-start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-medicine-search"
                    name="q"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search medicine name, molecule, or category..."
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full min-h-11 rounded-[var(--medexa-radius-md)] bg-transparent ps-10 pe-3 text-base text-ink-primary placeholder:text-ink-muted focus:outline-none"
                  />
                </div>
                <Button type="submit" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Search Catalog
                </Button>
              </form>
            </search>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setRxGuideOpen(true)}>
                Prescription Rules &amp; Compliance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  notify({
                    variant: 'info',
                    title: 'Platform Status',
                    message: healthQuery.isSuccess
                      ? `Medexa backend is ${healthQuery.data.status}.`
                      : 'Frontend workspace is ready. Connect backend MySQL & Spring Boot API when running locally.',
                  })
                }
              >
                Check Service Status
              </Button>
            </div>
          </div>

          {/* Clinical Order Flow Card */}
          <div className="lg:col-span-5">
            <Card elevated padding="lg" className="border-brand-100 bg-surface-canvas">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    End-to-End Clinical Workflow
                  </p>
                  <CardTitle className="mt-1">How Medexa Safeguards Every Order</CardTitle>
                </div>
                <Truck className="h-5 w-5 text-brand-700" aria-hidden="true" />
              </div>

              <ol className="mt-4 space-y-3.5 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-900">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-ink-primary">Verified Catalog &amp; Stock Lock</p>
                    <p className="text-xs text-ink-secondary">
                      Only admin-approved medicines from license-verified pharmacies appear in search.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-900">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-ink-primary">Prescription Gatekeeping</p>
                    <p className="text-xs text-ink-secondary">
                      Rx items cannot enter dispatch until authorized pharmacy personnel approve the upload.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-900">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-ink-primary">Split Pharmacy Fulfillment</p>
                    <p className="text-xs text-ink-secondary">
                      Parent checkout splits cleanly into individual pharmacy orders with separate tracking and OTPs.
                    </p>
                  </div>
                </li>
              </ol>

              {healthQuery.isError && (
                <AlertBanner
                  className="mt-5"
                  variant="warning"
                  title="Backend API offline"
                  description="Start Medexa-Backend with MySQL 8 to enable live API queries."
                />
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Clinical Trust Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="h-full">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--medexa-radius-md)] bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="mt-3.5">{pillar.title}</CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-relaxed">
                  {pillar.description}
                </CardDescription>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Therapeutic Categories */}
      <section className="border-y border-border-subtle bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink-primary">Therapeutic Categories</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Structured catalog groups ready for Phase 3 medicine inventory integration.
              </p>
            </div>
            <Link to={ROUTES.MEDICINES} className="text-sm font-semibold text-brand-700 hover:underline">
              Explore full catalog →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.name} to={ROUTES.MEDICINES} className="group block">
                  <Card className="transition-colors group-hover:border-brand-600">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
                      <Badge variant="neutral">{category.count}</Badge>
                    </div>
                    <p className="mt-3 font-semibold text-ink-primary group-hover:text-brand-800">
                      {category.name}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Portal Directory */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-ink-primary">Platform Role Workspaces</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Dedicated route groups and responsive layouts for every Medexa participant.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_PORTALS.map((portal) => (
            <Card key={portal.role} className="flex flex-col justify-between">
              <div>
                <Badge variant="brand">{portal.role}</Badge>
                <CardTitle className="mt-3">{portal.title}</CardTitle>
                <CardDescription className="mt-1.5 text-xs leading-relaxed">
                  {portal.description}
                </CardDescription>
              </div>
              <Link to={portal.to} className="mt-5 block">
                <Button variant="outline" size="sm" fullWidth>
                  {portal.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <Modal
        open={rxGuideOpen}
        onClose={() => setRxGuideOpen(false)}
        title="Prescription &amp; Dispensing Policy"
        description="Mandatory clinical safeguards enforced by Medexa backend workflows."
        footer={
          <Button variant="primary" onClick={() => setRxGuideOpen(false)}>
            Understood
          </Button>
        }
      >
        <ul className="space-y-2.5 text-sm text-ink-secondary">
          <li>• Only admin-verified pharmacies with active drug licenses can fulfill orders.</li>
          <li>• Prescription-required medicines remain blocked from dispatch until reviewed and approved.</li>
          <li>• All prices, delivery fees, and batch stock reservations are calculated server-side.</li>
          <li>• Handover from rider to customer requires OTP verification.</li>
        </ul>
      </Modal>
    </div>
  );
}
