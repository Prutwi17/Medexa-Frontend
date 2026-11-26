import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FolderTree, ImagePlus, Pencil, Plus } from 'lucide-react';
import { z } from 'zod';
import {
  Badge,
  Button,
  Input,
  Modal,
  PageLoader,
  Table,
  Textarea,
  type TableColumn,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { resolveMediaUrl } from '@/config/env';
import { catalogApi } from '@/features/catalog/catalogApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { Category } from '@/types/catalog';

const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().max(500).optional(),
  displayOrder: z.coerce.number().int().min(0),
});

type CategoryValues = z.infer<typeof categorySchema>;

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: catalogApi.listAdminCategories,
  });

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { displayOrder: 0 },
    mode: 'onBlur',
  });

  const saveMutation = useMutation({
    mutationFn: (vals: CategoryValues) =>
      editing ? catalogApi.updateCategory(editing.id, vals) : catalogApi.createCategory(vals),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'categories'] });
      setModalOpen(false);
      setEditing(null);
      form.reset();
      notify({ variant: 'success', title: 'Category saved' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Save failed', message: normalizeApiError(err).message }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      catalogApi.setCategoryStatus(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      void queryClient.invalidateQueries({ queryKey: ['public', 'categories'] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => catalogApi.uploadCategoryImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      notify({ variant: 'success', title: 'Category image uploaded' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Upload failed', message: normalizeApiError(err).message }),
  });

  const columns: TableColumn<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      isRowHeader: true,
      render: (c) => {
        const imgUrl = resolveMediaUrl(c.imageUrl);
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-surface-soft border border-border-subtle flex items-center justify-center">
              {imgUrl ? (
                <img src={imgUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <FolderTree className="h-4 w-4 text-brand-700" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="font-semibold text-ink-primary">{c.name}</p>
              <p className="text-xs font-normal text-ink-muted">{c.slug}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'order', header: 'Order', align: 'right', render: (c) => <span className="tabular-nums">{c.displayOrder}</span> },
    {
      key: 'active',
      header: 'Status',
      render: (c) => <Badge variant={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1 rounded border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-ink-primary hover:bg-surface-soft cursor-pointer">
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="visually-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImageMutation.mutate({ id: c.id, file });
              }}
            />
          </label>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={() => {
              setEditing(c);
              form.reset({
                name: c.name,
                slug: c.slug,
                description: c.description ?? '',
                displayOrder: c.displayOrder,
              });
              setModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleStatusMutation.mutate({ id: c.id, active: !c.active })}
          >
            {c.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Category Management</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Manage therapeutic medicine categories, display ordering, and category images.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            form.reset({ name: '', slug: '', description: '', displayOrder: 0 });
            setModalOpen(true);
          }}
        >
          New Category
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <PageLoader message="Loading categories..." />
      ) : (
        <Table
          caption="Medicine categories"
          columns={columns}
          data={categoriesQuery.data ?? []}
          rowKey={(c) => c.id}
          emptyMessage="No categories created yet."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={form.handleSubmit((vals) => saveMutation.mutate(vals))} className="space-y-4">
          <Input label="Category name" required error={form.formState.errors.name?.message} {...form.register('name')} />
          <Input
            label="URL slug (optional)"
            hint="Leave blank to auto-generate from name."
            error={form.formState.errors.slug?.message}
            {...form.register('slug')}
          />
          <Input
            label="Display order"
            type="number"
            min="0"
            required
            error={form.formState.errors.displayOrder?.message}
            {...form.register('displayOrder')}
          />
          <Textarea label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>Save Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
