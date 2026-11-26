import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, Plus, ShieldCheck, Upload } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Select,
  Tabs,
  Textarea,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { catalogApi } from '@/features/catalog/catalogApi';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { Prescription, PrescriptionStatus } from '@/types/storefront';

type RxTab = 'ALL' | PrescriptionStatus;

const STATUS_BADGE: Record<PrescriptionStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
  CANCELLED: 'neutral',
};

export function CustomerPrescriptionsPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const [tab, setTab] = useState<RxTab>('ALL');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailRx, setDetailRx] = useState<Prescription | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pharmacyId, setPharmacyId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorReg, setDoctorReg] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  const prescriptionsQuery = useQuery({
    queryKey: ['customer', 'prescriptions', tab],
    queryFn: () =>
      storefrontApi.listCustomerPrescriptions({
        status: tab === 'ALL' ? undefined : tab,
        size: 30,
      }),
  });

  const pharmaciesQuery = useQuery({
    queryKey: ['public', 'pharmacies', 'rx-upload'],
    queryFn: () => catalogApi.listPublicPharmacies({ size: 50 }),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) {
        throw new Error('Select a PDF or image prescription file first.');
      }
      return storefrontApi.uploadPrescription(selectedFile, {
        pharmacyId: pharmacyId ? Number(pharmacyId) : undefined,
        patientName: patientName.trim(),
        patientAge: patientAge ? Number(patientAge) : undefined,
        doctorName: doctorName.trim(),
        doctorRegistrationNumber: doctorReg.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        issuedDate: issuedDate || undefined,
        validUntil: validUntil || undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'prescriptions'] });
      setUploadOpen(false);
      setSelectedFile(null);
      setPatientName('');
      setDoctorName('');
      setNotes('');
      notify({
        variant: 'success',
        title: 'Prescription Uploaded',
        message: `Reference ${created.referenceCode} queued for pharmacist review.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Upload Failed', message: normalizeApiError(err).message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: storefrontApi.cancelCustomerPrescription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'prescriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
      notify({ variant: 'info', title: 'Prescription Cancelled', message: 'Status updated.' });
    },
  });

  const openDocument = async (rx: Prescription) => {
    try {
      const blob = await storefrontApi.fetchCustomerPrescriptionBlob(rx.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Unable to Open Document', message: normalizeApiError(err).message });
    }
  };

  const inspectAudit = async (rxId: number) => {
    try {
      const detailed = await storefrontApi.getCustomerPrescription(rxId);
      setDetailRx(detailed);
    } catch (err) {
      notify({ variant: 'error', title: 'Load Failed', message: normalizeApiError(err).message });
    }
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  if (prescriptionsQuery.isLoading) {
    return <PageLoader message="Loading your prescription records..." />;
  }

  const prescriptions = prescriptionsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Prescriptions &amp; Audit History</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Upload PDF or image prescriptions for qualified pharmacist review and link them to scheduled medicines.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>
          Upload Prescription
        </Button>
      </div>

      <Tabs<RxTab>
        label="Filter prescriptions by status"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'ALL', label: 'All' },
          { value: 'PENDING_REVIEW', label: 'Pending Review' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'EXPIRED', label: 'Expired' },
        ]}
      />

      {prescriptions.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No prescriptions in this view</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Upload a clear PDF, JPG, PNG, or WEBP copy of your practitioner prescription.
          </p>
          <Button className="mt-4" onClick={() => setUploadOpen(true)}>
            Upload Prescription
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <Card key={rx.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-primary">{rx.referenceCode}</span>
                    <Badge variant={STATUS_BADGE[rx.status]}>{rx.status}</Badge>
                    {rx.pharmacyName && <Badge variant="neutral">{rx.pharmacyName}</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-ink-primary">
                    Patient: {rx.patientName} • Doctor: {rx.doctorName}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    Issued: {rx.issuedDate} • Valid Until: {rx.validUntil} • File: {rx.originalFilename}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => void openDocument(rx)}
                  >
                    View File
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                    onClick={() => void inspectAudit(rx.id)}
                  >
                    Audit History
                  </Button>
                  {rx.status === 'PENDING_REVIEW' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelMutation.mutate(rx.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {rx.status === 'REJECTED' && rx.rejectionReason && (
                <AlertBanner
                  variant="error"
                  title="Rejected by Reviewing Pharmacist"
                  description={rx.rejectionReason}
                />
              )}

              {rx.status === 'APPROVED' && rx.pharmacistName && (
                <p className="text-xs font-medium text-brand-800">
                  Verified by {rx.pharmacistName} (Reg. {rx.pharmacistRegistrationNumber}) at{' '}
                  {rx.reviewedByPharmacyName}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Upload Prescription Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Medical Prescription"
        description="Accepted formats: PDF, JPEG, PNG, WEBP (up to 10 MB). Files are stored privately."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="rx-file-input" className="block text-sm font-medium text-ink-primary">
              Prescription Document (PDF / Image) *
            </label>
            <input
              id="rx-file-input"
              type="file"
              required
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full rounded-[var(--medexa-radius-md)] border border-border-strong p-2 text-sm text-ink-secondary"
            />
          </div>

          <Select
            label="Target Verified Pharmacy (optional)"
            value={pharmacyId}
            onChange={(e) => setPharmacyId(e.target.value)}
            options={[
              { value: '', label: 'Any Verified Partner Pharmacy' },
              ...(pharmaciesQuery.data?.items ?? []).map((ph) => ({
                value: String(ph.id),
                label: `${ph.pharmacyName} (${ph.city})`,
              })),
            ]}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Patient name"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <Input
              label="Patient age"
              type="number"
              min={0}
              max={130}
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Doctor name"
              required
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
            <Input
              label="Doctor registration no."
              value={doctorReg}
              onChange={(e) => setDoctorReg(e.target.value)}
            />
          </div>

          <Input
            label="Clinic or Hospital (optional)"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Issued date"
              type="date"
              required
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
            />
            <Input
              label="Valid until (optional)"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          <Textarea
            label="Patient notes (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={uploadMutation.isPending}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Submit for Verification
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit History Modal */}
      <Modal
        open={Boolean(detailRx)}
        onClose={() => setDetailRx(null)}
        title={detailRx ? `Prescription Audit — ${detailRx.referenceCode}` : 'Audit History'}
      >
        {detailRx && (
          <div className="space-y-4 text-sm">
            <div className="rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-3 text-xs space-y-1">
              <p>
                <strong>Status:</strong> {detailRx.status}
              </p>
              <p>
                <strong>Doctor:</strong> {detailRx.doctorName}{' '}
                {detailRx.doctorRegistrationNumber ? `(${detailRx.doctorRegistrationNumber})` : ''}
              </p>
              <p>
                <strong>Validity:</strong> {detailRx.issuedDate} to {detailRx.validUntil}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                Immutable Audit Timeline
              </h3>
              <ol className="mt-2 space-y-2 border-s-2 border-brand-200 ps-4">
                {detailRx.auditHistory.map((entry) => (
                  <li key={entry.id} className="text-xs">
                    <p className="font-semibold text-ink-primary">
                      {entry.action} — {entry.actorName} ({entry.actorRole})
                    </p>
                    {entry.notes && <p className="text-ink-secondary">{entry.notes}</p>}
                    <p className="text-[11px] text-ink-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
