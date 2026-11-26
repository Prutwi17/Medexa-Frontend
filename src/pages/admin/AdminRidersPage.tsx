import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, FileText, MapPin, Search, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Select,
  Textarea,
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { RiderAvailabilityStatus, RiderProfile, VerificationStatus } from '@/types/delivery';

export function AdminRidersPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 250);

  const [selectedRider, setSelectedRider] = useState<RiderProfile | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [baseFeeInput, setBaseFeeInput] = useState('40.00');
  const [maxConcurrentInput, setMaxConcurrentInput] = useState('2');

  const ridersQuery = useQuery({
    queryKey: ['admin', 'riders', { statusFilter, availabilityFilter, debouncedQuery }],
    queryFn: () =>
      deliveryApi.listAdminRiders({
        status: (statusFilter || undefined) as VerificationStatus | undefined,
        availabilityStatus: (availabilityFilter || undefined) as RiderAvailabilityStatus | undefined,
        q: debouncedQuery.trim() || undefined,
        size: 30,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: (vars: { riderId: number; approved: boolean }) =>
      deliveryApi.verifyAdminRider(vars.riderId, {
        approved: vars.approved,
        notes: verifyNotes.trim() || undefined,
        baseFeePerDelivery: Number(baseFeeInput) || 40,
        maxConcurrentDeliveries: Number(maxConcurrentInput) || 2,
      }),
    onSuccess: (updated, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'riders'] });
      setSelectedRider(updated);
      setVerifyNotes('');
      notify({
        variant: vars.approved ? 'success' : 'info',
        title: vars.approved ? 'Rider Approved' : 'Rider Rejected',
        message: `${updated.fullName} updated to ${updated.verificationStatus}.`,
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Decision Failed', message: normalizeApiError(err).message }),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { riderId: number; suspended: boolean; reason?: string }) =>
      deliveryApi.updateAdminRiderStatus(vars.riderId, { suspended: vars.suspended, reason: vars.reason }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'riders'] });
      if (selectedRider?.id === updated.id) setSelectedRider(updated);
      notify({
        variant: 'info',
        title: `Rider ${updated.verificationStatus}`,
        message: `${updated.fullName} account status updated.`,
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Update Failed', message: normalizeApiError(err).message }),
  });

  const openDocument = async (riderId: number, docType: 'IDENTITY' | 'DRIVING_LICENSE') => {
    try {
      const blob = await deliveryApi.fetchAdminRiderDocBlob(riderId, docType);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Document Unavailable', message: normalizeApiError(err).message });
    }
  };

  if (ridersQuery.isLoading) {
    return <PageLoader message="Loading delivery fleet & rider onboarding queue..." />;
  }

  const riders = ridersQuery.data?.items ?? [];

  const handleReject = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRider) return;
    verifyMutation.mutate({ riderId: selectedRider.id, approved: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Rider Fleet &amp; Verification Management</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Review driving licences and KYC documents, configure dispatch fees/capacity, and manage rider availability.
        </p>
      </div>

      <Card className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Search Rider Name, Email, DL #, Vehicle"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Name, DL-..., or KA01..."
          leftAddon={<Search className="h-4 w-4" />}
        />
        <Select
          label="Verification Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All Verification Statuses' },
            { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
        />
        <Select
          label="Availability"
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          options={[
            { value: '', label: 'All Availability' },
            { value: 'ONLINE', label: 'Online' },
            { value: 'ON_DELIVERY', label: 'On Delivery' },
            { value: 'OFFLINE', label: 'Offline' },
          ]}
        />
      </Card>

      {riders.length === 0 ? (
        <AlertBanner
          variant="info"
          title="No matching riders found"
          description="Riders registering via the Rider Onboarding flow will appear here for KYC review."
        />
      ) : (
        <div className="space-y-3">
          {riders.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink-primary">{r.fullName}</span>
                  <Badge
                    variant={
                      r.verificationStatus === 'APPROVED'
                        ? 'success'
                        : r.verificationStatus === 'PENDING_VERIFICATION'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {r.verificationStatus}
                  </Badge>
                  <Badge variant={r.availabilityStatus === 'OFFLINE' ? 'neutral' : 'brand'}>
                    {r.availabilityStatus}
                  </Badge>
                </div>
                <p className="text-xs text-ink-secondary">
                  {r.email} • {r.phoneNumber} • {r.vehicleType} ({r.vehicleRegistrationNumber}) • DL:{' '}
                  <span className="font-mono">{r.drivingLicenseNumber}</span>
                </p>
                <p className="text-[11px] text-ink-muted">
                  City: {r.serviceCity} • Zones: {r.deliveryZones.filter((z) => z.active).length} active • Workload:{' '}
                  {r.activeDeliveryCount}/{r.maxConcurrentDeliveries} • Base Fee: ₹{r.baseFeePerDelivery.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {r.verificationStatus === 'APPROVED' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({ riderId: r.id, suspended: true, reason: 'Suspended by administrator' })
                    }
                    leftIcon={<ShieldAlert className="h-3.5 w-3.5 text-[#b42318]" />}
                  >
                    Suspend
                  </Button>
                ) : r.verificationStatus === 'SUSPENDED' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ riderId: r.id, suspended: false })}
                    leftIcon={<ShieldCheck className="h-3.5 w-3.5 text-brand-700" />}
                  >
                    Reactivate
                  </Button>
                ) : null}

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setSelectedRider(r);
                    setBaseFeeInput(String(r.baseFeePerDelivery));
                    setMaxConcurrentInput(String(r.maxConcurrentDeliveries));
                  }}
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Inspect / Verify
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selectedRider)}
        onClose={() => setSelectedRider(null)}
        title={selectedRider ? `Rider Verification — ${selectedRider.fullName}` : 'Rider Details'}
      >
        {selectedRider && (
          <div className="space-y-4 text-xs">
            <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3 space-y-1">
              <p>
                <strong>Vehicle:</strong> {selectedRider.vehicleType} — {selectedRider.vehicleRegistrationNumber}{' '}
                {selectedRider.vehicleModel ? `(${selectedRider.vehicleModel})` : ''}
              </p>
              <p>
                <strong>Driving Licence:</strong> <span className="font-mono">{selectedRider.drivingLicenseNumber}</span>
                {selectedRider.drivingLicenseExpiry ? ` (Expires ${selectedRider.drivingLicenseExpiry})` : ''}
              </p>
              <p>
                <strong>Identity:</strong> {selectedRider.identityDocumentType || 'Not set'}{' '}
                {selectedRider.identityDocumentNumber ? `(${selectedRider.identityDocumentNumber})` : ''}
              </p>
              <p className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                <span>
                  <strong>Zones:</strong>{' '}
                  {selectedRider.deliveryZones.length > 0
                    ? selectedRider.deliveryZones.map((z) => `${z.zoneName} (${z.postalCode})`).join(', ')
                    : 'No postal zones added yet'}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedRider.hasDrivingLicenseDocument && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void openDocument(selectedRider.id, 'DRIVING_LICENSE')}
                  leftIcon={<FileText className="h-3.5 w-3.5" />}
                >
                  Inspect Driving Licence File
                </Button>
              )}
              {selectedRider.hasIdentityDocument && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void openDocument(selectedRider.id, 'IDENTITY')}
                  leftIcon={<FileText className="h-3.5 w-3.5" />}
                >
                  Inspect Identity Document
                </Button>
              )}
            </div>

            <form onSubmit={handleReject} className="space-y-3 border-t border-border-subtle pt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Base Fee / Delivery (₹)"
                  type="number"
                  step="0.50"
                  value={baseFeeInput}
                  onChange={(e) => setBaseFeeInput(e.target.value)}
                />
                <Input
                  label="Max Concurrent Orders"
                  type="number"
                  min={1}
                  max={5}
                  value={maxConcurrentInput}
                  onChange={(e) => setMaxConcurrentInput(e.target.value)}
                />
              </div>
              <Textarea
                label="Verification / Rejection Notes"
                rows={2}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Notes visible on rejection or approval audit"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="submit"
                  variant="danger"
                  loading={verifyMutation.isPending}
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Reject Onboarding
                </Button>
                <Button
                  type="button"
                  loading={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ riderId: selectedRider.id, approved: true })}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Approve Rider
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
