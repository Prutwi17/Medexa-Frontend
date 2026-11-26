import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Heart, MapPin, ShoppingCart, UserCheck } from 'lucide-react';
import { MedicineProductCard } from '@/components/storefront/MedicineProductCard';
import { Badge, Button, Card, PageLoader } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { storefrontApi } from '@/features/storefront/storefrontApi';

export function CustomerDashboardPage() {
  const profileQuery = useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: storefrontApi.getCustomerProfile,
  });

  const cartQuery = useQuery({
    queryKey: ['customer', 'cart'],
    queryFn: () => storefrontApi.getCart(),
  });

  const prescriptionsQuery = useQuery({
    queryKey: ['customer', 'prescriptions', 'summary'],
    queryFn: () => storefrontApi.listCustomerPrescriptions({ size: 20 }),
  });

  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: storefrontApi.listAddresses,
  });

  const wishlistQuery = useQuery({
    queryKey: ['customer', 'wishlist'],
    queryFn: storefrontApi.listWishlist,
  });

  const recentQuery = useQuery({
    queryKey: ['customer', 'recently-viewed'],
    queryFn: storefrontApi.listRecentlyViewed,
  });

  if (profileQuery.isLoading || cartQuery.isLoading) {
    return <PageLoader message="Loading your customer portal..." />;
  }

  const profile = profileQuery.data;
  const cart = cartQuery.data;
  const prescriptions = prescriptionsQuery.data?.items ?? [];
  const addresses = addressesQuery.data ?? [];
  const wishlist = wishlistQuery.data ?? [];
  const approvedRxCount = prescriptions.filter((p) => p.status === 'APPROVED').length;
  const pendingRxCount = prescriptions.filter((p) => p.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">
            Welcome, {profile?.fullName || 'Patient'}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Manage your prescriptions, multi-pharmacy cart, saved medicines, and delivery locations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.MEDICINES}>
            <Button variant="outline" size="sm">
              Browse Medicines
            </Button>
          </Link>
          <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS}>
            <Button size="sm" leftIcon={<FileText className="h-4 w-4" />}>
              Upload Prescription
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Cart</span>
            <ShoppingCart className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-primary tabular-nums">
            {cart?.totalItemCount ?? 0} units
          </p>
          <p className="mt-1 text-xs text-ink-secondary">
            Across {cart?.pharmacyCount ?? 0} dispensing pharmacy(ies)
          </p>
          <Link to={ROUTES.CUSTOMER_CART} className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">
            Review Cart →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Prescriptions</span>
            <FileText className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-primary tabular-nums">
            {approvedRxCount} approved
          </p>
          <p className="mt-1 text-xs text-ink-secondary">{pendingRxCount} pending pharmacist review</p>
          <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS} className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">
            Manage Prescriptions →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Addresses</span>
            <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-primary tabular-nums">{addresses.length}</p>
          <p className="mt-1 text-xs text-ink-secondary">
            {addresses.find((a) => a.defaultAddress)?.postalCode
              ? `Default PIN ${addresses.find((a) => a.defaultAddress)?.postalCode}`
              : 'Add a default delivery address'}
          </p>
          <Link to={ROUTES.CUSTOMER_ADDRESSES} className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">
            Manage Addresses →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Wishlist</span>
            <Heart className="h-4 w-4 text-brand-700" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-primary tabular-nums">{wishlist.length}</p>
          <p className="mt-1 text-xs text-ink-secondary">Saved approved medicines</p>
          <Link to={ROUTES.CUSTOMER_WISHLIST} className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">
            Open Wishlist →
          </Link>
        </Card>
      </div>

      {/* Patient Profile Snapshot */}
      {profile && (
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-surface-soft">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink-primary">{profile.email}</p>
                {profile.bloodGroup && <Badge variant="brand">Blood Group: {profile.bloodGroup}</Badge>}
              </div>
              <p className="text-xs text-ink-secondary">
                {profile.allergies
                  ? `Recorded allergies: ${profile.allergies}`
                  : 'Keep allergies and emergency contact details updated for pharmacist safety review.'}
              </p>
            </div>
          </div>
          <Link to={ROUTES.CUSTOMER_PROFILE}>
            <Button variant="outline" size="sm">
              Edit Health Profile
            </Button>
          </Link>
        </Card>
      )}

      {/* Recently Viewed Medicines */}
      {recentQuery.data && recentQuery.data.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Recently Viewed Medicines</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentQuery.data.slice(0, 4).map((med) => (
              <MedicineProductCard key={med.id} medicine={med} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
