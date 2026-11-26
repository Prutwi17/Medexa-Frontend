import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Eye, Image, RefreshCw, Search, Truck, UserPlus } from 'lucide-react';
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
} from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type { AdminDelivery, DeliveryStatus } from '@/types/delivery';

type AdminDeliveryTab = 'ALL' | 'EXCEPTIONS' | 'DELIVERED';

export function AdminDeliveriesPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<AdminDeliveryTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 250);

  const [detailDelivery, setDetailDelivery] = useState<AdminDelivery | null>(null);
  const [assignTarget, setAssignTarget] = useState<AdminDelivery | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const deliveriesQuery = useQuery({
    queryKey: ['admin', 'deliveries', { tab, statusFilter, debouncedQuery }],
    queryFn: () =>
      deliveryApi.listAdminDeliveries({
        status:
          tab === 'DELIVERED'
            ? 'DELIVERED'
            : ((statusFilter || undefined) as DeliveryStatus | undefined),
        exceptionsOnly: tab === 'EXCEPTIONS',
        q: debouncedQuery.trim() || undefined,
        size: 30,
      }),
    refetchInterval: 10000,
  });

  const verifiedRidersQuery = useQuery({
    queryKey: ['admin', 'riders', 'approved-pool'],
    queryFn: () => deliveryApi.listAdminRiders({ status: 'APPROVED', size: 100 }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
  };

  const sweepMutation = useMutation({
    mutationFn: deliveryApi.sweepAssignmentTimeouts,
    onSuccess: (res) => {
      invalidate();
      notify({
        variant: 'info',
        title: 'Timeout Sweep Completed',
        message: `${res.reassignedCount} stale offer(s) processed for reassignment.`,
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Sweep Failed', message: normalizeApiError(err).message }),
  });

  const retryAutoMutation = useMutation({
    mutationFn: (deliveryId: number) => deliveryApi.retryAutoAssignment(deliveryId),
    onSuccess: (updated) => {
      invalidate();
      if (detailDelivery?.id === updated.id) setDetailDelivery(updated);
      notify({
        variant: updated.status === 'ASSIGNED' ? 'success' : 'warning',
        title: `Dispatch Result: ${updated.status}`,
        message: updated.assignedRiderName
          ? `Assigned to ${updated.assignedRiderName}`
          : 'No online rider matched in zone right now.',
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Retry Failed', message: normalizeApiError(err).message }),
  });

  const manualAssignMutation = useMutation({
    mutationFn: () => {
      if (!assignTarget || !selectedRiderId) throw new Error('Select a rider');
      return deliveryApi.assignSpecificRider(assignTarget.id, {
        riderId: Number(selectedRiderId),
        notes: assignNotes.trim() || undefined,
      });
    },
    onSuccess: (updated) => {
      invalidate();
      setAssignTarget(null);
      setSelectedRiderId('');
      setAssignNotes('');
      if (detailDelivery?.id === updated.id) setDetailDelivery(updated);
      notify({
        variant: 'success',
        title: 'Rider Manually Assigned',
        message: `${updated.deliveryReference} assigned to ${updated.assignedRiderName}.`,
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Assignment Failed', message: normalizeApiError(err).message }),
  });

  const viewProof = async (deliveryId: number) => {
    try {
      const blob = await deliveryApi.fetchAdminProofBlob(deliveryId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      notify({ variant: 'error', title: 'Proof Unavailable', message: normalizeApiError(err).message });
    }
  };

  if (deliveriesQuery.isLoading) {
    return <PageLoader message="Loading delivery dispatch & exception telemetry..." />;
  }

  const deliveries = deliveriesQuery.data?.items ?? [];
  const verifiedRiders = verifiedRidersQuery.data?.items ?? [];

  const handleManualAssignSubmit = (e: FormEvent) => {
    e.preventDefault();
    manualAssignMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Delivery Dispatch &amp; Exception Monitoring</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Monitor automated rider assignments, expire timed-out offers, recover delivery exceptions, and verify completed proofs.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          loading={sweepMutation.isPending}
          onClick={() => sweepMutation.mutate()}
          leftIcon={<Clock className="h-4 w-4" />}
        >
          Sweep Timed-Out Offers
        </Button>
      </div>

      <Tabs<AdminDeliveryTab>
        label="Switch admin delivery queue view"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'ALL', label: 'All Dispatch Records' },
          { value: 'EXCEPTIONS', label: 'Unassigned & Exceptions' },
          { value: 'DELIVERED', label: 'Completed Deliveries' },
        ]}
      />

      <Card className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Search Delivery #, Order #, Pharmacy, or Customer"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="DLV-... or ORD-..."
          leftAddon={<Search className="h-4 w-4" />}
        />
        {tab === 'ALL' && (
          <Select
            label="Filter Delivery Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'WAITING_FOR_RIDER', label: 'Waiting For Rider' },
              { value: 'REASSIGNMENT_REQUIRED', label: 'Reassignment Required' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'PICKED_UP', label: 'Picked Up' },
              { value: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'FAILED', label: 'Failed' },
            ]}
          />
        )}
      </Card>

      {deliveries.length === 0 ? (
        <AlertBanner
          variant="info"
          title="No matching delivery records"
          description="Deliveries initialize automatically when pharmacies mark orders READY_FOR_PICKUP."
        />
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <Card key={d.id} className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Truck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                    <span className="font-mono text-sm font-bold text-ink-primary">{d.deliveryReference}</span>
                    <Badge
                      variant={
                        d.status === 'DELIVERED'
                          ? 'success'
                          : d.status === 'FAILED' || d.status === 'REASSIGNMENT_REQUIRED'
                            ? 'danger'
                            : d.status === 'WAITING_FOR_RIDER'
                              ? 'warning'
                              : 'brand'
                      }
                    >
                      {d.status}
                    </Badge>
                    <Badge variant="neutral">Order {d.orderNumber}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-secondary">
                    {d.pharmacyName} ({d.pharmacyPostalCode}) → {d.customerName} ({d.dropPostalCode}) • Distance:{' '}
                    {d.distanceKm} km • Attempts: {d.assignmentAttempts}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Assigned Rider:{' '}
                    <strong className="text-ink-primary">{d.assignedRiderName || 'Unassigned'}</strong>
                    {d.assignedRiderPhone ? ` (${d.assignedRiderPhone})` : ''}
                    {d.proofType ? ` • Proof: ${d.proofType}` : ''}
                  </p>
                  {d.failureReason && <p className="text-xs text-[#b42318]">Exception: {d.failureReason}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {d.status !== 'DELIVERED' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={retryAutoMutation.isPending}
                        onClick={() => retryAutoMutation.mutate(d.id)}
                        leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Retry Auto-Assign
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignTarget(d)}
                        leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                      >
                        Assign Rider
                      </Button>
                    </>
                  )}
                  {d.hasDeliveryProof && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void viewProof(d.id)}
                      leftIcon={<Image className="h-3.5 w-3.5" />}
                    >
                      Proof
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setDetailDelivery(d)}
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                  >
                    Audit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delivery Detail & Attempts Modal */}
      <Modal
        open={Boolean(detailDelivery)}
        onClose={() => setDetailDelivery(null)}
        title={detailDelivery ? `Delivery Audit — ${detailDelivery.deliveryReference}` : 'Delivery Audit'}
      >
        {detailDelivery && (
          <div className="space-y-4 text-xs">
            <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3 space-y-1">
              <p>
                <strong>Order:</strong> {detailDelivery.orderNumber} (Checkout {detailDelivery.checkoutReference})
              </p>
              <p>
                <strong>OTP Retries Used:</strong> {detailDelivery.otpAttempts} / {detailDelivery.maxOtpAttempts} •{' '}
                <strong>Rider Earning:</strong> ₹{detailDelivery.riderEarningAmount.toFixed(2)}
              </p>
              {detailDelivery.recipientConfirmedName && (
                <p>
                  <strong>Confirmed Recipient:</strong> {detailDelivery.recipientConfirmedName}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-bold uppercase text-ink-muted mb-1.5">Assignment Attempts</h3>
              {detailDelivery.attempts.length === 0 ? (
                <p className="text-ink-muted">No rider offers dispatched yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {detailDelivery.attempts.map((a) => (
                    <li key={a.id} className="rounded border border-border-subtle p-2">
                      <strong>#{a.attemptNumber} — {a.riderName}</strong> ({a.status}) • {a.distanceKm} km • Score{' '}
                      {a.rankingScore}
                      {a.rejectionReason ? ` • Note: ${a.rejectionReason}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-bold uppercase text-ink-muted mb-1.5">Delivery Timeline</h3>
              <ol className="space-y-1.5 border-s-2 border-brand-200 ps-3">
                {detailDelivery.events.map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.eventType}</strong> ({ev.newStatus}) — {ev.notes}{' '}
                    <span className="text-[11px] text-ink-muted">({new Date(ev.createdAt).toLocaleString()})</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Rider Assignment Modal */}
      <Modal
        open={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? `Assign Rider to ${assignTarget.deliveryReference}` : 'Assign Rider'}
      >
        <form onSubmit={handleManualAssignSubmit} className="space-y-4">
          <Select
            label="Select Verified Rider"
            required
            value={selectedRiderId}
            onChange={(e) => setSelectedRiderId(e.target.value)}
            options={[
              { value: '', label: 'Choose a verified rider...' },
              ...verifiedRiders.map((r) => ({
                value: String(r.id),
                label: `${r.fullName} — ${r.availabilityStatus} (${r.serviceCity}, workload ${r.activeDeliveryCount}/${r.maxConcurrentDeliveries})`,
              })),
            ]}
          />
          <Input
            label="Assignment Reason / Note"
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
            placeholder="Operations override assignment"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={manualAssignMutation.isPending}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
