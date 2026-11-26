import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, PackageCheck, Pill, ShieldCheck } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, PageLoader } from '@/components/ui';
import { resolveMediaUrl } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { catalogApi } from '@/features/catalog/catalogApi';

export function MedicineDetailPage() {
  const { slug = '' } = useParams();
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  const detailQuery = useQuery({
    queryKey: ['public', 'medicine', slug],
    queryFn: () => catalogApi.getPublicMedicineBySlug(slug),
    enabled: Boolean(slug),
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
            <div className="aspect-square bg-surface-soft flex items-center justify-center">
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
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-[var(--medexa-radius-md)] border cursor-pointer ${
                      idx === selectedImgIdx ? 'border-brand-700 ring-2 ring-brand-700/30' : 'border-border-subtle'
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

        {/* Clinical Specifications */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{med.categoryName}</Badge>
              <Badge variant={med.prescriptionRequired ? 'warning' : 'success'}>
                {med.prescriptionRequired ? 'Prescription Required (Rx)' : 'Over-the-Counter (OTC)'}
              </Badge>
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
                title="Valid Prescription Required"
                description="This medicine requires pharmacist verification of an uploaded prescription before dispatch."
              />
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Link to={ROUTES.CUSTOMER_CART}>
                <Button disabled={!med.inStock} leftIcon={<PackageCheck className="h-4 w-4" />}>
                  {med.inStock ? 'Proceed via Customer Portal' : 'Currently Out of Stock'}
                </Button>
              </Link>
              {med.prescriptionRequired && (
                <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS}>
                  <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
                    Upload Prescription
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-secondary">
              Clinical Details
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

          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Batches are allocated using First-Expiry-First-Out (FEFO) inventory control.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
