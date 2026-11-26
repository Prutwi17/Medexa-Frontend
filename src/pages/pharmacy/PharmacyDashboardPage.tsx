import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, MapPin, PackageCheck, Pill, ShieldCheck } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, CardDescription, CardTitle, PageLoader, Table, type TableColumn } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { catalogApi } from '@/features/catalog/catalogApi';
import type { MedicineBatch } from '@/types/catalog';

export function PharmacyDashboardPage() {
  const profileQuery = useQuery({
    queryKey: ['pharmacy', 'profile'],
    queryFn: catalogApi.getPharmacyProfile,
  });

  const medicinesQuery = useQuery({
    queryKey: ['pharmacy', 'medicines', 'summary'],
    queryFn: () => catalogApi.listPharmacyMedicines({ size: 50 }),
  });

  const expiryAlertsQuery = useQuery({
    queryKey: ['pharmacy', 'expiry-alerts', 60],
    queryFn: () => catalogApi.getExpiryAlerts(60),
  });

  if (profileQuery.isLoading) {
    return <PageLoader message="Loading pharmacy console..." />;
  }

  const profile = profileQuery.data;
  const medicines = medicinesQuery.data?.items ?? [];
  const alerts = expiryAlertsQuery.data ?? [];

  const approvedCount = medicines.filter((m) => m.approvalStatus === 'APPROVED').length;
  const pendingCount = medicines.filter((m) => m.approvalStatus === 'PENDING_APPROVAL').length;
  const rejectedCount = medicines.filter((m) => m.approvalStatus === 'REJECTED').length;

  const alertColumns: TableColumn<MedicineBatch>[] = [
    { key: 'medicineName', header: 'Medicine', isRowHeader: true, render: (b) => b.medicineName },
    { key: 'batchNumber', header: 'Batch #', render: (b) => b.batchNumber },
    { key: 'expiryDate', header: 'Expiry Date', render: (b) => b.expiryDate },
    {
      key: 'daysUntilExpiry',
      header: 'Status',
      render: (b) => (
        <Badge variant={b.expired ? 'danger' : 'warning'}>
          {b.expired ? 'Expired' : `${b.daysUntilExpiry} days left`}
        </Badge>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available',
      align: 'right',
      render: (b) => <span className="tabular-nums">{b.availableQuantity}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">
            {profile?.pharmacyName || 'Pharmacy Partner Console'}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Manage drug licenses, delivery zones, approved medicines, and FEFO batch stock.
          </p>
        </div>
        {profile && (
          <Badge
            variant={profile.verificationStatus === 'APPROVED' ? 'success' : 'warning'}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            {profile.verificationStatus.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {profile && profile.verificationStatus !== 'APPROVED' && (
        <AlertBanner
          variant="warning"
          title="Verification required before catalog submissions"
          description={
            profile.rejectionReason ||
            'Your pharmacy license is awaiting administrator verification.'
          }
          action={
            <Link to={ROUTES.PHARMACY_PROFILE} className="text-xs font-semibold underline">
              Review Profile &amp; License
            </Link>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Approved Medicines</span>
            <Pill className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2 text-2xl tabular-nums">{approvedCount}</CardTitle>
          <CardDescription className="mt-1 text-xs">
            {pendingCount} pending • {rejectedCount} rejected
          </CardDescription>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Delivery Zones</span>
            <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2 text-2xl tabular-nums">
            {profile?.deliveryZones.filter((z) => z.active).length ?? 0}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            {profile?.deliveryZones.length ?? 0} total configured zones
          </CardDescription>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Expiry Alerts</span>
            <AlertTriangle className="h-4 w-4 text-[#b54708]" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2 text-2xl tabular-nums">{alerts.length}</CardTitle>
          <CardDescription className="mt-1 text-xs">Expiring within 60 days</CardDescription>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Order Intake</span>
            <Building2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2 text-xl">
            {profile?.acceptingOrders ? 'Accepting' : 'Paused'}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">Storefront fulfillment toggle</CardDescription>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to={ROUTES.PHARMACY_MEDICINES}>
          <Button leftIcon={<Pill className="h-4 w-4" />}>Manage Medicines</Button>
        </Link>
        <Link to={ROUTES.PHARMACY_INVENTORY}>
          <Button variant="outline" leftIcon={<PackageCheck className="h-4 w-4" />}>
            Manage Batches &amp; Stock
          </Button>
        </Link>
        <Link to={ROUTES.PHARMACY_PROFILE}>
          <Button variant="outline" leftIcon={<MapPin className="h-4 w-4" />}>
            Profile, Licenses &amp; Zones
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-ink-primary">
          Upcoming Batch Expiry Alerts (Next 60 Days)
        </h2>
        <Table
          caption="Batches expiring within 60 days"
          columns={alertColumns}
          data={alerts}
          rowKey={(b) => b.id}
          emptyMessage="No batches are expiring within the next 60 days."
        />
      </div>
    </div>
  );
}
