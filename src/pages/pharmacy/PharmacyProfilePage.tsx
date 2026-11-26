import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MapPin, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { z } from 'zod';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Table,
  type TableColumn,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { resolveMediaUrl } from '@/config/env';
import { catalogApi } from '@/features/catalog/catalogApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { DeliveryZone, PharmacyLicense } from '@/types/catalog';

const profileSchema = z.object({
  pharmacyName: z.string().trim().min(2).max(200),
  contactPhone: z.string().trim().regex(/^[+0-9\s-]{7,20}$/, 'Enter a valid phone number.'),
  addressLine: z.string().trim().min(4).max(300),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  acceptingOrders: z.boolean(),
});

const licenseSchema = z.object({
  licenseNumber: z.string().trim().min(3).max(120),
  issuingAuthority: z.string().trim().min(2).max(180),
  pharmacistName: z.string().trim().min(2).max(150),
  pharmacistRegistrationNumber: z.string().trim().min(2).max(120),
  expiryDate: z.string().min(1, 'Expiry date is required.'),
});

const zoneSchema = z.object({
  zoneName: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(3).max(20),
  city: z.string().trim().min(2).max(100),
  deliveryFee: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  estimatedDeliveryMinutes: z.coerce.number().int().min(10).max(1440),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type LicenseFormValues = z.infer<typeof licenseSchema>;
type ZoneFormValues = z.infer<typeof zoneSchema>;

export function PharmacyProfilePage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const profileQuery = useQuery({
    queryKey: ['pharmacy', 'profile'],
    queryFn: catalogApi.getPharmacyProfile,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        pharmacyName: profileQuery.data.pharmacyName,
        contactPhone: profileQuery.data.contactPhone,
        addressLine: profileQuery.data.addressLine,
        city: profileQuery.data.city,
        state: profileQuery.data.state,
        postalCode: profileQuery.data.postalCode,
        acceptingOrders: profileQuery.data.acceptingOrders,
      });
    }
  }, [profileQuery.data, profileForm]);

  const licenseForm = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    mode: 'onBlur',
  });

  const zoneForm = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { deliveryFee: 0, minOrderAmount: 0, estimatedDeliveryMinutes: 45 },
    mode: 'onBlur',
  });

  const updateProfileMutation = useMutation({
    mutationFn: catalogApi.updatePharmacyProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'profile'] });
      notify({ variant: 'success', title: 'Pharmacy profile saved' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Update failed', message: normalizeApiError(err).message }),
  });

  const submitLicenseMutation = useMutation({
    mutationFn: catalogApi.submitLicense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'profile'] });
      setLicenseModalOpen(false);
      licenseForm.reset();
      notify({ variant: 'success', title: 'License submitted for review' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Submission failed', message: normalizeApiError(err).message }),
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ licenseId, file }: { licenseId: number; file: File }) =>
      catalogApi.uploadLicenseDocument(licenseId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'profile'] });
      notify({ variant: 'success', title: 'License document uploaded' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Upload failed', message: normalizeApiError(err).message }),
  });

  const saveZoneMutation = useMutation({
    mutationFn: (values: ZoneFormValues) =>
      editingZone
        ? catalogApi.updateDeliveryZone(editingZone.id, values)
        : catalogApi.createDeliveryZone(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'profile'] });
      setZoneModalOpen(false);
      setEditingZone(null);
      zoneForm.reset();
      notify({ variant: 'success', title: 'Delivery zone saved' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Zone save failed', message: normalizeApiError(err).message }),
  });

  const toggleZoneMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      catalogApi.toggleDeliveryZoneStatus(id, active),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'profile'] }),
  });

  const deleteZoneMutation = useMutation({
    mutationFn: catalogApi.deleteDeliveryZone,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'profile'] });
      notify({ variant: 'info', title: 'Delivery zone removed' });
    },
  });

  if (profileQuery.isLoading || !profileQuery.data) {
    return <PageLoader message="Loading pharmacy profile..." />;
  }

  const profile = profileQuery.data;

  const licenseColumns: TableColumn<PharmacyLicense>[] = [
    { key: 'licenseNumber', header: 'License #', isRowHeader: true, render: (l) => l.licenseNumber },
    { key: 'pharmacist', header: 'Pharmacist', render: (l) => `${l.pharmacistName} (${l.pharmacistRegistrationNumber})` },
    { key: 'expiryDate', header: 'Expiry', render: (l) => l.expiryDate },
    {
      key: 'status',
      header: 'Verification',
      render: (l) => (
        <Badge
          variant={
            l.verificationStatus === 'APPROVED'
              ? 'success'
              : l.verificationStatus === 'REJECTED'
                ? 'danger'
                : 'warning'
          }
        >
          {l.verificationStatus.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'document',
      header: 'Document',
      render: (l) => {
        const docUrl = resolveMediaUrl(l.documentUrl);
        return (
          <div className="flex items-center gap-2">
            {docUrl && (
              <a href={docUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:underline">
                View File
              </a>
            )}
            <label className="inline-flex items-center gap-1 rounded border border-border-subtle px-2 py-1 text-xs font-medium text-ink-primary hover:bg-surface-soft cursor-pointer">
              <Upload className="h-3 w-3" aria-hidden="true" />
              <span>{docUrl ? 'Replace' : 'Upload'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="visually-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocMutation.mutate({ licenseId: l.id, file });
                }}
              />
            </label>
          </div>
        );
      },
    },
  ];

  const zoneColumns: TableColumn<DeliveryZone>[] = [
    { key: 'zoneName', header: 'Zone', isRowHeader: true, render: (z) => z.zoneName },
    { key: 'postalCode', header: 'Postal Code', render: (z) => z.postalCode },
    { key: 'city', header: 'City', render: (z) => z.city },
    { key: 'fee', header: 'Fee', align: 'right', render: (z) => `₹${z.deliveryFee.toFixed(2)}` },
    { key: 'eta', header: 'ETA', render: (z) => `${z.estimatedDeliveryMinutes} mins` },
    {
      key: 'active',
      header: 'Status',
      render: (z) => (
        <Badge variant={z.active ? 'success' : 'neutral'}>{z.active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (z) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingZone(z);
              zoneForm.reset({
                zoneName: z.zoneName,
                postalCode: z.postalCode,
                city: z.city,
                deliveryFee: z.deliveryFee,
                minOrderAmount: z.minOrderAmount,
                estimatedDeliveryMinutes: z.estimatedDeliveryMinutes,
              });
              setZoneModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleZoneMutation.mutate({ id: z.id, active: !z.active })}
          >
            {z.active ? 'Disable' : 'Enable'}
          </Button>
          <button
            type="button"
            aria-label={`Delete zone ${z.zoneName}`}
            onClick={() => deleteZoneMutation.mutate(z.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[#b42318] hover:bg-surface-soft cursor-pointer"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Pharmacy Profile, Licenses &amp; Zones</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Maintain storefront contact details, drug license compliance, and serviceable delivery pin codes.
          </p>
        </div>
        <Badge
          variant={profile.verificationStatus === 'APPROVED' ? 'success' : 'warning'}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
        >
          {profile.verificationStatus}
        </Badge>
      </div>

      {profile.rejectionReason && (
        <AlertBanner
          variant="error"
          title="Compliance Notice"
          description={profile.rejectionReason}
        />
      )}

      {/* Profile Form */}
      <Card>
        <h2 className="text-base font-semibold text-ink-primary">Storefront &amp; Address Details</h2>
        <form
          onSubmit={profileForm.handleSubmit((vals) => updateProfileMutation.mutate(vals))}
          className="mt-4 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Pharmacy name"
              required
              error={profileForm.formState.errors.pharmacyName?.message}
              {...profileForm.register('pharmacyName')}
            />
            <Input
              label="Contact phone"
              required
              error={profileForm.formState.errors.contactPhone?.message}
              {...profileForm.register('contactPhone')}
            />
          </div>
          <Input
            label="Street address"
            required
            error={profileForm.formState.errors.addressLine?.message}
            {...profileForm.register('addressLine')}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" required error={profileForm.formState.errors.city?.message} {...profileForm.register('city')} />
            <Input label="State" required error={profileForm.formState.errors.state?.message} {...profileForm.register('state')} />
            <Input label="Postal code" required error={profileForm.formState.errors.postalCode?.message} {...profileForm.register('postalCode')} />
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-primary cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-brand-700" {...profileForm.register('acceptingOrders')} />
            <span>Accepting customer orders</span>
          </label>

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfileMutation.isPending}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Drug Licenses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-primary">Drug Licenses</h2>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setLicenseModalOpen(true)}>
            Submit License
          </Button>
        </div>
        <Table
          caption="Pharmacy drug licenses"
          columns={licenseColumns}
          data={profile.licenses}
          rowKey={(l) => l.id}
          emptyMessage="No licenses submitted yet."
        />
      </div>

      {/* Delivery Zones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Delivery Zones</span>
          </h2>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingZone(null);
              zoneForm.reset({ zoneName: '', postalCode: '', city: profile.city, deliveryFee: 0, minOrderAmount: 0, estimatedDeliveryMinutes: 45 });
              setZoneModalOpen(true);
            }}
          >
            Add Delivery Zone
          </Button>
        </div>
        <Table
          caption="Pharmacy delivery zones"
          columns={zoneColumns}
          data={profile.deliveryZones}
          rowKey={(z) => z.id}
          emptyMessage="No delivery zones configured yet."
        />
      </div>

      {/* License Modal */}
      <Modal
        open={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        title="Submit Drug License"
      >
        <form
          onSubmit={licenseForm.handleSubmit((vals) => submitLicenseMutation.mutate(vals))}
          className="space-y-4"
        >
          <Input label="Drug license number" required error={licenseForm.formState.errors.licenseNumber?.message} {...licenseForm.register('licenseNumber')} />
          <Input label="Issuing authority" required error={licenseForm.formState.errors.issuingAuthority?.message} {...licenseForm.register('issuingAuthority')} />
          <Input label="Registered pharmacist name" required error={licenseForm.formState.errors.pharmacistName?.message} {...licenseForm.register('pharmacistName')} />
          <Input label="Pharmacist registration no." required error={licenseForm.formState.errors.pharmacistRegistrationNumber?.message} {...licenseForm.register('pharmacistRegistrationNumber')} />
          <Input label="Expiry date" type="date" required error={licenseForm.formState.errors.expiryDate?.message} {...licenseForm.register('expiryDate')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLicenseModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitLicenseMutation.isPending}>Submit License</Button>
          </div>
        </form>
      </Modal>

      {/* Delivery Zone Modal */}
      <Modal
        open={zoneModalOpen}
        onClose={() => {
          setZoneModalOpen(false);
          setEditingZone(null);
        }}
        title={editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
      >
        <form
          onSubmit={zoneForm.handleSubmit((vals) => saveZoneMutation.mutate(vals))}
          className="space-y-4"
        >
          <Input label="Zone name" required error={zoneForm.formState.errors.zoneName?.message} {...zoneForm.register('zoneName')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Postal code" required error={zoneForm.formState.errors.postalCode?.message} {...zoneForm.register('postalCode')} />
            <Input label="City" required error={zoneForm.formState.errors.city?.message} {...zoneForm.register('city')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Delivery fee (₹)" type="number" step="0.01" required error={zoneForm.formState.errors.deliveryFee?.message} {...zoneForm.register('deliveryFee')} />
            <Input label="Min order (₹)" type="number" step="0.01" required error={zoneForm.formState.errors.minOrderAmount?.message} {...zoneForm.register('minOrderAmount')} />
            <Input label="ETA (mins)" type="number" required error={zoneForm.formState.errors.estimatedDeliveryMinutes?.message} {...zoneForm.register('estimatedDeliveryMinutes')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setZoneModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveZoneMutation.isPending}>Save Zone</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
