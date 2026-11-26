import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { MedicineProductCard } from '@/components/storefront/MedicineProductCard';
import { AlertBanner, Button, Card, PageLoader } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { PublicMedicine } from '@/types/catalog';

export function CustomerWishlistPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const wishlistQuery = useQuery({
    queryKey: ['customer', 'wishlist'],
    queryFn: storefrontApi.listWishlist,
  });

  const addToCartMutation = useMutation({
    mutationFn: (med: PublicMedicine) => storefrontApi.addToCart({ medicineId: med.id, quantity: 1 }),
    onSuccess: (_cart, med) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({ variant: 'success', title: 'Moved to Cart', message: med.name });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Cannot Add to Cart', message: normalizeApiError(err).message });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (med: PublicMedicine) => storefrontApi.removeFromWishlist(med.id),
    onSuccess: (_res, med) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
      notify({ variant: 'info', title: 'Removed from Wishlist', message: med.name });
    },
  });

  if (wishlistQuery.isLoading) {
    return <PageLoader message="Loading your saved medicines..." />;
  }

  if (wishlistQuery.isError) {
    return (
      <AlertBanner
        variant="error"
        title="Unable to load wishlist"
        description={normalizeApiError(wishlistQuery.error).message}
      />
    );
  }

  const entries = wishlistQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Saved Medicines (Wishlist)</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Bookmark approved medicines from verified pharmacies for quick reordering.
          </p>
        </div>
        <Link to={ROUTES.MEDICINES}>
          <Button variant="outline" size="sm">
            Explore Catalog
          </Button>
        </Link>
      </div>

      {entries.length === 0 ? (
        <Card className="py-14 text-center">
          <Heart className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No saved medicines yet</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Click the heart icon on any medicine in the catalog to save it here.
          </p>
          <Link to={ROUTES.MEDICINES} className="mt-4 inline-block">
            <Button>Browse Catalog</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) => (
            <MedicineProductCard
              key={entry.wishlistItemId}
              medicine={entry.medicine}
              wishlisted
              busy={addToCartMutation.isPending || removeMutation.isPending}
              onQuickAdd={(med) => addToCartMutation.mutate(med)}
              onToggleWishlist={(med) => removeMutation.mutate(med)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
