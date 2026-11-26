import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, MapPin, PackageCheck, Truck } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, PageLoader, Textarea } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { normalizeApiError } from '@/lib/errorHandler';

export function RiderDeliveryDetailPage() {
  const { deliveryId = '0' } = useParams();
  const id = Number(deliveryId);
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const [otp, setOtp] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const detailQuery = useQuery({
    queryKey: ['rider', 'delivery', id],
    queryFn: () => deliveryApi.getRiderDelivery(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['rider'] });
  };

  const decisionMutation = useMutation({
    mutationFn: (accepted: boolean) =>
      deliveryApi.decideAssignment(id, { accepted, reason: accepted ? undefined : rejectReason.trim() }),
    onSuccess: (_, accepted) => {
      invalidate();
      notify({
        variant: accepted ? 'success' : 'info',
        title: accepted ? 'Accepted' : 'Rejected',
        message: accepted ? 'Pickup locked and doorstep address unlocked.' : 'Returned to assignment pool.',
      });
    },
    onError: (err) => notify({ variant: 'error', title: 'Action Failed', message: normalizeApiError(err).message }),
  });

  const pickupMutation = useMutation({
    mutationFn: () => deliveryApi.confirmPickup(id),
    onSuccess: () => {
      invalidate();
      notify({ variant: 'success', title: 'Picked Up', message: 'Ready to mark Out For Delivery.' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Error', message: normalizeApiError(err).message }),
  });

  const outMutation = useMutation({
    mutationFn: () => deliveryApi.markOutForDelivery(id),
    onSuccess: () => {
      invalidate();
      notify({ variant: 'success', title: 'Out For Delivery', message: 'Customer OTP active now.' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Error', message: normalizeApiError(err).message }),
  });

  const proofMutation = useMutation({
    mutationFn: (file: File) => deliveryApi.uploadDeliveryProof(id, file),
    onSuccess: () => {
      invalidate();
      notify({ variant: 'success', title: 'Proof Uploaded', message: 'Photo proof attached cleanly.' });
    },
    onError: (err) => notify({ variant: 'error', title: 'Upload Failed', message: normalizeApiError(err).message }),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      deliveryApi.completeDeliveryWithOtp(id, {
        otp: otp.trim(),
        recipientName: recipientName.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setOtp('');
      notify({ variant: 'success', title: 'Delivery Completed!', message: 'OTP verified and earning credited.' });
    },
    onError: (err) => notify({ variant: 'error', title: 'OTP Error', message: normalizeApiError(err).message }),
  });

  if (detailQuery.isLoading) {
    return <PageLoader message="Loading delivery route and timeline..." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <AlertBanner
        variant="error"
        title="Delivery unavailable"
        description={normalizeApiError(detailQuery.error).message}
      />
    );
  }

  const d = detailQuery.data;

  const handleOtpComplete = (e: FormEvent) => {
    e.preventDefault();
    completeMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={ROUTES.RIDER_DASHBOARD}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Dispatch Hub</span>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-bold text-ink-primary">{d.deliveryReference}</h1>
          <Badge variant={d.status === 'DELIVERED' ? 'success' : 'brand'}>{d.status}</Badge>
          <Badge variant="neutral">{d.orderNumber}</Badge>
        </div>
        <p className="mt-1 text-xs text-ink-secondary">
          Distance: {d.distanceKm} km • Payout: ₹{d.estimatedEarning.toFixed(2)} • Attempt #{d.assignmentAttempts}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Pharmacy Pickup</span>
            </h2>
            <p className="font-semibold text-sm text-ink-primary">{d.pharmacyName}</p>
            <p className="text-xs text-ink-secondary">
              {d.pharmacyAddress}, {d.pharmacyCity} — {d.pharmacyPostalCode}
            </p>
            <p className="text-xs text-ink-muted">Contact: {d.pharmacyPhone}</p>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Customer Delivery Address</span>
            </h2>
            <p className="font-semibold text-sm text-ink-primary">{d.customerName}</p>
            <p className="text-xs text-ink-secondary">
              {d.customerAddress}, {d.customerCity}, {d.customerState} — {d.customerPostalCode}
            </p>
            {d.customerPhone && <p className="text-xs text-ink-muted">Phone: {d.customerPhone}</p>}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-bold text-ink-primary">Delivery Timeline</h2>
            <ol className="space-y-2 border-s-2 border-brand-200 ps-3 text-xs">
              {d.events.map((ev) => (
                <li key={ev.id}>
                  <p className="font-bold text-ink-primary">
                    {ev.eventType} ({ev.newStatus}){' '}
                    <span className="font-normal text-ink-muted">via {ev.actorName}</span>
                  </p>
                  {ev.notes && <p className="text-ink-secondary">{ev.notes}</p>}
                  <p className="text-[11px] text-ink-muted">{new Date(ev.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-ink-primary">Workflow Actions</h2>

            {d.status === 'ASSIGNED' && (
              <div className="space-y-3">
                <Button
                  type="button"
                  fullWidth
                  loading={decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate(true)}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Accept Pickup Assignment
                </Button>
                <Textarea
                  label="Rejection Reason (if declining)"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Button
                  type="button"
                  fullWidth
                  variant="danger"
                  loading={decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate(false)}
                >
                  Reject &amp; Reassign
                </Button>
              </div>
            )}

            {d.status === 'ACCEPTED' && (
              <Button
                type="button"
                fullWidth
                loading={pickupMutation.isPending}
                onClick={() => pickupMutation.mutate()}
                leftIcon={<PackageCheck className="h-4 w-4" />}
              >
                Confirm Pharmacy Pickup
              </Button>
            )}

            {d.status === 'PICKED_UP' && (
              <Button
                type="button"
                fullWidth
                loading={outMutation.isPending}
                onClick={() => outMutation.mutate()}
                leftIcon={<Truck className="h-4 w-4" />}
              >
                Mark Out For Delivery
              </Button>
            )}

            {d.status === 'OUT_FOR_DELIVERY' && (
              <form onSubmit={handleOtpComplete} className="space-y-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--medexa-radius-sm)] border border-border-subtle p-2.5 text-xs font-semibold hover:bg-surface-soft">
                  <Camera className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <span>{d.hasDeliveryProof ? 'Update Proof Photo ✓' : 'Attach Handover Proof Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) proofMutation.mutate(file);
                    }}
                  />
                </label>

                <Input
                  label="Customer 6-Digit Delivery OTP"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP from customer"
                />
                <Input
                  label="Confirmed Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={d.customerName}
                />
                <Textarea
                  label="Notes (optional)"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button type="submit" fullWidth loading={completeMutation.isPending}>
                  Verify OTP &amp; Mark Delivered
                </Button>
              </form>
            )}

            {d.status === 'DELIVERED' && (
              <AlertBanner
                variant="success"
                title="Delivered & Verified"
                description={`Proof: ${d.proofType || 'OTP_VERIFIED'}. Completed on ${
                  d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : ''
                }.`}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
