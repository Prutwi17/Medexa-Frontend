import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Table,
  Tabs,
  Textarea,
  type TableColumn,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { catalogApi } from '@/features/catalog/catalogApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { MedicineApprovalStatus, PharmacyMedicine } from '@/types/catalog';

type QueueTab = 'ALL' | MedicineApprovalStatus;

export function AdminMedicinesPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<QueueTab>('PENDING_APPROVAL');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 250);

  const [rejectingMed, setRejectingMed] = useState<PharmacyMedicine | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const queueQuery = useQuery({
    queryKey: ['admin', 'medicines', tab, debouncedSearch],
    queryFn: () =>
      catalogApi.listAdminMedicines({
        status: tab === 'ALL' ? undefined : tab,
        q: debouncedSearch.trim() || undefined,
        size: 50,
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approved, reason }: { id: number; approved: boolean; reason?: string }) =>
      catalogApi.reviewMedicine(id, { approved, rejectionReason: reason }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'medicines'] });
      setRejectingMed(null);
      setRejectionReason('');
      notify({
        variant: vars.approved ? 'success' : 'info',
        title: vars.approved ? 'Medicine approved for catalog' : 'Medicine listing rejected',
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Review failed', message: normalizeApiError(err).message }),
  });

  const columns: TableColumn<PharmacyMedicine>[] = [
    {
      key: 'name',
      header: 'Medicine',
      isRowHeader: true,
      render: (m) => (
        <div>
          <p className="font-semibold text-ink-primary">{m.name}</p>
          <p className="text-xs font-normal text-ink-muted">
            {m.brand} • {m.composition}
          </p>
        </div>
      ),
    },
    { key: 'pharmacy', header: 'Pharmacy', render: (m) => m.pharmacyName },
    { key: 'category', header: 'Category', render: (m) => m.categoryName },
    {
      key: 'price',
      header: 'Selling / MRP',
      align: 'right',
      render: (m) => <span className="tabular-nums">₹{m.sellingPrice.toFixed(2)} / ₹{m.mrpPrice.toFixed(2)}</span>,
    },
    {
      key: 'rx',
      header: 'Dispensing',
      render: (m) => <Badge variant={m.prescriptionRequired ? 'warning' : 'neutral'}>{m.prescriptionRequired ? 'Rx Required' : 'OTC'}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
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
      header: 'Decision',
      render: (m) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            disabled={m.approvalStatus === 'APPROVED'}
            onClick={() => reviewMutation.mutate({ id: m.id, approved: true })}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<XCircle className="h-3.5 w-3.5" />}
            onClick={() => {
              setRejectingMed(m);
              setRejectionReason(m.rejectionReason ?? '');
            }}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Medicine Approval Queue</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Review pharmacy-submitted medicine listings before publication in the customer catalog.
        </p>
      </div>

      <Card>
        <div className="max-w-md">
          <Input
            label="Search listings"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Medicine, brand, or pharmacy"
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      <Tabs<QueueTab>
        label="Medicine approval queue tabs"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'ALL', label: 'All Submissions' },
        ]}
      />

      {queueQuery.isLoading ? (
        <PageLoader message="Loading medicine approval queue..." />
      ) : queueQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to load queue"
          description={normalizeApiError(queueQuery.error).message}
        />
      ) : (
        <Table
          caption="Medicine approval queue"
          columns={columns}
          data={queueQuery.data?.items ?? []}
          rowKey={(m) => m.id}
          emptyMessage="No medicine submissions in this status."
        />
      )}

      {/* Medicine Rejection Modal */}
      <Modal
        open={Boolean(rejectingMed)}
        onClose={() => setRejectingMed(null)}
        title={`Reject Medicine — ${rejectingMed?.name ?? ''}`}
        description="Provide a clear compliance or catalog reason so the pharmacy can correct and resubmit."
      >
        {rejectingMed && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              reviewMutation.mutate({
                id: rejectingMed.id,
                approved: false,
                reason: rejectionReason,
              });
            }}
            className="space-y-4"
          >
            <Textarea
              label="Rejection reason"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incorrect active composition strength or missing pack size details"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectingMed(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={reviewMutation.isPending}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
