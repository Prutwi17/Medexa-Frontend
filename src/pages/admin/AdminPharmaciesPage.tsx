import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
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
import { resolveMediaUrl } from '@/config/env';
import { catalogApi } from '@/features/catalog/catalogApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { PharmacyProfile, VerificationStatus } from '@/types/catalog';

type PharmacyTab = 'ALL' | VerificationStatus;

export function AdminPharmaciesPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<PharmacyTab>('PENDING_VERIFICATION');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 250);

  const [reviewPharmacy, setReviewPharmacy] = useState<PharmacyProfile | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const pharmaciesQuery = useQuery({
    queryKey: ['admin', 'pharmacies', tab, debouncedSearch],
    queryFn: () =>
      catalogApi.listAdminPharmacies({
        status: tab === 'ALL' ? undefined : tab,
        q: debouncedSearch.trim() || undefined,
        size: 50,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, approved, notes }: { id: number; approved: boolean; notes?: string }) =>
      catalogApi.verifyPharmacy(id, { approved, notes }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pharmacies'] });
      setReviewPharmacy(null);
      setDecisionNotes('');
      notify({
        variant: vars.approved ? 'success' : 'info',
        title: vars.approved ? 'Pharmacy verified & activated' : 'Pharmacy application rejected',
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Action failed', message: normalizeApiError(err).message }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, suspended, reason }: { id: number; suspended: boolean; reason?: string }) =>
      catalogApi.updatePharmacyStatus(id, { suspended, reason }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pharmacies'] });
      setReviewPharmacy(null);
      notify({
        variant: vars.suspended ? 'warning' : 'success',
        title: vars.suspended ? 'Pharmacy suspended' : 'Pharmacy reactivated',
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Status update failed', message: normalizeApiError(err).message }),
  });

  const columns: TableColumn<PharmacyProfile>[] = [
    {
      key: 'pharmacyName',
      header: 'Pharmacy',
      isRowHeader: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-ink-primary">{p.pharmacyName}</p>
          <p className="text-xs font-normal text-ink-muted">
            {p.ownerName} • {p.ownerEmail}
          </p>
        </div>
      ),
    },
    { key: 'location', header: 'City / PIN', render: (p) => `${p.city}, ${p.postalCode}` },
    {
      key: 'license',
      header: 'Latest License',
      render: (p) => p.licenses[0]?.licenseNumber || 'None submitted',
    },
    {
      key: 'status',
      header: 'Verification',
      render: (p) => (
        <Badge
          variant={
            p.verificationStatus === 'APPROVED'
              ? 'success'
              : p.verificationStatus === 'REJECTED' || p.verificationStatus === 'SUSPENDED'
                ? 'danger'
                : 'warning'
          }
        >
          {p.verificationStatus.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Review',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => {
              setReviewPharmacy(p);
              setDecisionNotes('');
            }}
          >
            Review License
          </Button>
          {p.verificationStatus === 'APPROVED' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                statusMutation.mutate({
                  id: p.id,
                  suspended: true,
                  reason: 'Suspended by compliance administrator',
                })
              }
            >
              Suspend
            </Button>
          )}
          {p.verificationStatus === 'SUSPENDED' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => statusMutation.mutate({ id: p.id, suspended: false })}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Pharmacy &amp; Licence Verification</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Inspect pharmacy drug licenses, approve compliant partners, or suspend non-compliant accounts.
        </p>
      </div>

      <Card>
        <div className="max-w-md">
          <Input
            label="Search pharmacies"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Name, city, or owner email"
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      <Tabs<PharmacyTab>
        label="Pharmacy verification status filter"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'PENDING_VERIFICATION', label: 'Pending Review' },
          { value: 'APPROVED', label: 'Verified Active' },
          { value: 'SUSPENDED', label: 'Suspended' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'ALL', label: 'All Pharmacies' },
        ]}
      />

      {pharmaciesQuery.isLoading ? (
        <PageLoader message="Loading pharmacy verification queue..." />
      ) : pharmaciesQuery.isError ? (
        <AlertBanner
          variant="error"
          title="Unable to load pharmacies"
          description={normalizeApiError(pharmaciesQuery.error).message}
        />
      ) : (
        <Table
          caption="Pharmacy verification queue"
          columns={columns}
          data={pharmaciesQuery.data?.items ?? []}
          rowKey={(p) => p.id}
          emptyMessage="No pharmacies match this verification filter."
        />
      )}

      {/* License Review Modal */}
      <Modal
        open={Boolean(reviewPharmacy)}
        onClose={() => setReviewPharmacy(null)}
        size="lg"
        title={`Licence Review — ${reviewPharmacy?.pharmacyName ?? ''}`}
      >
        {reviewPharmacy && (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-ink-muted">Owner &amp; Contact</p>
                <p className="font-semibold text-ink-primary">{reviewPharmacy.ownerName}</p>
                <p className="text-xs text-ink-secondary">{reviewPharmacy.ownerEmail} • {reviewPharmacy.contactPhone}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Address</p>
                <p className="text-ink-primary">{reviewPharmacy.addressLine}</p>
                <p className="text-xs text-ink-secondary">
                  {reviewPharmacy.city}, {reviewPharmacy.state} {reviewPharmacy.postalCode}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-ink-primary">Submitted Drug Licenses</h2>
              <div className="mt-2 space-y-2.5">
                {reviewPharmacy.licenses.map((lic) => {
                  const docUrl = resolveMediaUrl(lic.documentUrl);
                  return (
                    <div key={lic.id} className="rounded-[var(--medexa-radius-md)] border border-border-subtle p-3.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-ink-primary">{lic.licenseNumber}</p>
                        <Badge variant={lic.verificationStatus === 'APPROVED' ? 'success' : 'warning'}>
                          {lic.verificationStatus}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">
                        Authority: {lic.issuingAuthority} • Pharmacist: {lic.pharmacistName} ({lic.pharmacistRegistrationNumber})
                      </p>
                      <p className="mt-1 text-xs text-ink-secondary">Expiry Date: {lic.expiryDate}</p>
                      {docUrl && (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Open Uploaded Licence Document →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Review notes / rejection reason"
              hint="Required if rejecting; optional compliance note if approving."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
            />

            <div className="flex flex-wrap justify-end gap-2.5 border-t border-border-subtle pt-4">
              <Button
                variant="danger"
                leftIcon={<ShieldAlert className="h-4 w-4" />}
                loading={verifyMutation.isPending}
                onClick={() =>
                  verifyMutation.mutate({
                    id: reviewPharmacy.id,
                    approved: false,
                    notes: decisionNotes,
                  })
                }
              >
                Reject Application
              </Button>
              <Button
                variant="primary"
                leftIcon={<ShieldCheck className="h-4 w-4" />}
                loading={verifyMutation.isPending}
                onClick={() =>
                  verifyMutation.mutate({
                    id: reviewPharmacy.id,
                    approved: true,
                    notes: decisionNotes || 'Drug license verified by administrator',
                  })
                }
              >
                Approve &amp; Activate Pharmacy
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
