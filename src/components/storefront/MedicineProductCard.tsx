import { Link } from 'react-router-dom';
import { Building2, Heart, Pill, ShoppingCart } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { resolveMediaUrl } from '@/config/env';
import type { PublicMedicine } from '@/types/catalog';

interface MedicineProductCardProps {
  medicine: PublicMedicine;
  onQuickAdd?: (medicine: PublicMedicine) => void;
  onToggleWishlist?: (medicine: PublicMedicine) => void;
  wishlisted?: boolean;
  busy?: boolean;
}

export function MedicineProductCard({
  medicine,
  onQuickAdd,
  onToggleWishlist,
  wishlisted = false,
  busy = false,
}: MedicineProductCardProps) {
  const imgUrl = resolveMediaUrl(medicine.primaryImageUrl);
  const detailPath = `/medicines/${medicine.slug}`;

  return (
    <article className="medexa-card group relative flex flex-col justify-between overflow-hidden rounded-[var(--medexa-radius-lg)] border border-border-subtle bg-surface-canvas p-4 shadow-[var(--medexa-shadow-sm)] transition-shadow hover:border-brand-600 hover:shadow-[var(--medexa-shadow-md)]">
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={medicine.name}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft object-contain p-2"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft">
          <Pill className="h-9 w-9 text-brand-700/35" aria-hidden="true" />
        </div>
      )}

      <header className="mt-3 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Badge variant="neutral">{medicine.categoryName}</Badge>
          <Badge variant={medicine.prescriptionRequired ? 'warning' : 'success'}>
            {medicine.prescriptionRequired ? 'Rx Required' : 'OTC'}
          </Badge>
        </div>

        <h3 className="mt-1 text-base font-bold text-ink-primary leading-snug">
          <Link to={detailPath} className="medexa-card-link hover:text-brand-800">
            {medicine.name}
          </Link>
        </h3>
        <p className="text-xs font-medium text-ink-secondary">
          {medicine.brand} • {medicine.packSize}
        </p>
      </header>

      <div className="mt-2 space-y-1.5 text-xs text-ink-secondary">
        <p className="line-clamp-2 text-ink-muted">{medicine.composition}</p>
        <p className="inline-flex items-center gap-1 font-medium text-ink-secondary">
          <Building2 className="h-3.5 w-3.5 text-brand-700 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {medicine.pharmacyName} • {medicine.pharmacyCity}
          </span>
        </p>
      </div>

      <footer className="relative z-10 mt-4 flex items-end justify-between gap-2 border-t border-border-subtle pt-3">
        <div className="tabular-nums">
          <span className="text-lg font-bold text-ink-primary">
            ₹{medicine.sellingPrice.toFixed(2)}
          </span>
          {medicine.mrpPrice > medicine.sellingPrice && (
            <span className="ms-1.5 text-xs text-ink-muted line-through">
              ₹{medicine.mrpPrice.toFixed(2)}
            </span>
          )}
          <div className="mt-0.5 text-[11px] font-medium">
            {medicine.inStock ? (
              <span className="text-brand-800">{medicine.availableQuantity} in stock</span>
            ) : (
              <span className="text-[#b42318]">Out of stock</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={() => onToggleWishlist(medicine)}
              disabled={busy}
              aria-label={wishlisted ? `Remove ${medicine.name} from wishlist` : `Save ${medicine.name} to wishlist`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-canvas text-ink-secondary hover:border-brand-700 hover:text-brand-700 cursor-pointer"
            >
              <Heart
                className={`h-4 w-4 ${wishlisted ? 'fill-[#b42318] text-[#b42318]' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
          {onQuickAdd ? (
            <Button
              type="button"
              size="sm"
              disabled={!medicine.inStock || busy}
              onClick={() => onQuickAdd(medicine)}
              leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
            >
              Add
            </Button>
          ) : (
            <Link to={detailPath}>
              <Button type="button" size="sm" variant="outline">
                Details
              </Button>
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
