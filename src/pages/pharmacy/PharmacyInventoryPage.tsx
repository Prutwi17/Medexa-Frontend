import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { z } from 'zod';
import {
  Badge,
  Button,
  Input,
  Modal,
  PageLoader,
  Select,
  Table,
  Tabs,
  type TableColumn,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { catalogApi } from '@/features/catalog/catalogApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { MedicineBatch, StockMovement, StockMovementType } from '@/types/catalog';

const addBatchSchema = z.object({
  medicineId: z.string().min(1, 'Select a medicine.'),
  batchNumber: z.string().trim().min(2).max(100),
  manufacturingDate: z.string().min(1, 'Manufacturing date is required.'),
  expiryDate: z.string().min(1, 'Expiry date is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
  purchasePrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
});

const adjustSchema = z.object({
  movementType: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'EXPIRED_WRITE_OFF']),
  quantityDelta: z.coerce.number().int().refine((n) => n !== 0, 'Delta cannot be zero.'),
  reason: z.string().trim().min(3, 'Provide an adjustment reason.').max(300),
});

type AddBatchValues = z.infer<typeof addBatchSchema>;
type AdjustValues = z.infer<typeof adjustSchema>;
type InventoryTab = 'BATCHES' | 'EXPIRY_ALERTS' | 'MOVEMENTS';

