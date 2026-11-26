import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import {
  AlertBanner,
  Badge,
  Button,
  Input,
  Modal,
  PageLoader,
  Select,
  Table,
  Tabs,
  Textarea,
  type TableColumn,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { resolveMediaUrl } from '@/config/env';
import { catalogApi } from '@/features/catalog/catalogApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { MedicineApprovalStatus, PharmacyMedicine } from '@/types/catalog';

const medicineSchema = z
  .object({
    categoryId: z.string().min(1, 'Select a category.'),
    name: z.string().trim().min(2).max(200),
    brand: z.string().trim().min(1).max(150),
    manufacturer: z.string().trim().min(2).max(180),
    composition: z.string().trim().min(2).max(500),
    dosageForm: z.string().trim().min(1).max(80),
    packSize: z.string().trim().min(1).max(80),
    description: z.string().trim().optional(),
    mrpPrice: z.coerce.number().positive('MRP must be greater than zero.'),
    sellingPrice: z.coerce.number().positive('Selling price must be greater than zero.'),
    prescriptionRequired: z.boolean(),
  })
  .refine((data) => data.sellingPrice <= data.mrpPrice, {
    message: 'Selling price cannot exceed MRP price.',
    path: ['sellingPrice'],
  });

type MedicineFormValues = z.infer<typeof medicineSchema>;
type StatusTab = 'ALL' | MedicineApprovalStatus;

export function PharmacyMedicinesPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<PharmacyMedicine | null>(null);
  const [imagesMedicine, setImagesMedicine] = useState<PharmacyMedicine | null>(null);
  const [primaryUpload, setPrimaryUpload] = useState(true);

  const categoriesQuery = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: catalogApi.listPublicCategories,
  });

  const medicinesQuery = useQuery({
    queryKey: ['pharmacy', 'medicines', statusTab],
    queryFn: () =>
      catalogApi.listPharmacyMedicines({
        status: statusTab === 'ALL' ? undefined : statusTab,
        size: 50,
      }),
  });

  const form = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: { prescriptionRequired: false },
    mode: 'onBlur',
  });

  const saveMutation = useMutation({
    mutationFn: (values: MedicineFormValues) => {
      const payload = {
        ...values,
        categoryId: Number(values.categoryId),
      };
      return editingMedicine
        ? catalogApi.updateMedicine(editingMedicine.id, payload)
        : catalogApi.createMedicine(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      setFormModalOpen(false);
      setEditingMedicine(null);
      form.reset();
      notify({ variant: 'success', title: 'Medicine submitted for review' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Save failed', message: normalizeApiError(err).message }),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogApi.deleteMedicine,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      notify({ variant: 'info', title: 'Medicine listing deactivated' });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ medicineId, file, primary }: { medicineId: number; file: File; primary: boolean }) =>
      catalogApi.uploadMedicineImage(medicineId, file, primary),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      notify({ variant: 'success', title: 'Medicine image uploaded' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Image upload failed', message: normalizeApiError(err).message }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ medicineId, imageId }: { medicineId: number; imageId: number }) =>
      catalogApi.deleteMedicineImage(medicineId, imageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
    },
  });

  const openCreateModal = () => {
    setEditingMedicine(null);
    form.reset({
      categoryId: categoriesQuery.data?.[0]?.id ? String(categoriesQuery.data[0].id) : '',
      name: '',
      brand: '',
      manufacturer: '',
      composition: '',
      dosageForm: 'Tablet',
      packSize: 'Strip of 10 tablets',
      description: '',
      mrpPrice: 0,
      sellingPrice: 0,
      prescriptionRequired: false,
    });
    setFormModalOpen(true);
  };

  const openEditModal = (med: PharmacyMedicine) => {
    setEditingMedicine(med);
    form.reset({
      categoryId: String(med.categoryId),
      name: med.name,
      brand: med.brand,
      manufacturer: med.manufacturer,
      composition: med.composition,
      dosageForm: med.dosageForm,
      packSize: med.packSize,
      description: med.description ?? '',
      mrpPrice: med.mrpPrice,
      sellingPrice: med.sellingPrice,
      prescriptionRequired: med.prescriptionRequired,
    });
    setFormModalOpen(true);
  };

  const medicines = medicinesQuery.data?.items ?? [];
  const activeImagesMed = imagesMedicine
    ? medicines.find((m) => m.id === imagesMedicine.id) ?? imagesMedicine
    : null;

  const columns: TableColumn<PharmacyMedicine>[] = [
    {
      key: 'name',
      header: 'Medicine',
      isRowHeader: true,
      render: (m) => (
        <div>
          <p className="font-semibold text-ink-primary">{m.name}</p>
          <p className="text-xs font-normal text-ink-muted">
            {m.brand} • {m.packSize}
          </p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (m) => m.categoryName },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (m) => <span className="tabular-nums">₹{m.sellingPrice.toFixed(2)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (m) => <span className="tabular-nums">{m.totalAvailableQuantity}</span>,
    },
    {
      key: 'rx',
      header: 'Type',
      render: (m) => (
        <Badge variant={m.prescriptionRequired ? 'warning' : 'neutral'}>
          {m.prescriptionRequired ? 'Rx' : 'OTC'}
        </Badge>
      ),
    },
    {
      key: 'approval',
      header: 'Approval Status',
      render: (m) => (
        <div className="space-y-1">
          <Badge
            variant={
              m.approvalStatus === 'APPROVED'
                ? 'success'
                : m.approvalStatus === 'REJECTED'
                  ? 'danger'
                  : 'warning'
            }
          >
            {m.approvalStatus.replace('_', ' ')}
          </Badge>
          {m.rejectionReason && <p className="text-xs text-[#b42318]">{m.rejectionReason}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setImagesMedicine(m)} leftIcon={<ImagePlus className="h-3.5 w-3.5" />}>
            Images ({m.images.length})
          </Button>
          <button
            type="button"
            aria-label={`Edit ${m.name}`}
            onClick={() => openEditModal(m)}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-ink-secondary hover:bg-surface-soft cursor-pointer"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Deactivate ${m.name}`}
            onClick={() => deleteMutation.mutate(m.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[#b42318] hover:bg-surface-soft cursor-pointer"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Medicine Listings</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Submit medicines for admin approval, manage pricing, and upload product packaging images.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Add Medicine
        </Button>
      </div>

      <Tabs<StatusTab>
        label="Medicine approval status filter"
        value={statusTab}
        onChange={setStatusTab}
        options={[
          { value: 'ALL', label: 'All Listings' },
          { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
        ]}
      />

      {medicinesQuery.isLoading ? (
        <PageLoader message="Loading medicine listings..." />
      ) : medicinesQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Could not load medicines"
          description={normalizeApiError(medicinesQuery.error).message}
        />
      ) : (
        <Table
          caption="Pharmacy medicine listings"
          columns={columns}
          data={medicines}
          rowKey={(m) => m.id}
          emptyMessage="No medicine listings found in this status tab."
        />
      )}

      {/* Add / Edit Medicine Modal */}
      <Modal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingMedicine(null);
        }}
        size="lg"
        title={editingMedicine ? 'Edit Medicine Listing' : 'Add New Medicine'}
        description="Edits and new submissions enter administrator approval before appearing in the customer catalog."
      >
        <form onSubmit={form.handleSubmit((vals) => saveMutation.mutate(vals))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              required
              options={(categoriesQuery.data ?? []).map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              error={form.formState.errors.categoryId?.message}
              {...form.register('categoryId')}
            />
            <Input
              label="Medicine name"
              required
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Brand" required error={form.formState.errors.brand?.message} {...form.register('brand')} />
            <Input label="Manufacturer" required error={form.formState.errors.manufacturer?.message} {...form.register('manufacturer')} />
          </div>

          <Input label="Composition" required error={form.formState.errors.composition?.message} {...form.register('composition')} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dosage form" placeholder="Tablet, Syrup, Capsule..." required error={form.formState.errors.dosageForm?.message} {...form.register('dosageForm')} />
            <Input label="Pack size" placeholder="Strip of 10 tablets" required error={form.formState.errors.packSize?.message} {...form.register('packSize')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="MRP price (₹)" type="number" step="0.01" required error={form.formState.errors.mrpPrice?.message} {...form.register('mrpPrice')} />
            <Input label="Selling price (₹)" type="number" step="0.01" required error={form.formState.errors.sellingPrice?.message} {...form.register('sellingPrice')} />
          </div>

          <Textarea label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />

          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-primary cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-brand-700" {...form.register('prescriptionRequired')} />
            <span>Prescription required (Rx)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingMedicine ? 'Save & Resubmit' : 'Submit Medicine'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Medicine Images Modal */}
      <Modal
        open={Boolean(activeImagesMed)}
        onClose={() => setImagesMedicine(null)}
        title={`Medicine Images — ${activeImagesMed?.name ?? ''}`}
      >
        {activeImagesMed && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3.5">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-ink-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={primaryUpload}
                  onChange={(e) => setPrimaryUpload(e.target.checked)}
                  className="h-4 w-4 accent-brand-700"
                />
                <span>Set uploaded image as primary thumbnail</span>
              </label>
              <label className="inline-flex items-center gap-2 rounded-[var(--medexa-radius-md)] bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 cursor-pointer">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                <span>{uploadImageMutation.isPending ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="visually-hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadImageMutation.mutate({
                        medicineId: activeImagesMed.id,
                        file,
                        primary: primaryUpload,
                      });
                    }
                  }}
                />
              </label>
            </div>

            {activeImagesMed.images.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">No product images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activeImagesMed.images.map((img) => {
                  const url = resolveMediaUrl(img.imageUrl);
                  return (
                    <div key={img.id} className="rounded-[var(--medexa-radius-md)] border border-border-subtle overflow-hidden">
                      <div className="aspect-square bg-surface-soft">
                        {url && <img src={url} alt={img.altText || activeImagesMed.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-2 text-xs">
                        {img.primaryImage ? <Badge variant="brand">Primary</Badge> : <span className="text-ink-muted">Gallery</span>}
                        <button
                          type="button"
                          onClick={() => deleteImageMutation.mutate({ medicineId: activeImagesMed.id, imageId: img.id })}
                          className="text-[#b42318] font-medium hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
