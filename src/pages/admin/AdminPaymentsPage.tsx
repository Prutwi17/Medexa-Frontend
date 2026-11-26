import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, Search, ShieldCheck, Webhook, XCircle } from 'lucide-react';
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
import { paymentsApi } from '@/features/payments/paymentsApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeApiError } from '@/lib/errorHandler';
import type {
  PaymentRecord,
  PaymentStatus,
  RefundRecord,
  RefundRecordStatus,
} from '@/types/payments';

type AdminTab = 'REFUNDS' | 'PAYMENTS' | 'WEBHOOKS';

export function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<AdminTab>('REFUNDS');
  const [refundFilter, setRefundFilter] = useState<string>('REQUESTED');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 250);

  const [inspectPayment, setInspectPayment] = useState<PaymentRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RefundRecord | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const refundsQuery = useQuery({
    queryKey: ['admin', 'refunds', { refundFilter, debouncedQuery }],
    queryFn: () =>
      paymentsApi.listAdminRefunds({
        status: (refundFilter || undefined) as RefundRecordStatus | undefined,
        q: debouncedQuery.trim() || undefined,
        size: 30,
      }),
    enabled: tab === 'REFUNDS',
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments', { paymentFilter, debouncedQuery }],
    queryFn: () =>
      paymentsApi.listAdminPayments({
        status: (paymentFilter || undefined) as PaymentStatus | undefined,
        q: debouncedQuery.trim() || undefined,
        size: 30,
      }),
    enabled: tab === 'PAYMENTS',
  });

  const webhooksQuery = useQuery({
    queryKey: ['admin', 'webhooks'],
    queryFn: () => paymentsApi.listAdminWebhooks({ size: 40 }),
    enabled: tab === 'WEBHOOKS',
  });

  const processRefundMutation = useMutation({
    mutationFn: (vars: { refundId: number; notes?: string }) =>
      paymentsApi.processAdminRefund(vars.refundId, vars.notes),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      notify({
        variant: 'success',
        title: `Refund ${updated.status}`,
        message: `${updated.refundReference} processed via Razorpay (${updated.gatewayRefundId}).`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Refund Processing Failed', message: normalizeApiError(err).message });
    },
  });

  const rejectRefundMutation = useMutation({
    mutationFn: (vars: { refundId: number; notes: string }) =>
      paymentsApi.rejectAdminRefund(vars.refundId, vars.notes),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setRejectTarget(null);
      setDecisionNotes('');
      notify({
        variant: 'info',
        title: `Refund Rejected (${updated.refundReference})`,
        message: 'Order refund state restored cleanly.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Rejection Failed', message: normalizeApiError(err).message });
    },
  });

  const handleRejectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    rejectRefundMutation.mutate({
      refundId: rejectTarget.id,
      notes: decisionNotes.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Payments, Razorpay Webhooks &amp; Refunds</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Execute idempotent Razorpay refunds, audit payment state machines, and inspect deduplicated webhook events.
        </p>
      </div>

      <Tabs<AdminTab>
        label="Switch admin financial views"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'REFUNDS', label: 'Refund Processing' },
          { value: 'PAYMENTS', label: 'Payment Ledger' },
          { value: 'WEBHOOKS', label: 'Razorpay Webhooks' },
        ]}
      />

      {tab === 'REFUNDS' && (
        <div className="space-y-4">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Search Refund #, Order #, or Customer"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="RFD-... or ORD-..."
              leftAddon={<Search className="h-4 w-4" />}
            />
            <Select
              label="Refund Status"
              value={refundFilter}
              onChange={(e) => setRefundFilter(e.target.value)}
              options={[
                { value: 'REQUESTED', label: 'Pending Review (REQUESTED)' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'PROCESSED', label: 'Processed' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'FAILED', label: 'Failed' },
                { value: '', label: 'All Refund Records' },
              ]}
            />
          </Card>

          {refundsQuery.isLoading ? (
            <PageLoader message="Loading refund queue..." />
          ) : (refundsQuery.data?.items.length ?? 0) === 0 ? (
            <AlertBanner
              variant="info"
              title="No matching refund records"
              description="Adjust status filters or wait for customer/rejection refund requests."
            />
          ) : (
            <div className="space-y-3">
              {refundsQuery.data!.items.map((refund) => (
                <Card key={refund.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink-primary">
                          {refund.refundReference}
                        </span>
                        <Badge
                          variant={
                            refund.status === 'PROCESSED'
                              ? 'success'
                              : refund.status === 'REQUESTED'
                                ? 'warning'
                                : refund.status === 'REJECTED' || refund.status === 'FAILED'
                                  ? 'danger'
                                  : 'neutral'
                          }
                        >
                          {refund.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">
                        Order <strong className="font-mono">{refund.orderNumber}</strong> • Customer{' '}
                        <strong>{refund.customerName}</strong> ({refund.customerEmail})
                      </p>
                      <p className="text-xs text-ink-secondary">
                        Reason: {refund.reason} • Payment Ref:{' '}
                        <span className="font-mono">{refund.paymentReference}</span>
                      </p>
                      {refund.gatewayRefundId && (
                        <p className="text-xs font-mono text-brand-700">
                          Gateway Refund ID: {refund.gatewayRefundId}
                        </p>
                      )}
                      {refund.failureReason && (
                        <p className="text-xs text-[#b42318]">Failure: {refund.failureReason}</p>
                      )}
                    </div>

                    <div className="text-right tabular-nums">
                      <p className="text-lg font-bold text-ink-primary">₹{refund.amount.toFixed(2)}</p>
                      <p className="text-[11px] text-ink-muted">
                        {new Date(refund.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {(refund.status === 'REQUESTED' || refund.status === 'FAILED') && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-3">
                      <Button
                        type="button"
                        size="sm"
                        loading={processRefundMutation.isPending}
                        onClick={() =>
                          processRefundMutation.mutate({
                            refundId: refund.id,
                            notes: 'Approved & dispatched via Razorpay Refund API',
                          })
                        }
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Process Razorpay Refund
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => setRejectTarget(refund)}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Reject Request
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'PAYMENTS' && (
        <div className="space-y-4">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Search Payment Ref, Checkout, or Razorpay ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="PAY-... or rzp_..."
              leftAddon={<Search className="h-4 w-4" />}
            />
            <Select
              label="Payment Status"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'CREATED', label: 'Created' },
                { value: 'AUTHORIZED', label: 'Authorized' },
                { value: 'CAPTURED', label: 'Captured' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REFUNDED', label: 'Refunded' },
              ]}
            />
          </Card>

          {paymentsQuery.isLoading ? (
            <PageLoader message="Loading payment ledger..." />
          ) : (
            <div className="space-y-3">
              {(paymentsQuery.data?.items ?? []).map((payment) => (
                <Card key={payment.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink-primary">
                        {payment.paymentReference}
                      </span>
                      <Badge
                        variant={
                          payment.status === 'CAPTURED'
                            ? 'success'
                            : payment.status === 'FAILED'
                              ? 'danger'
                              : payment.status === 'CREATED' || payment.status === 'AUTHORIZED'
                                ? 'warning'
                                : 'brand'
                        }
                      >
                        {payment.status}
                      </Badge>
                      {payment.verificationMethod && (
                        <Badge variant="neutral">{payment.verificationMethod}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-secondary">
                      {payment.customerEmail} • Checkout{' '}
                      <span className="font-mono">{payment.checkoutReference}</span> • Order{' '}
                      <span className="font-mono">{payment.gatewayOrderId}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm tabular-nums text-ink-primary">
                      ₹{payment.amount.toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setInspectPayment(payment)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Events
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'WEBHOOKS' && (
        <div className="space-y-3">
          {webhooksQuery.isLoading ? (
            <PageLoader message="Loading Razorpay webhook delivery audit..." />
          ) : (webhooksQuery.data?.items.length ?? 0) === 0 ? (
            <AlertBanner
              variant="info"
              title="No webhooks logged yet"
              description="Verified Razorpay webhook events delivered to /api/v1/webhooks/razorpay appear here."
            />
          ) : (
            webhooksQuery.data!.items.map((hook) => (
              <Card key={hook.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Webhook className="h-4 w-4 text-brand-700" aria-hidden="true" />
                    <span className="font-mono text-xs font-bold text-ink-primary">{hook.eventType}</span>
                    <Badge
                      variant={
                        hook.processingStatus === 'PROCESSED'
                          ? 'success'
                          : hook.processingStatus === 'IGNORED_DUPLICATE' ||
                              hook.processingStatus === 'IGNORED_OUT_OF_ORDER'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {hook.processingStatus}
                    </Badge>
                    {hook.signatureVerified && (
                      <Badge variant="brand">
                        <ShieldCheck className="mr-1 inline h-3 w-3" />
                        HMAC Verified
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    {new Date(hook.receivedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">
                  Event ID: <span className="font-mono">{hook.eventId}</span>
                  {hook.razorpayOrderId ? ` • Order: ${hook.razorpayOrderId}` : ''}
                  {hook.razorpayPaymentId ? ` • Payment: ${hook.razorpayPaymentId}` : ''}
                  {hook.razorpayRefundId ? ` • Refund: ${hook.razorpayRefundId}` : ''}
                </p>
                {hook.processingNotes && <p className="text-xs text-ink-muted">{hook.processingNotes}</p>}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Payment Events Modal */}
      <Modal
        open={Boolean(inspectPayment)}
        onClose={() => setInspectPayment(null)}
        title={inspectPayment ? `Payment Ledger ${inspectPayment.paymentReference}` : 'Payment Ledger'}
      >
        {inspectPayment && (
          <div className="space-y-3 text-xs">
            <p className="text-ink-secondary">
              Gateway Payment ID:{' '}
              <span className="font-mono font-semibold">{inspectPayment.gatewayPaymentId || 'None'}</span>
            </p>
            <ol className="space-y-2 border-s-2 border-brand-200 ps-3">
              {inspectPayment.events.map((ev) => (
                <li key={ev.id}>
                  <p className="font-bold text-ink-primary">
                    {ev.eventType} ({ev.newStatus})
                  </p>
                  {ev.notes && <p className="text-ink-secondary">{ev.notes}</p>}
                  <p className="text-[11px] text-ink-muted">
                    {ev.eventSource} • {new Date(ev.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>

      {/* Reject Refund Modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={rejectTarget ? `Reject Refund ${rejectTarget.refundReference}` : 'Reject Refund'}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <Textarea
            label="Mandatory Rejection Notes"
            required
            rows={3}
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder="Explain why this refund request is declined..."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={rejectRefundMutation.isPending}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
