import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  FileText,
  Heart,
  Pill,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';
import { AlertBanner, Badge, Button, Card, PageLoader, Select } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { resolveMediaUrl } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/AuthContext';
import { catalogApi } from '@/features/catalog/catalogApi';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';

export function MedicineDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const { isAuthenticated, user } = useAuth();
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedRxId, setSelectedRxId] = useState('');

  const detailQuery = useQuery({
    queryKey: ['public', 'medicine', slug],
    queryFn: () => catalogApi.getPublicMedicineBySlug(slug),
    enabled: Boolean(slug),
  });

  const wishlistQuery = useQuery({
    queryKey: ['customer', 'wishlist'],
    queryFn: storefrontApi.listWishlist,
    enabled: isCustomer,
  });

  const prescriptionsQuery = useQuery({
    queryKey: ['customer', 'prescriptions', 'detail-select'],
    queryFn: () => storefrontApi.listCustomerPrescriptions({ size: 30 }),
    enabled: isCustomer,
  });

  const addToCartMutation = useMutation({
    mutationFn: (payload: { medicineId: number; quantity: number; prescriptionId?: number }) =>
      storefrontApi.addToCart(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({
        variant: 'success',
        title: 'Added to Cart',
        message: 'Medicine added to your pharmacy cart.',
      });
    },
    onError: (error) => {
      notify({
        variant: 'error',
        title: 'Cannot Add Item',
        message: normalizeApiError(error).message,
      });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: async (medicineId: number) => {
      const saved = (wishlistQuery.data ?? []).some((w) => w.medicine.id === medicineId);
      if (saved) {
        await storefrontApi.removeFromWishlist(medicineId);
        return false;
      }
      await storefrontApi.addToWishlist(medicineId);
      return true;
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
      notify({
        variant: 'success',
        title: saved ? 'Saved to Wishlist' : 'Removed from Wishlist',
        message: saved ? 'Medicine saved for quick future ordering.' : 'Medicine removed from wishlist.',
      });
    },
    onError: (error) => {
      notify({
        variant: 'error',
        title: 'Wishlist Error',
        message: normalizeApiError(error).message,
      });
    },
  });

  if (detailQuery.isLoading) {
    return <PageLoader message="Loading medicine details..." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <AlertBanner
          variant="error"
          title="Medicine unavailable"
          description="This medicine could not be found or is no longer active in the verified catalog."
          action={
            <Link to={ROUTES.MEDICINES} className="text-xs font-semibold underline">
              Back to Catalog
            </Link>
          }
        />
      </div>
    );
  }

  const med = detailQuery.data;
  const images = med.images.length > 0 ? med.images : [];
  const activeImage = resolveMediaUrl(images[selectedImgIdx]?.imageUrl ?? med.primaryImageUrl);
  const maxOrderUnits = Math.max(
    1,
    Math.min(med.availableQuantity || 0, med.maxUnitsPerOrder ?? (med.prescriptionRequired ? 30 : 50))
  );
  const isWishlisted = (wishlistQuery.data ?? []).some((w) => w.medicine.id === med.id);

  const compatibleRxList = (prescriptionsQuery.data?.items ?? []).filter(
    (rx) =>
      (rx.status === 'APPROVED' || rx.status === 'PENDING_REVIEW') &&
      (!rx.pharmacyId || rx.pharmacyId === med.pharmacyId)
  );

  const handleAddToCart = () => {
    if (!isCustomer) {
      notify({
        variant: 'info',
        title: 'Sign In to Order',
        message: 'Sign in with your customer account to add medicines to cart.',
      });
      navigate(ROUTES.LOGIN);
      return;
    }

    addToCartMutation.mutate({
      medicineId: med.id,
      quantity,
      prescriptionId: selectedRxId ? Number(selectedRxId) : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to={ROUTES.MEDICINES}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Catalog</span>
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        {/* Image Gallery */}
        <div className="lg:col-span-5">
          <Card padding="none" className="overflow-hidden">
            <div className="flex aspect-square items-center justify-center bg-surface-soft">
              {activeImage ? (
                <img src={activeImage} alt={med.name} className="h-full w-full object-contain p-4" />
              ) : (
                <Pill className="h-20 w-20 text-brand-700/30" aria-hidden="true" />
              )}
            </div>
          </Card>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => {
                const thumbUrl = resolveMediaUrl(img.imageUrl);
                return (
                  <button
                    key={img.id}
                    type="button"
                    aria-label={`View image ${idx + 1} of ${med.name}`}
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-[var(--medexa-radius-md)] border cursor-pointer ${
                      idx === selectedImgIdx
                        ? 'border-brand-700 ring-2 ring-brand-700/30'
                        : 'border-border-subtle'
                    }`}
                  >
                    {thumbUrl && (
                      <img src={thumbUrl} alt={img.altText || med.name} className="h-full w-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Clinical Details & Purchase Actions */}
        <div className="space-y-5 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{med.categoryName}</Badge>
              <Badge variant={med.prescriptionRequired ? 'warning' : 'success'}>
                {med.prescriptionRequired ? 'Prescription Required (Rx)' : 'Over-the-Counter (OTC)'}
              </Badge>
              {med.classificationCode && (
                <Badge variant="neutral">{med.classificationCode}</Badge>
              )}
              <Badge variant={med.inStock ? 'brand' : 'danger'}>
                {med.inStock ? `${med.availableQuantity} units available` : 'Out of Stock'}
              </Badge>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-ink-primary sm:text-3xl">{med.name}</h1>
            <p className="mt-1 text-sm font-medium text-ink-secondary">
              {med.brand} • Manufactured by {med.manufacturer}
            </p>
          </div>

          <Card className="bg-surface-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="tabular-nums">
                <span className="text-3xl font-bold text-ink-primary">₹{med.sellingPrice.toFixed(2)}</span>
                {med.mrpPrice > med.sellingPrice && (
                  <span className="ms-2.5 text-sm text-ink-muted line-through">
                    MRP ₹{med.mrpPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-ink-secondary">{med.packSize}</span>
            </div>

            {med.prescriptionRequired && (
              <AlertBanner
                className="mt-4"
                variant="warning"
                title={med.classificationDisplayName || 'Valid Prescription Required'}
                description={
                  med.classificationWarning ||
                  'Dispatch of this medicine is blocked until authorized pharmacy personnel approve your prescription. No automatic substitution is performed.'
                }
              />
            )}

            {med.inStock && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="detail-qty" className="block text-xs font-semibold text-ink-primary">
                    Quantity (max {maxOrderUnits})
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      -
                    </Button>
                    <input
                      id="detail-qty"
                      type="number"
                      min={1}
                      max={maxOrderUnits}
                      value={quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(maxOrderUnits, val)));
                      }}
                      className="min-h-10 w-20 rounded-[var(--medexa-radius-md)] border border-border-strong bg-surface-canvas text-center text-sm font-semibold tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={quantity >= maxOrderUnits}
                      onClick={() => setQuantity((q) => Math.min(maxOrderUnits, q + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {med.prescriptionRequired && isCustomer && (
                  <div>
                    <Select
                      label="Attach Prescription (optional now)"
                      value={selectedRxId}
                      onChange={(e) => setSelectedRxId(e.target.value)}
                      options={[
                        { value: '', label: 'Attach later in Cart' },
                        ...compatibleRxList.map((rx) => ({
                          value: String(rx.id),
                          label: `${rx.referenceCode} (${rx.status}) - Dr. ${rx.doctorName}`,
                        })),
                      ]}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={!med.inStock}
                loading={addToCartMutation.isPending}
                onClick={handleAddToCart}
                leftIcon={<ShoppingCart className="h-4 w-4" />}
              >
                {med.inStock ? 'Add to Cart' : 'Currently Out of Stock'}
              </Button>

              <Button
                type="button"
                variant="outline"
                loading={wishlistMutation.isPending}
                onClick={() => {
                  if (!isCustomer) {
                    navigate(ROUTES.LOGIN);
                    return;
                  }
                  wishlistMutation.mutate(med.id);
                }}
                leftIcon={
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-[#b42318] text-[#b42318]' : ''}`} />
                }
              >
                {isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              </Button>

              {med.prescriptionRequired && (
                <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS}>
                  <Button type="button" variant="secondary" leftIcon={<FileText className="h-4 w-4" />}>
                    Upload Prescription
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-secondary">
              Clinical Specifications
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-muted">Active Composition</dt>
                <dd className="font-medium text-ink-primary">{med.composition}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Dosage Form</dt>
                <dd className="font-medium text-ink-primary">{med.dosageForm}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Pack Size</dt>
                <dd className="font-medium text-ink-primary">{med.packSize}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Dispensing Pharmacy</dt>
                <dd className="inline-flex items-center gap-1.5 font-medium text-ink-primary">
                  <Building2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <span>
                    {med.pharmacyName} ({med.pharmacyCity})
                  </span>
                </dd>
              </div>
            </dl>
            {med.description && (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{med.description}</p>
              </div>
            )}
          </Card>

          <div className="space-y-2 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3.5 text-xs text-ink-secondary">
            <p className="flex items-center gap-2 font-medium text-ink-primary">
              <ShieldCheck className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
              <span>Batches allocate using First-Expiry-First-Out (FEFO) inventory control.</span>
            </p>
            {med.classificationWarning && (
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#b54708] shrink-0" aria-hidden="true" />
                <span>{med.classificationWarning}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
