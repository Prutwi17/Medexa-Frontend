import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Camera,
  CheckCircle2,
  Clock,
  LocateFixed,
  MapPin,
  Navigation,
  PackageCheck,
  Power,
  ShieldAlert,
  Truck,
  XCircle,
} from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, Modal, PageLoader, Textarea } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { DeliveryStatus, RiderDelivery } from '@/types/delivery';

function badgeForDeliveryStatus(status: DeliveryStatus): 'brand' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'DELIVERED') return 'success';
  if (status === 'FAILED' || status === 'REASSIGNMENT_REQUIRED') return 'danger';
  if (status === 'OUT_FOR_DELIVERY' || status === 'PICKED_UP' || status === 'ACCEPTED') return 'brand';
  return 'warning';
}

export function RiderDashboardPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const [otpTarget, setOtpTarget] = useState<RiderDelivery | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [otpNotes, setOtpNotes] = useState('');

  const [rejectTarget, setRejectTarget] = useState<RiderDelivery | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [failTarget, setFailTarget] = useState<RiderDelivery | null>(null);
  const [failReason, setFailReason] = useState('');

  const profileQuery = useQuery({
    queryKey: ['rider', 'profile'],
    queryFn: deliveryApi.getRiderProfile,
  });

  const activeQuery = useQuery({
    queryKey: ['rider', 'deliveries', 'active'],
    queryFn: deliveryApi.listActiveDeliveries,
    refetchInterval: 8000,
  });

  const earningsQuery = useQuery({
    queryKey: ['rider', 'earnings'],
    queryFn: () => deliveryApi.getRiderEarnings({ size: 5 }),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['rider'] });
  };

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (nextStatus: 'ONLINE' | 'OFFLINE') =>
      deliveryApi.updateRiderAvailability({ availabilityStatus: nextStatus }),
    onSuccess: (updated) => {
      invalidateAll();
      notify({
        variant: 'success',
        title: `Rider ${updated.availabilityStatus}`,
        message:
          updated.availabilityStatus === 'ONLINE'
            ? 'You are now visible for automatic dispatch in your active zones.'
            : 'You are now OFFLINE and paused from new dispatch offers.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Cannot Update Availability', message: normalizeApiError(err).message });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: (vars: { deliveryId: number; accepted: boolean; reason?: string }) =>
      deliveryApi.decideAssignment(vars.deliveryId, { accepted: vars.accepted, reason: vars.reason }),
    onSuccess: (updated, vars) => {
      invalidateAll();
      setRejectTarget(null);
      setRejectReason('');
      notify({
        variant: vars.accepted ? 'success' : 'info',
        title: vars.accepted ? 'Delivery Accepted' : 'Delivery Declined',
        message: vars.accepted
          ? `Pickup ${updated.deliveryReference} locked. Customer doorstep address is now unlocked.`
          : 'Assignment returned to automated ranking queue.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Decision Failed', message: normalizeApiError(err).message });
    },
  });

  const pickupMutation = useMutation({
    mutationFn: (deliveryId: number) => deliveryApi.confirmPickup(deliveryId, 'Picked up verified package'),
    onSuccess: (updated) => {
      invalidateAll();
      notify({
        variant: 'success',
        title: 'Pickup Confirmed',
        message: `${updated.deliveryReference} collected from ${updated.pharmacyName}.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Pickup Failed', message: normalizeApiError(err).message });
    },
  });

  const outForDeliveryMutation = useMutation({
    mutationFn: (deliveryId: number) => deliveryApi.markOutForDelivery(deliveryId),
    onSuccess: (updated) => {
      invalidateAll();
      notify({
        variant: 'success',
        title: 'Out For Delivery',
        message: `Customer OTP generated for ${updated.orderNumber}.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Dispatch Update Failed', message: normalizeApiError(err).message });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: (vars: { deliveryId: number; file: File }) =>
      deliveryApi.uploadDeliveryProof(vars.deliveryId, vars.file),
    onSuccess: () => {
      invalidateAll();
      notify({ variant: 'success', title: 'Delivery Proof Uploaded', message: 'Proof image attached cleanly.' });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Upload Failed', message: normalizeApiError(err).message });
    },
  });

  const completeOtpMutation = useMutation({
    mutationFn: () => {
      if (!otpTarget) throw new Error('No delivery selected');
      return deliveryApi.completeDeliveryWithOtp(otpTarget.id, {
        otp: otpInput.trim(),
        recipientName: recipientInput.trim() || undefined,
        notes: otpNotes.trim() || undefined,
      });
    },
    onSuccess: (completed) => {
      invalidateAll();
      setOtpTarget(null);
      setOtpInput('');
      setRecipientInput('');
      setOtpNotes('');
      notify({
        variant: 'success',
        title: 'Delivery Completed!',
        message: `${completed.orderNumber} verified via OTP. Earning ₹${completed.estimatedEarning.toFixed(2)} accrued.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'OTP Verification Failed', message: normalizeApiError(err).message });
    },
  });

  const failMutation = useMutation({
    mutationFn: () => {
      if (!failTarget) throw new Error('No delivery selected');
      return deliveryApi.reportDeliveryFailure(failTarget.id, failReason.trim());
    },
    onSuccess: () => {
      invalidateAll();
      setFailTarget(null);
      setFailReason('');
      notify({
        variant: 'warning',
        title: 'Exception Recorded',
        message: 'Delivery failure reported to Medexa operations.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Report Failed', message: normalizeApiError(err).message });
    },
  });

  const pingLocation = (deliveryId?: number) => {
    if (!navigator.geolocation) {
      notify({ variant: 'warning', title: 'Geolocation Unsupported', message: 'Use profile GPS settings instead.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          };
          if (deliveryId) {
            await deliveryApi.updateDeliveryLocation(deliveryId, coords);
          } else {
            await deliveryApi.updateRiderLocation(coords);
          }
          invalidateAll();
          notify({ variant: 'success', title: 'GPS Coordinates Synced', message: `${coords.latitude}, ${coords.longitude}` });
        } catch (err) {
          notify({ variant: 'error', title: 'Location Update Failed', message: normalizeApiError(err).message });
        }
      },
      () => notify({ variant: 'warning', title: 'Location Permission Declined', message: 'Update coordinates in Rider Profile if needed.' })
    );
  };

  if (profileQuery.isLoading || activeQuery.isLoading) {
    return <PageLoader message="Loading your rider dispatch dashboard..." />;
  }

  const profile = profileQuery.data;
  const activeDeliveries = activeQuery.data ?? [];
  const earnings = earningsQuery.data;

  if (!profile) {
    return (
      <AlertBanner
        variant="error"
        title="Unable to load rider profile"
        description={normalizeApiError(profileQuery.error).message}
      />
    );
  }

  const isApproved = profile.verificationStatus === 'APPROVED';
  const isOnline = profile.availabilityStatus === 'ONLINE' || profile.availabilityStatus === 'ON_DELIVERY';

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    completeOtpMutation.mutate();
  };

  const handleRejectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    decisionMutation.mutate({ deliveryId: rejectTarget.id, accepted: false, reason: rejectReason.trim() });
  };

  const handleFailSubmit = (e: FormEvent) => {
    e.preventDefault();
    failMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-ink-primary">Rider Dispatch Hub</h1>
            <Badge variant={isApproved ? 'success' : profile.verificationStatus === 'REJECTED' ? 'danger' : 'warning'}>
              {profile.verificationStatus}
            </Badge>
            <Badge variant={isOnline ? 'brand' : 'neutral'}>{profile.availabilityStatus}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            {profile.fullName} • {profile.vehicleType} ({profile.vehicleRegistrationNumber}) • City: {profile.serviceCity}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pingLocation()}
            leftIcon={<LocateFixed className="h-4 w-4" />}
          >
            Sync GPS
          </Button>
          {isApproved && (
            <Button
              type="button"
              variant={profile.availabilityStatus === 'OFFLINE' ? 'primary' : 'outline'}
              loading={toggleAvailabilityMutation.isPending}
              disabled={profile.availabilityStatus === 'ON_DELIVERY'}
              onClick={() =>
                toggleAvailabilityMutation.mutate(profile.availabilityStatus === 'OFFLINE' ? 'ONLINE' : 'OFFLINE')
              }
              leftIcon={<Power className="h-4 w-4" />}
            >
              {profile.availabilityStatus === 'OFFLINE' ? 'Go Online for Dispatch' : 'Go Offline'}
            </Button>
          )}
        </div>
      </div>

      {!isApproved && (
        <AlertBanner
          variant={profile.verificationStatus === 'REJECTED' ? 'error' : 'warning'}
          title={`Account ${profile.verificationStatus}`}
          description={
            profile.rejectionReason ||
            'Upload your identity and driving license documents in Rider Profile so operations admin can verify your account.'
          }
        />
      )}

      {isApproved && profile.deliveryZones.filter((z) => z.active).length === 0 && (
        <AlertBanner
          variant="warning"
          title="No Active Delivery Zones Configured"
          description="Add at least one active postal code zone in Profile & Zones before going ONLINE."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-1">
          <span className="text-xs text-ink-muted">Active Workload</span>
          <p className="text-2xl font-bold text-ink-primary tabular-nums">
            {profile.activeDeliveryCount} / {profile.maxConcurrentDeliveries}
          </p>
          <p className="text-xs text-ink-secondary">Active deliveries</p>
        </Card>
        <Card className="space-y-1">
          <span className="text-xs text-ink-muted">Today&apos;s Earnings</span>
          <p className="text-2xl font-bold text-brand-700 tabular-nums">
            ₹{(earnings?.dailyEarnings ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-ink-secondary">{earnings?.todayDeliveries ?? 0} delivered today</p>
        </Card>
        <Card className="space-y-1">
          <span className="text-xs text-ink-muted">This Month</span>
          <p className="text-2xl font-bold text-ink-primary tabular-nums">
            ₹{(earnings?.monthlyEarnings ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-ink-secondary">{earnings?.monthDeliveries ?? 0} deliveries this month</p>
        </Card>
        <Card className="space-y-1">
          <span className="text-xs text-ink-muted">Active Zones</span>
          <p className="text-2xl font-bold text-ink-primary tabular-nums">
            {profile.deliveryZones.filter((z) => z.active).length}
          </p>
          <Link to={ROUTES.RIDER_PROFILE} className="text-xs font-semibold text-brand-700 hover:underline">
            Manage KYC &amp; Zones →
          </Link>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-primary">
            Active Assigned Deliveries ({activeDeliveries.length})
          </h2>
          <Link to={ROUTES.RIDER_ASSIGNMENTS} className="text-xs font-semibold text-brand-700 hover:underline">
            View Full Delivery History →
          </Link>
        </div>

        {activeDeliveries.length === 0 ? (
          <Card className="text-sm text-ink-secondary">
            No active deliveries right now. {isOnline ? 'Stay online to receive nearby pharmacy pickups.' : 'Go ONLINE when ready to accept deliveries.'}
          </Card>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((d) => (
              <Card key={d.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink-primary">{d.deliveryReference}</span>
                      <Badge variant={badgeForDeliveryStatus(d.status)}>{d.status}</Badge>
                      <Badge variant="neutral">Order {d.orderNumber}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-secondary">
                      Distance: {d.distanceKm} km • Estimated Payout: ₹{d.estimatedEarning.toFixed(2)}
                      {d.assignmentExpiresAt && d.status === 'ASSIGNED'
                        ? ` • Accept before ${new Date(d.assignmentExpiresAt).toLocaleTimeString()}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => pingLocation(d.id)}
                      leftIcon={<Navigation className="h-3.5 w-3.5" />}
                    >
                      Ping GPS
                    </Button>
                    <Link to={`/rider/deliveries/${d.id}`}>
                      <Button size="sm" variant="outline">
                        Details &amp; Timeline
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-ink-primary">
                      <PackageCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
                      <span>Pickup Pharmacy</span>
                    </div>
                    <p className="font-semibold text-ink-primary">{d.pharmacyName}</p>
                    <p className="text-ink-secondary">
                      {d.pharmacyAddress}, {d.pharmacyCity} - {d.pharmacyPostalCode}
                    </p>
                    <p className="text-ink-muted">Phone: {d.pharmacyPhone}</p>
                  </div>

                  <div className="rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-ink-primary">
                      <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
                      <span>Customer Drop Location</span>
                    </div>
                    <p className="font-semibold text-ink-primary">{d.customerName}</p>
                    <p className="text-ink-secondary">
                      {d.customerAddress}, {d.customerCity}, {d.customerState} - {d.customerPostalCode}
                    </p>
                    {d.customerPhone && <p className="text-ink-muted">Phone: {d.customerPhone}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-2">
                    {d.status === 'ASSIGNED' && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          loading={decisionMutation.isPending}
                          onClick={() => decisionMutation.mutate({ deliveryId: d.id, accepted: true })}
                          leftIcon={<CheckCircle2 className="h-4 w-4" />}
                        >
                          Accept Pickup
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectTarget(d)}
                          leftIcon={<XCircle className="h-4 w-4" />}
                        >
                          Reject Offer
                        </Button>
                      </>
                    )}

                    {d.status === 'ACCEPTED' && (
                      <Button
                        type="button"
                        size="sm"
                        loading={pickupMutation.isPending}
                        onClick={() => pickupMutation.mutate(d.id)}
                        leftIcon={<PackageCheck className="h-4 w-4" />}
                      >
                        Confirm Pharmacy Pickup
                      </Button>
                    )}

                    {d.status === 'PICKED_UP' && (
                      <Button
                        type="button"
                        size="sm"
                        loading={outForDeliveryMutation.isPending}
                        onClick={() => outForDeliveryMutation.mutate(d.id)}
                        leftIcon={<Truck className="h-4 w-4" />}
                      >
                        Start Out For Delivery (Generate OTP)
                      </Button>
                    )}

                    {d.status === 'OUT_FOR_DELIVERY' && (
                      <>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--medexa-radius-sm)] border border-border-subtle px-3 py-1.5 text-xs font-semibold text-ink-primary hover:bg-surface-soft">
                          <Camera className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
                          <span>{d.hasDeliveryProof ? 'Proof Attached ✓' : 'Upload Proof Photo'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadProofMutation.mutate({ deliveryId: d.id, file });
                            }}
                          />
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setOtpTarget(d)}
                          leftIcon={<CheckCircle2 className="h-4 w-4" />}
                        >
                          Verify Customer OTP &amp; Complete
                        </Button>
                      </>
                    )}
                  </div>

                  {(d.status === 'ACCEPTED' || d.status === 'PICKED_UP' || d.status === 'OUT_FOR_DELIVERY') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFailTarget(d)}
                      leftIcon={<ShieldAlert className="h-3.5 w-3.5 text-[#b42318]" />}
                    >
                      Report Exception
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {earnings && earnings.recentEarnings.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <Banknote className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Recent Delivery Earnings</span>
            </h3>
            <Link to={ROUTES.RIDER_EARNINGS} className="text-xs font-semibold text-brand-700 hover:underline">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-border-subtle text-xs">
            {earnings.recentEarnings.map((e) => (
              <div key={e.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-ink-primary">{e.orderNumber}</span>
                  <p className="text-ink-muted">
                    Base ₹{e.baseFee.toFixed(2)} + Distance ₹{e.distanceBonus.toFixed(2)} •{' '}
                    {new Date(e.earnedAt).toLocaleString()}
                  </p>
                </div>
                <span className="font-bold text-brand-700 tabular-nums">₹{e.totalEarning.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* OTP Completion Modal */}
      <Modal
        open={Boolean(otpTarget)}
        onClose={() => setOtpTarget(null)}
        title={otpTarget ? `Complete Delivery ${otpTarget.orderNumber}` : 'Complete Delivery'}
        description="Ask the customer for the 6-digit OTP visible on their Medexa Order Tracking screen."
      >
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          {otpTarget && (
            <div className="flex items-center gap-2 rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3 text-xs text-ink-secondary">
              <Clock className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
              <span>
                Attempts remaining: <strong>{otpTarget.otpAttemptsRemaining}</strong>
                {otpTarget.otpExpiresAt
                  ? ` • Expires ${new Date(otpTarget.otpExpiresAt).toLocaleTimeString()}`
                  : ''}
              </span>
            </div>
          )}
          <Input
            label="6-Digit Customer OTP"
            required
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            placeholder="e.g. 482913"
          />
          <Input
            label="Received By Name (optional)"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder={otpTarget?.customerName || 'Recipient name'}
          />
          <Textarea
            label="Handover Notes (optional)"
            rows={2}
            value={otpNotes}
            onChange={(e) => setOtpNotes(e.target.value)}
            placeholder="Left in person after verification"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOtpTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={completeOtpMutation.isPending}>
              Confirm Handover
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Offer Modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={rejectTarget ? `Decline ${rejectTarget.deliveryReference}` : 'Decline Offer'}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <Textarea
            label="Reason for Declining (optional)"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Vehicle issue, far distance, shift ending"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={decisionMutation.isPending}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Exception Modal */}
      <Modal
        open={Boolean(failTarget)}
        onClose={() => setFailTarget(null)}
        title={failTarget ? `Report Exception for ${failTarget.orderNumber}` : 'Report Exception'}
      >
        <form onSubmit={handleFailSubmit} className="space-y-4">
          <Textarea
            label="Mandatory Exception Reason"
            required
            rows={3}
            value={failReason}
            onChange={(e) => setFailReason(e.target.value)}
            placeholder="Customer unreachable after repeated calls / address blocked..."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFailTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={failMutation.isPending}>
              Submit Exception
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
