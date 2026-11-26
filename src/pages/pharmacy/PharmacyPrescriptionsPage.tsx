import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, FileText, XCircle } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Tabs,
  Textarea,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { Prescription, PrescriptionStatus } from '@/types/storefront';

type QueueTab = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ALL';

const STATUS_BADGE: Record<PrescriptionStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
  CANCELLED: 'neutral',
};

export function PharmacyPrescriptionsPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<QueueTab>('PENDING_REVIEW');
  const [reviewingRx, setReviewingRx] = useState<Prescription | null>(null);
  const [decisionApprove, setDecisionApprove] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [validUntilOverride, setValidUntilOverride] = useState('');

  const queueQuery = useQuery({
    queryKey: ['pharmacy', 'prescriptions', tab],
    queryFn: () =>
      storefrontApi.listPharmacyPrescriptions({
        status: tab === 'ALL' ? undefined : tab,
        size: 30,
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!reviewingRx) throw new Error('No prescription selected.');
      return storefrontApi.reviewPharmacyPrescription(reviewingRx.id, {
        approved: decisionApprove,
        rejectionReason: !decisionApprove ? rejectionReason.trim() : undefined,
        reviewNotes: reviewNotes.trim() || undefined,
        validUntilOverride: validUntilOverride || undefined,
      });
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'] });
      setReviewingRx(null);
      setRejectionReason('');
      setReviewNotes('');
      setValidUntilOverride('');
      notify({
        variant: 'success',
        title: `Prescription ${updated.status}`,
        message: `${updated.referenceCode} updated cleanly.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Review Failed', message: normalizeApiError(err).message });
    },
  });

  const openDocument = async (rx: Prescription) => {
    try {
      const blob = await storefrontApi.fetchPharmacyPrescriptionBlob(rx.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Unable to View File', message: normalizeApiError(err).message });
    }
  };

  const openReviewModal = (rx: Prescription, approve: boolean) => {
    setReviewingRx(rx);
    setDecisionApprove(approve);
    setRejectionReason('');
    setReviewNotes('');
    setValidUntilOverride(rx.validUntil);
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate();
  };

  if (queueQuery.isLoading) {
    return <PageLoader message="Loading prescription verification queue..." />;
  }

  const prescriptions = queueQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Pharmacist Prescription Verification Queue</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Review uploaded prescriptions under your verified retail drug license before scheduled medicines can enter dispatch.
        </p>
      </div>

      <Tabs<QueueTab>
        label="Filter prescription verification queue"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'PENDING_REVIEW', label: 'Pending Review' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'ALL', label: 'All Queue' },
        ]}
      />

      {queueQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to load prescription queue"
          description={normalizeApiError(queueQuery.error).message}
        />
      ) : prescriptions.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">Queue is clear</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            No uploaded prescriptions match the selected verification filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <Card key={rx.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-primary">{rx.referenceCode}</span>
                    <Badge variant={STATUS_BADGE[rx.status]}>{rx.status}</Badge>
                    <Badge variant="neutral">{rx.pharmacyId ? 'Assigned to Your Pharmacy' : 'Open Marketplace Queue'}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-ink-primary">
                    Patient: {rx.patientName} {rx.patientAge ? `(${rx.patientAge}y)` : ''} • Customer:{' '}
                    {rx.customerName}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    Prescribing Doctor: {rx.doctorName}{' '}
                    {rx.doctorRegistrationNumber ? `(Reg. ${rx.doctorRegistrationNumber})` : ''} • Issued:{' '}
                    {rx.issuedDate} • Valid Until: {rx.validUntil}
                  </p>
                  {rx.notes && <p className="mt-1 text-xs text-ink-muted">Notes: {rx.notes}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => void openDocument(rx)}
                  >
                    Inspect Document
                  </Button>
                  {rx.status === 'PENDING_REVIEW' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onClick={() => openReviewModal(rx, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        leftIcon={<XCircle className="h-3.5 w-3.5" />}
                        onClick={() => openReviewModal(rx, false)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {rx.status === 'REJECTED' && rx.rejectionReason && (
                <AlertBanner variant="error" title="Rejection Reason" description={rx.rejectionReason} />
              )}
              {rx.status === 'APPROVED' && rx.pharmacistRegistrationNumber && (
                <p className="text-xs font-medium text-brand-800">
                  Signed by {rx.pharmacistName} (Reg. {rx.pharmacistRegistrationNumber})
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(reviewingRx)}
        onClose={() => setReviewingRx(null)}
        title={
          reviewingRx
            ? `${decisionApprove ? 'Approve' : 'Reject'} Prescription ${reviewingRx.referenceCode}`
            : 'Review Prescription'
        }
        description="Your registered pharmacist credentials from the active pharmacy license are stamped onto the audit log."
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {decisionApprove ? (
            <Input
              label="Confirmed Validity Date"
              type="date"
              value={validUntilOverride}
              onChange={(e) => setValidUntilOverride(e.target.value)}
            />
          ) : (
            <Textarea
              label="Mandatory Rejection Reason"
              required
              rows={3}
              placeholder="e.g. Expired prescription, illegible dosage instructions, missing doctor registration number"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          )}

          <Textarea
            label="Pharmacist Review Notes (optional)"
            rows={2}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReviewingRx(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionApprove ? 'primary' : 'danger'}
              loading={reviewMutation.isPending}
            >
              {decisionApprove ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