export function PharmacyInventoryPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<InventoryTab>('BATCHES');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adjustingBatch, setAdjustingBatch] = useState<MedicineBatch | null>(null);

  const medicinesQuery = useQuery({
    queryKey: ['pharmacy', 'medicines', 'all-for-batch'],
    queryFn: () => catalogApi.listPharmacyMedicines({ size: 100 }),
  });

  const batchesQuery = useQuery({
    queryKey: ['pharmacy', 'batches'],
    queryFn: () => catalogApi.listBatches({ includeExpired: true, size: 50 }),
    enabled: tab === 'BATCHES',
  });

  const alertsQuery = useQuery({
    queryKey: ['pharmacy', 'expiry-alerts', 60],
    queryFn: () => catalogApi.getExpiryAlerts(60),
    enabled: tab === 'EXPIRY_ALERTS',
  });

  const movementsQuery = useQuery({
    queryKey: ['pharmacy', 'movements'],
    queryFn: () => catalogApi.listStockMovements({ size: 50 }),
    enabled: tab === 'MOVEMENTS',
  });

  const addForm = useForm<AddBatchValues>({
    resolver: zodResolver(addBatchSchema),
    mode: 'onBlur',
  });

  const adjustForm = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { movementType: 'ADJUSTMENT_OUT', quantityDelta: -1, reason: '' },
    mode: 'onBlur',
  });

  const addBatchMutation = useMutation({
    mutationFn: (vals: AddBatchValues) =>
      catalogApi.addBatch({
        ...vals,
        medicineId: Number(vals.medicineId),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      setAddModalOpen(false);
      addForm.reset();
      notify({ variant: 'success', title: 'Inventory batch added' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Batch add failed', message: normalizeApiError(err).message }),
  });

  const adjustMutation = useMutation({
    mutationFn: (vals: AdjustValues) => {
      if (!adjustingBatch) throw new Error('No batch selected');
      return catalogApi.adjustStock(adjustingBatch.id, {
        quantityDelta: vals.quantityDelta,
        movementType: vals.movementType as StockMovementType,
        reason: vals.reason,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      setAdjustingBatch(null);
      adjustForm.reset();
      notify({ variant: 'success', title: 'Stock adjusted' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Adjustment failed', message: normalizeApiError(err).message }),
  });

  const batchColumns: TableColumn<MedicineBatch>[] = [
    { key: 'medicine', header: 'Medicine', isRowHeader: true, render: (b) => b.medicineName },
    { key: 'batchNumber', header: 'Batch #', render: (b) => b.batchNumber },
    { key: 'mfg', header: 'Mfg Date', render: (b) => b.manufacturingDate },
    { key: 'expiry', header: 'Expiry Date', render: (b) => b.expiryDate },
    {
      key: 'expiryStatus',
      header: 'Shelf Life',
      render: (b) => (
        <Badge variant={b.expired ? 'danger' : b.daysUntilExpiry <= 60 ? 'warning' : 'success'}>
          {b.expired ? 'Expired' : `${b.daysUntilExpiry}d left`}
        </Badge>
      ),
    },
    {
      key: 'available',
      header: 'Available / Reserved',
      align: 'right',
      render: (b) => <span className="tabular-nums">{b.availableQuantity} / {b.reservedQuantity}</span>,
    },
    {
      key: 'sellingPrice',
      header: 'Sell Price',
      align: 'right',
      render: (b) => <span className="tabular-nums">₹{b.sellingPrice.toFixed(2)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          onClick={() => {
            setAdjustingBatch(b);
            adjustForm.reset({
              movementType: b.expired ? 'EXPIRED_WRITE_OFF' : 'ADJUSTMENT_OUT',
              quantityDelta: b.expired ? -Math.max(1, b.availableQuantity) : -1,
              reason: b.expired ? 'Expired batch write-off' : '',
            });
          }}
        >
          Adjust
        </Button>
      ),
    },
  ];

  const movementColumns: TableColumn<StockMovement>[] = [
    { key: 'medicine', header: 'Medicine', isRowHeader: true, render: (m) => m.medicineName },
    { key: 'batch', header: 'Batch #', render: (m) => m.batchNumber },
    {
      key: 'type',
      header: 'Movement',
      render: (m) => <Badge variant="neutral">{m.movementType}</Badge>,
    },
    {
      key: 'delta',
      header: 'Delta',
      align: 'right',
      render: (m) => (
        <span className={`tabular-nums font-semibold ${m.quantityDelta >= 0 ? 'text-brand-700' : 'text-[#b42318]'}`}>
          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance After',
      align: 'right',
      render: (m) => <span className="tabular-nums">{m.balanceAfter}</span>,
    },
    { key: 'reason', header: 'Reason', render: (m) => m.reason || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Batch Inventory &amp; FEFO Stock</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Track manufacturing/expiry dates, monitor upcoming expiries, and audit every stock movement.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            addForm.reset({
              medicineId: medicinesQuery.data?.items[0]?.id ? String(medicinesQuery.data.items[0].id) : '',
              batchNumber: '',
              manufacturingDate: '',
              expiryDate: '',
              quantity: 10,
              purchasePrice: 0,
              sellingPrice: 0,
            });
            setAddModalOpen(true);
          }}
        >
          Add Batch
        </Button>
      </div>

      <Tabs<InventoryTab>
        label="Inventory workspace sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'BATCHES', label: 'All Batches' },
          { value: 'EXPIRY_ALERTS', label: 'Expiry Alerts (60d)' },
          { value: 'MOVEMENTS', label: 'Stock Movement History' },
        ]}
      />

      {tab === 'BATCHES' &&
        (batchesQuery.isLoading ? (
          <PageLoader message="Loading batches..." />
        ) : (
          <Table
            caption="Medicine inventory batches"
            columns={batchColumns}
            data={batchesQuery.data?.items ?? []}
            rowKey={(b) => b.id}
            emptyMessage="No inventory batches added yet."
          />
        ))}

      {tab === 'EXPIRY_ALERTS' &&
        (alertsQuery.isLoading ? (
          <PageLoader message="Loading expiry alerts..." />
        ) : (
          <Table
            caption="Expiring and expired medicine batches"
            columns={batchColumns}
            data={alertsQuery.data ?? []}
            rowKey={(b) => b.id}
            emptyMessage="No batches expiring within the next 60 days."
          />
        ))}

      {tab === 'MOVEMENTS' &&
        (movementsQuery.isLoading ? (
          <PageLoader message="Loading stock movements..." />
        ) : (
          <Table
            caption="Inventory stock movement history"
            columns={movementColumns}
            data={movementsQuery.data?.items ?? []}
            rowKey={(m) => m.id}
            emptyMessage="No stock movements recorded yet."
          />
        ))}

      {/* Add Batch Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Medicine Batch">
        <form onSubmit={addForm.handleSubmit((vals) => addBatchMutation.mutate(vals))} className="space-y-4">
          <Select
            label="Medicine"
            required
            options={(medicinesQuery.data?.items ?? []).map((m) => ({
              value: String(m.id),
              label: `${m.name} (${m.brand})`,
            }))}
            error={addForm.formState.errors.medicineId?.message}
            {...addForm.register('medicineId')}
          />
          <Input label="Batch number" required error={addForm.formState.errors.batchNumber?.message} {...addForm.register('batchNumber')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Manufacturing date" type="date" required error={addForm.formState.errors.manufacturingDate?.message} {...addForm.register('manufacturingDate')} />
            <Input label="Expiry date" type="date" required error={addForm.formState.errors.expiryDate?.message} {...addForm.register('expiryDate')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Quantity" type="number" min="1" required error={addForm.formState.errors.quantity?.message} {...addForm.register('quantity')} />
            <Input label="Purchase price (₹)" type="number" step="0.01" required error={addForm.formState.errors.purchasePrice?.message} {...addForm.register('purchasePrice')} />
            <Input label="Selling price (₹)" type="number" step="0.01" required error={addForm.formState.errors.sellingPrice?.message} {...addForm.register('sellingPrice')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addBatchMutation.isPending}>Save Batch</Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        open={Boolean(adjustingBatch)}
        onClose={() => setAdjustingBatch(null)}
        title={`Adjust Batch — ${adjustingBatch?.batchNumber ?? ''}`}
      >
        <form onSubmit={adjustForm.handleSubmit((vals) => adjustMutation.mutate(vals))} className="space-y-4">
          <Select
            label="Movement type"
            required
            options={[
              { value: 'ADJUSTMENT_IN', label: 'Adjustment In (+)' },
              { value: 'ADJUSTMENT_OUT', label: 'Adjustment Out (-)' },
              { value: 'EXPIRED_WRITE_OFF', label: 'Expired Write-Off (-)' },
            ]}
            error={adjustForm.formState.errors.movementType?.message}
            {...adjustForm.register('movementType')}
          />
          <Input
            label="Quantity delta (use negative to deduct)"
            type="number"
            required
            error={adjustForm.formState.errors.quantityDelta?.message}
            {...adjustForm.register('quantityDelta')}
          />
          <Input
            label="Reason"
            required
            error={adjustForm.formState.errors.reason?.message}
            {...adjustForm.register('reason')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAdjustingBatch(null)}>Cancel</Button>
            <Button type="submit" loading={adjustMutation.isPending}>Apply Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
