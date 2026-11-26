import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  FolderTree,
  Lock,
  MapPin,
  Pill,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { MedicineProductCard } from '@/components/storefront/MedicineProductCard';
import { AlertBanner, Badge, Button, Card, CardDescription, CardTitle, Modal } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { resolveMediaUrl } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/AuthContext';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { useHealthCheck } from '@/features/system/useHealthCheck';
import { normalizeApiError } from '@/lib/errorHandler';
import type { PublicMedicine } from '@/types/catalog';
import type { DeliveryZoneCheck } from '@/types/storefront';

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verified Partner Pharmacies',
    description:
      'Partner pharmacies undergo drug license verification and registered pharmacist review before listing any medicine.',
  },
  {
    icon: FileCheck2,
    title: 'Strict Rx Gatekeeping',
    description:
      'Schedule H, H1, and X medicines require pharmacist prescription approval before entering dispatch. Zero automatic substitution.',
  },
  {
    icon: Pill,
    title: 'FEFO Batch & Expiry Control',
    description:
      'Real-time batch reservations track manufacturing dates, shelf life, and exact stock availability across every pharmacy.',
  },
  {
    icon: Lock,
    title: 'Delivery Zone & OTP Verification',
    description:
      'Orders validate against active pharmacy delivery zones and complete with patient-verified handover OTPs.',
  },
];

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [postalInput, setPostalInput] = useState('');
  const [zoneResult, setZoneResult] = useState<DeliveryZoneCheck | null>(null);
  const [rxGuideOpen, setRxGuideOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const { isAuthenticated, user } = useAuth();
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  const healthQuery = useHealthCheck();
  const homeQuery = useQuery({
    queryKey: ['public', 'storefront', 'home'],
    queryFn: storefrontApi.getHomeData,
  });

  const recentlyViewedQuery = useQuery({
    queryKey: ['customer', 'recently-viewed'],
    queryFn: storefrontApi.listRecentlyViewed,
    enabled: isCustomer,
  });

  const wishlistQuery = useQuery({
    queryKey: ['customer', 'wishlist'],
    queryFn: storefrontApi.listWishlist,
    enabled: isCustomer,
  });

  const zoneCheckMutation = useMutation({
    mutationFn: (postalCode: string) => storefrontApi.checkPostalDelivery(postalCode),
    onSuccess: (data) => setZoneResult(data),
    onError: (error) => {
      notify({
        variant: 'error',
        title: 'Postal Code Check Failed',
        message: normalizeApiError(error).message,
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: (medicine: PublicMedicine) =>
      storefrontApi.addToCart({ medicineId: medicine.id, quantity: 1 }),
    onSuccess: (_cart, medicine) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({
        variant: 'success',
        title: 'Added to Cart',
        message: `${medicine.name} was added to your pharmacy cart.`,
      });
    },
    onError: (error) => {
      notify({
        variant: 'error',
        title: 'Unable to Add to Cart',
        message: normalizeApiError(error).message,
      });
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (medicine: PublicMedicine) => {
      const saved = wishlistIds.has(medicine.id);
      if (saved) {
        await storefrontApi.removeFromWishlist(medicine.id);
        return { saved: false, name: medicine.name };
      }
      await storefrontApi.addToWishlist(medicine.id);
      return { saved: true, name: medicine.name };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
      notify({
        variant: 'success',
        title: result.saved ? 'Saved to Wishlist' : 'Removed from Wishlist',
        message: result.name,
      });
    },
    onError: (error) => {
      notify({
        variant: 'error',
        title: 'Wishlist Update Failed',
        message: normalizeApiError(error).message,
      });
    },
  });

  const wishlistIds = new Set((wishlistQuery.data ?? []).map((entry) => entry.medicine.id));

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `${ROUTES.MEDICINES}?q=${encodeURIComponent(query)}` : ROUTES.MEDICINES);
  };

  const handlePostalCheck = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postalInput.trim()) return;
    zoneCheckMutation.mutate(postalInput.trim());
  };

  const handleQuickAdd = (medicine: PublicMedicine) => {
    if (!isCustomer) {
      notify({
        variant: 'info',
        title: 'Customer Sign-In Required',
        message: 'Sign in with a customer account to add medicines to your cart.',
      });
      navigate(ROUTES.LOGIN);
      return;
    }
    addToCartMutation.mutate(medicine);
  };

  const handleWishlist = (medicine: PublicMedicine) => {
    if (!isCustomer) {
      navigate(ROUTES.LOGIN);
      return;
    }
    toggleWishlistMutation.mutate(medicine);
  };

  const homeData = homeQuery.data;

  return (
    <div>
      {/* Main Healthcare Banner & Hero Search */}
      <section className="border-b border-border-subtle bg-gradient-to-b from-brand-50/90 to-surface-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" icon={<Building2 className="h-3.5 w-3.5" />}>
                Verified Multi-Pharmacy Network
              </Badge>
              {healthQuery.isSuccess && (
                <Badge variant="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                  Catalog Live
                </Badge>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-primary sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
              Authentic medicines delivered cleanly from licensed pharmacies near you.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
              Search approved catalog listings by medicine name, brand, or active molecule. Upload
              prescriptions for qualified pharmacist review and verify delivery zone coverage before
              you order.
            </p>

            {/* Primary Search Bar */}
            <search className="mt-7">
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-2.5 rounded-[var(--medexa-radius-lg)] border border-border-strong bg-surface-canvas p-2 shadow-[var(--medexa-shadow-sm)] sm:flex-row sm:items-center"
              >
                <label htmlFor="hero-medicine-search" className="visually-hidden">
                  Search medicines by name, brand, or composition
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
                    placeholder="Search medicine name, composition, or brand..."
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full min-h-11 rounded-[var(--medexa-radius-md)] bg-transparent ps-10 pe-3 text-base text-ink-primary placeholder:text-ink-muted focus:outline-none"
                  />
                </div>
                <Button type="submit" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Search Medicines
                </Button>
              </form>
            </search>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS}>
                <Button variant="secondary" size="sm" leftIcon={<FileCheck2 className="h-4 w-4" />}>
                  Upload Prescription
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setRxGuideOpen(true)}>
                Dispensing &amp; Schedule Rules
              </Button>
              <Link to={ROUTES.MEDICINES} className="text-xs font-semibold text-brand-700 hover:underline">
                Browse Full Catalog →
              </Link>
            </div>
          </div>

          {/* Live Postal Delivery Checker & Workflow Card */}
          <div className="lg:col-span-5">
            <Card elevated padding="lg" className="border-brand-100 bg-surface-canvas">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Delivery Serviceability
                  </p>
                  <CardTitle className="mt-1">Check Pharmacy Coverage by Postal Code</CardTitle>
                </div>
                <MapPin className="h-5 w-5 text-brand-700" aria-hidden="true" />
              </div>

              <form onSubmit={handlePostalCheck} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="home-postal-check" className="visually-hidden">
                  Postal code
                </label>
                <input
                  id="home-postal-check"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={postalInput}
                  onChange={(e) => setPostalInput(e.target.value)}
                  placeholder="Enter postal code (e.g. 560038)"
                  className="min-h-11 flex-1 rounded-[var(--medexa-radius-md)] border border-border-strong px-3.5 text-base text-ink-primary placeholder:text-ink-muted"
                />
                <Button type="submit" loading={zoneCheckMutation.isPending}>
                  Verify Zone
                </Button>
              </form>

              {zoneResult && (
                <div className="mt-4 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3 text-xs">
                  {zoneResult.serviceable ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-brand-800">
                        {zoneResult.pharmacyCount} verified{' '}
                        {zoneResult.pharmacyCount === 1 ? 'pharmacy delivers' : 'pharmacies deliver'} to{' '}
                        {zoneResult.postalCode}:
                      </p>
                      <ul className="space-y-1 text-ink-secondary">
                        {zoneResult.zones.slice(0, 3).map((z) => (
                          <li key={`${z.pharmacyId}-${z.postalCode}`}>
                            • {z.pharmacyName} — Fee ₹{z.deliveryFee.toFixed(2)}, Min ₹
                            {z.minOrderAmount.toFixed(2)} (~{z.estimatedDeliveryMinutes} min)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-ink-secondary">
                      No active pharmacy delivery zone currently covers postal code{' '}
                      <span className="font-semibold">{zoneResult.postalCode}</span>.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 space-y-2 border-t border-border-subtle pt-4 text-xs text-ink-secondary">
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                  <span>Orders split cleanly by dispensing pharmacy with transparent zone fees.</span>
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                  <span>Schedule H / H1 / X products stay blocked from dispatch until pharmacist approval.</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Medicine Categories from Backend */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink-primary">Shop by Therapeutic Category</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Active catalog categories maintained by Medexa operations.
            </p>
          </div>
          <Link to={ROUTES.MEDICINES} className="text-sm font-semibold text-brand-700 hover:underline">
            Explore full catalog →
          </Link>
        </div>

        {homeQuery.isError ? (
          <AlertBanner
            className="mt-5"
            variant="warning"
            title="Live Catalog Unavailable"
            description="Start Medexa-Backend to load approved categories, medicines, and verified pharmacies."
          />
        ) : homeData && homeData.categories.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homeData.categories.slice(0, 8).map((category) => {
              const catImg = resolveMediaUrl(category.imageUrl);
              return (
                <Link
                  key={category.id}
                  to={`${ROUTES.MEDICINES}?categoryId=${category.id}`}
                  className="group block"
                >
                  <Card className="h-full transition-colors group-hover:border-brand-600">
                    <div className="flex items-center gap-3">
                      {catImg ? (
                        <img
                          src={catImg}
                          alt={category.name}
                          className="h-11 w-11 rounded-[var(--medexa-radius-md)] object-cover border border-border-subtle"
                        />
                      ) : (
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--medexa-radius-md)] bg-brand-100 text-brand-700">
                          <FolderTree className="h-5 w-5" aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-ink-primary group-hover:text-brand-800">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-ink-muted line-clamp-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="mt-5 bg-surface-soft text-sm text-ink-secondary">
            Categories added by platform admins appear here automatically.
          </Card>
        )}
      </section>

      {/* Popular Medicines Section */}
      {homeData && homeData.popularMedicines.length > 0 && (
        <section className="border-t border-border-subtle bg-surface-soft">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink-primary">Available Stock Favorites</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  In-stock approved medicines sorted by verified batch availability.
                </p>
              </div>
              <Link
                to={`${ROUTES.MEDICINES}?inStock=true`}
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                View all in-stock →
              </Link>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeData.popularMedicines.slice(0, 4).map((med) => (
                <MedicineProductCard
                  key={med.id}
                  medicine={med}
                  onQuickAdd={handleQuickAdd}
                  onToggleWishlist={handleWishlist}
                  wishlisted={wishlistIds.has(med.id)}
                  busy={addToCartMutation.isPending || toggleWishlistMutation.isPending}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Health & Wellness (OTC Essentials) Section */}
      {homeData && homeData.wellnessMedicines.length > 0 && (
        <section className="border-t border-border-subtle">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink-primary">Health &amp; Wellness Essentials (OTC)</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Non-prescription everyday wellness, hydration, and supportive care products.
                </p>
              </div>
              <Link
                to={`${ROUTES.MEDICINES}?rx=OTC`}
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Browse OTC catalog →
              </Link>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeData.wellnessMedicines.slice(0, 4).map((med) => (
                <MedicineProductCard
                  key={med.id}
                  medicine={med}
                  onQuickAdd={handleQuickAdd}
                  onToggleWishlist={handleWishlist}
                  wishlisted={wishlistIds.has(med.id)}
                  busy={addToCartMutation.isPending || toggleWishlistMutation.isPending}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Added Medicines */}
      {homeData && homeData.recentMedicines.length > 0 && (
        <section className="border-t border-border-subtle bg-surface-soft">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink-primary">Recently Added Medicines</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Latest pharmacist-verified listings published to the catalog.
                </p>
              </div>
              <Link to={ROUTES.MEDICINES} className="text-sm font-semibold text-brand-700 hover:underline">
                View newest →
              </Link>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeData.recentMedicines.slice(0, 4).map((med) => (
                <MedicineProductCard
                  key={med.id}
                  medicine={med}
                  onQuickAdd={handleQuickAdd}
                  onToggleWishlist={handleWishlist}
                  wishlisted={wishlistIds.has(med.id)}
                  busy={addToCartMutation.isPending || toggleWishlistMutation.isPending}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Authenticated Customer Recently Viewed */}
      {isCustomer && recentlyViewedQuery.data && recentlyViewedQuery.data.length > 0 && (
        <section className="border-t border-border-subtle">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-bold text-ink-primary">Recently Viewed by You</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Resume inspecting medicines from your recent browsing history.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewedQuery.data.slice(0, 4).map((med) => (
                <MedicineProductCard
                  key={med.id}
                  medicine={med}
                  onQuickAdd={handleQuickAdd}
                  onToggleWishlist={handleWishlist}
                  wishlisted={wishlistIds.has(med.id)}
                  busy={addToCartMutation.isPending || toggleWishlistMutation.isPending}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Verified Partner Pharmacies & Trust Pillars */}
      <section className="border-t border-border-subtle bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink-primary">Verified Dispensing Pharmacies</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Licensed partner pharmacies active on Medexa with published delivery zone rules.
              </p>
            </div>
            <Link to={ROUTES.PHARMACIES} className="text-sm font-semibold text-brand-700 hover:underline">
              All Verified Pharmacies →
            </Link>
          </div>

          {homeData && homeData.verifiedPharmacies.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {homeData.verifiedPharmacies.map((pharmacy) => (
                <Card key={pharmacy.id} className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="brand">Verified Partner</Badge>
                      <span className="text-xs text-ink-muted">
                        {pharmacy.city}, {pharmacy.state}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-ink-primary">{pharmacy.pharmacyName}</h3>
                    <p className="mt-1 text-xs text-ink-secondary">
                      Postal Base: {pharmacy.postalCode} •{' '}
                      {pharmacy.deliveryZones.length} active delivery zone(s)
                    </p>
                  </div>
                  <Link to={`${ROUTES.MEDICINES}?pharmacyId=${pharmacy.id}`} className="mt-4 block">
                    <Button variant="outline" size="sm" fullWidth>
                      View Pharmacy Catalog
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title} className="h-full bg-surface-canvas">
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
        </div>
      </section>

      <Modal
        open={rxGuideOpen}
        onClose={() => setRxGuideOpen(false)}
        title="Prescription &amp; Dispensing Compliance"
        description="Clinical safeguards enforced on Medexa."
        footer={
          <Button variant="primary" onClick={() => setRxGuideOpen(false)}>
            Understood
          </Button>
        }
      >
        <ul className="space-y-2.5 text-sm text-ink-secondary">
          <li>• Only verified active pharmacies with non-expired retail drug licenses dispense orders.</li>
          <li>• Schedule H, H1, and X products require an approved, unexpired prescription.</li>
          <li>• Medexa never performs automatic substitution of prescribed medications.</li>
          <li>• FEFO batch allocation reserves earliest-expiry stock safely with database locking.</li>
        </ul>
      </Modal>
    </div>
  );
}
