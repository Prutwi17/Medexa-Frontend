import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, FileWarning, MapPin, Minus, Plus, ShieldAlert, ShoppingBag, Trash2 } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, PageLoader, Select } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { resolveMediaUrl } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';

export function CustomerCartPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);

  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: storefrontApi.listAddresses,
  });

  const activeAddressId =
    selectedAddressId ?? addressesQuery.data?.find((a) => a.defaultAddress)?.id;

  const cartQuery = useQuery({
    queryKey: ['customer', 'cart', activeAddressId ?? 'default'],
    queryFn: () => storefrontApi.getCart(activeAddressId),
  });

  const prescriptionsQuery = useQuery({
    queryKey: ['customer', 'prescriptions', 'cart'],
    queryFn: () => storefrontApi.listCustomerPrescriptions({ size: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {
      cartItemId: number;
      quantity: number;
      prescriptionId?: number;
      clearPrescription?: boolean;
    }) =>
      storefrontApi.updateCartItem(
        vars.cartItemId,
        {
          quantity: vars.quantity,
          prescriptionId: vars.prescriptionId,
          clearPrescription: vars.clearPrescription,
        },
        activeAddressId
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Cart Update Failed', message: normalizeApiError(err).message });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cartItemId: number) => storefrontApi.removeCartItem(cartItemId, activeAddressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({ variant: 'info', title: 'Item Removed', message: 'Updated your shopping cart.' });
    },
  });

  const clearMutation = useMutation({
    mutationFn: storefrontApi.clearCart,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({ variant: 'info', title: 'Cart Cleared', message: 'All items removed from your cart.' });
    },
  });

  if (cartQuery.isLoading) {
    return <PageLoader message="Calculating multi-pharmacy cart pricing and zone fees..." />;
  }

  const cart = cartQuery.data;
  const addresses = addressesQuery.data ?? [];
  const allPrescriptions = prescriptionsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Multi-Pharmacy Cart</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Items are grouped by dispensing pharmacy with server-validated stock, prescription compliance, and zone fees.
          </p>
        </div>
        {cart && cart.totalItemCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={clearMutation.isPending}
            onClick={() => clearMutation.mutate()}
          >
            Clear Cart
          </Button>
        )}
      </div>

      {/* Delivery Address Selector */}
      <Card className="bg-surface-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-64 flex-1">
            <Select
              label="Delivery Address for Zone & Fee Calculation"
              value={activeAddressId ? String(activeAddressId) : ''}
              onChange={(e) => setSelectedAddressId(e.target.value ? Number(e.target.value) : undefined)}
              options={[
                ...(addresses.length === 0
                  ? [{ value: '', label: 'No saved delivery addresses' }]
                  : addresses.map((addr) => ({
                      value: String(addr.id),
                      label: `${addr.label} — ${addr.city} (${addr.postalCode})${
                        addr.defaultAddress ? ' [Default]' : ''
                      }`,
                    }))),
              ]}
            />
          </div>
          <Link to={ROUTES.CUSTOMER_ADDRESSES}>
            <Button variant="outline" size="sm" leftIcon={<MapPin className="h-4 w-4" />}>
              Manage Addresses
            </Button>
          </Link>
        </div>
      </Card>

      {!cart || cart.pharmacyGroups.length === 0 ? (
        <Card className="py-14 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">Your cart is empty</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Browse verified pharmacies and add approved medicines to get started.
          </p>
          <Link to={ROUTES.MEDICINES} className="mt-4 inline-block">
            <Button>Browse Medicines</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Pharmacy Cart Groups */}
          <div className="space-y-5 lg:col-span-8">
            {cart.pharmacyGroups.map((group) => (
              <Card key={group.pharmacyId} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-brand-700" aria-hidden="true" />
                    <div>
                      <h2 className="text-base font-bold text-ink-primary">{group.pharmacyName}</h2>
                      <p className="text-xs text-ink-muted">{group.pharmacyCity}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {group.deliverableToSelectedAddress === true && (
                      <Badge variant="success">
                        Zone Verified • ~{group.estimatedDeliveryMinutes} mins (Fee ₹
                        {group.deliveryFee.toFixed(2)})
                      </Badge>
                    )}
                    {group.deliverableToSelectedAddress === false && (
                      <Badge variant="danger">Outside Delivery Zone</Badge>
                    )}
                    <Badge variant={group.readyForCheckout ? 'brand' : 'warning'}>
                      {group.readyForCheckout ? 'Ready for Checkout' : 'Action Required'}
                    </Badge>
                  </div>
                </div>

                <div className="divide-y divide-border-subtle">
                  {group.items.map((item) => {
                    const img = resolveMediaUrl(item.primaryImageUrl);
                    const matchingRx = allPrescriptions.filter(
                      (rx) =>
                        rx.status !== 'CANCELLED' &&
                        rx.status !== 'EXPIRED' &&
                        (!rx.pharmacyId || rx.pharmacyId === group.pharmacyId)
                    );
                    return (
                      <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            {img ? (
                              <img
                                src={img}
                                alt={item.medicineName}
                                className="h-14 w-14 rounded-[var(--medexa-radius-md)] border border-border-subtle object-contain p-1"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft text-xs font-bold text-brand-700">
                                RX
                              </div>
                            )}
                            <div>
                              <Link
                                to={`/medicines/${item.medicineSlug}`}
                                className="font-semibold text-ink-primary hover:text-brand-700 hover:underline"
                              >
                                {item.medicineName}
                              </Link>
                              <p className="text-xs text-ink-secondary">
                                {item.brand} • {item.packSize}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                <Badge variant={item.prescriptionRequired ? 'warning' : 'success'}>
                                  {item.prescriptionRequired ? `Rx (${item.classificationCode})` : 'OTC'}
                                </Badge>
                                <span className="text-xs font-semibold text-ink-primary tabular-nums">
                                  ₹{item.unitPrice.toFixed(2)} each
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={item.quantity <= 1 || updateMutation.isPending}
                                onClick={() =>
                                  updateMutation.mutate({
                                    cartItemId: item.cartItemId,
                                    quantity: item.quantity - 1,
                                  })
                                }
                              >
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={
                                  item.quantity >= Math.min(item.availableStock, item.maxUnitsPerOrder) ||
                                  updateMutation.isPending
                                }
                                onClick={() =>
                                  updateMutation.mutate({
                                    cartItemId: item.cartItemId,
                                    quantity: item.quantity + 1,
                                  })
                                }
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </div>

                            <span className="w-20 text-right text-sm font-bold text-ink-primary tabular-nums">
                              ₹{item.lineTotal.toFixed(2)}
                            </span>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              aria-label={`Remove ${item.medicineName}`}
                              onClick={() => removeMutation.mutate(item.cartItemId)}
                            >
                              <Trash2 className="h-4 w-4 text-[#b42318]" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>

                        {item.prescriptionRequired && (
                          <div className="rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="min-w-60 flex-1">
                                <Select
                                  label="Attached Prescription for Dispatch Verification"
                                  value={item.prescriptionId ? String(item.prescriptionId) : ''}
                                  onChange={(e) => {
                                    const nextRx = e.target.value;
                                    updateMutation.mutate({
                                      cartItemId: item.cartItemId,
                                      quantity: item.quantity,
                                      prescriptionId: nextRx ? Number(nextRx) : undefined,
                                      clearPrescription: !nextRx,
                                    });
                                  }}
                                  options={[
                                    { value: '', label: 'Select uploaded prescription...' },
                                    ...matchingRx.map((rx) => ({
                                      value: String(rx.id),
                                      label: `${rx.referenceCode} (${rx.status}) — Dr. ${rx.doctorName}`,
                                    })),
                                  ]}
                                />
                              </div>
                              <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS}>
                                <Button variant="outline" size="sm">
                                  Upload New Rx
                                </Button>
                              </Link>
                            </div>
                            {!item.dispatchEligible && item.blockerMessage && (
                              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#b54708]">
                                <FileWarning className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>{item.blockerMessage}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {group.groupBlockers.length > 0 && (
                  <AlertBanner
                    variant="warning"
                    title="Dispatch Blockers for this Pharmacy Group"
                    description={group.groupBlockers.join(' • ')}
                  />
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-xs text-ink-secondary tabular-nums">
                  <span>Items Subtotal: ₹{group.itemsSubtotal.toFixed(2)}</span>
                  <span>Delivery Fee: ₹{group.deliveryFee.toFixed(2)}</span>
                  <span className="text-sm font-bold text-ink-primary">
                    Group Total: ₹{group.estimatedGroupTotal.toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Server Summary Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-20 space-y-4">
              <h2 className="text-base font-bold text-ink-primary">Cart Summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Items Subtotal ({cart.totalItemCount} units)</dt>
                  <dd className="font-semibold tabular-nums">₹{cart.itemsSubtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-secondary">Pharmacy Delivery Fees</dt>
                  <dd className="font-semibold tabular-nums">₹{cart.totalDeliveryFee.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold text-ink-primary">
                  <dt>Estimated Total</dt>
                  <dd className="tabular-nums">₹{cart.grandTotal.toFixed(2)}</dd>
                </div>
              </dl>

              <Link to={ROUTES.CUSTOMER_CHECKOUT} className="block">
                <Button fullWidth disabled={!cart.readyForCheckout}>
                  Proceed to Multi-Pharmacy Checkout
                </Button>
              </Link>

              {!cart.readyForCheckout && cart.checkoutBlockers.length > 0 && (
                <AlertBanner
                  variant="warning"
                  title="Compliance Checks Remaining"
                  description={cart.checkoutBlockers[0]}
                />
              )}

              <div className="rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3 text-xs text-ink-secondary flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Prescription items stay blocked until verified by an authorized dispensing pharmacist.
                  Coupons and taxes are computed server-side at checkout.
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
