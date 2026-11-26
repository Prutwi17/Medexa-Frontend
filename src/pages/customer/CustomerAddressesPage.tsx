import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { CheckCircle2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { AlertBanner, Badge, Button, Card, Input, Modal, PageLoader } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { CustomerAddress } from '@/types/storefront';

const addressSchema = z.object({
  label: z.string().trim().min(2, 'Label is required (e.g. Home).').max(60),
  recipientName: z.string().trim().min(2, 'Recipient name is required.').max(150),
  recipientPhone: z.string().trim().min(6, 'Phone number is required.').max(30),
  addressLine1: z.string().trim().min(4, 'Street address is required.').max(250),
  addressLine2: z.string().trim().max(250).optional(),
  landmark: z.string().trim().max(150).optional(),
  city: z.string().trim().min(2, 'City is required.').max(100),
  state: z.string().trim().min(2, 'State is required.').max(100),
  postalCode: z.string().trim().min(4, 'Postal code is required.').max(20),
  country: z.string().trim().min(2).max(80),
  defaultAddress: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function CustomerAddressesPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: storefrontApi.listAddresses,
  });

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'India', defaultAddress: false },
    mode: 'onBlur',
  });

  const saveMutation = useMutation({
    mutationFn: (values: AddressFormValues) =>
      editing
        ? storefrontApi.updateAddress(editing.id, values)
        : storefrontApi.addAddress(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      setModalOpen(false);
      setEditing(null);
      form.reset({ country: 'India', defaultAddress: false });
      notify({ variant: 'success', title: 'Address Saved', message: 'Delivery zone coverage checked.' });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Unable to Save Address', message: normalizeApiError(err).message });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: storefrontApi.setDefaultAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({ variant: 'success', title: 'Default Updated', message: 'Primary delivery address updated.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: storefrontApi.deleteAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({ variant: 'info', title: 'Address Deleted', message: 'Delivery address removed.' });
    },
  });

  const openCreateModal = () => {
    setEditing(null);
    form.reset({ country: 'India', defaultAddress: false });
    setModalOpen(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditing(addr);
    form.reset({
      label: addr.label,
      recipientName: addr.recipientName,
      recipientPhone: addr.recipientPhone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? '',
      landmark: addr.landmark ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      defaultAddress: addr.defaultAddress,
    });
    setModalOpen(true);
  };

  if (addressesQuery.isLoading) {
    return <PageLoader message="Loading delivery addresses..." />;
  }

  const addresses = addressesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Delivery Addresses</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Save multiple delivery locations and verify active pharmacy delivery zone coverage.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Add Delivery Address
        </Button>
      </div>

      {addressesQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to load addresses"
          description={normalizeApiError(addressesQuery.error).message}
        />
      ) : addresses.length === 0 ? (
        <Card className="py-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No saved addresses</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Add your home or clinic delivery address to check pharmacy serviceability.
          </p>
          <Button className="mt-4" onClick={openCreateModal}>
            Add First Address
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id} className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink-primary">{addr.label}</h2>
                    {addr.defaultAddress && <Badge variant="brand">Default</Badge>}
                  </div>
                  <Badge variant={addr.serviceable ? 'success' : 'warning'}>
                    {addr.serviceable
                      ? `${addr.serviceablePharmacyCount} pharmacy(ies) cover ${addr.postalCode}`
                      : `No zone coverage for ${addr.postalCode}`}
                  </Badge>
                </div>

                <p className="mt-2 text-sm font-medium text-ink-primary">
                  {addr.recipientName} • {addr.recipientPhone}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                </p>
                {addr.landmark && (
                  <p className="text-xs text-ink-muted">Landmark: {addr.landmark}</p>
                )}
                <p className="text-sm text-ink-secondary">
                  {addr.city}, {addr.state} — {addr.postalCode}, {addr.country}
                </p>

                {addr.serviceableZones.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-[var(--medexa-radius-sm)] border border-border-subtle bg-surface-soft p-2.5 text-xs text-ink-secondary">
                    {addr.serviceableZones.map((zone) => (
                      <li key={`${zone.pharmacyId}-${zone.postalCode}`}>
                        • {zone.pharmacyName}: Fee ₹{zone.deliveryFee.toFixed(2)}, ETA ~
                        {zone.estimatedDeliveryMinutes} mins
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
                {!addr.defaultAddress && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={setDefaultMutation.isPending}
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(addr)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(addr.id)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5 text-[#b42318]" />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Delivery Address' : 'Add Delivery Address'}
        description="Addresses validate directly against verified pharmacy delivery postal codes."
      >
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Address label"
              placeholder="Home / Office"
              required
              error={form.formState.errors.label?.message}
              {...form.register('label')}
            />
            <Input
              label="Recipient full name"
              autoComplete="name"
              required
              error={form.formState.errors.recipientName?.message}
              {...form.register('recipientName')}
            />
          </div>

          <Input
            label="Recipient phone"
            type="tel"
            autoComplete="tel"
            required
            error={form.formState.errors.recipientPhone?.message}
            {...form.register('recipientPhone')}
          />

          <Input
            label="Street address line 1"
            autoComplete="address-line1"
            required
            error={form.formState.errors.addressLine1?.message}
            {...form.register('addressLine1')}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Apartment, floor, or block (optional)"
              autoComplete="address-line2"
              {...form.register('addressLine2')}
            />
            <Input
              label="Landmark (optional)"
              {...form.register('landmark')}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="City"
              autoComplete="address-level2"
              required
              error={form.formState.errors.city?.message}
              {...form.register('city')}
            />
            <Input
              label="State"
              autoComplete="address-level1"
              required
              error={form.formState.errors.state?.message}
              {...form.register('state')}
            />
            <Input
              label="Postal code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              required
              error={form.formState.errors.postalCode?.message}
              {...form.register('postalCode')}
            />
          </div>

          <label className="inline-flex min-h-10 items-center gap-2 text-sm text-ink-primary cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-700"
              {...form.register('defaultAddress')}
            />
            <span>Make this my default delivery address</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editing ? 'Save Changes' : 'Save Delivery Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
