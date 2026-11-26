import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CreditCard, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Modal, PageLoader, Select, Tabs } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { paymentsApi } from '@/features/payments/paymentsApi';
import { normalizeApiError } from '@/lib/errorHandler';
import type { PaymentRecord, PaymentStatus, RefundRecord, RefundRecordStatus } from '@/types/payments';

type ActiveTab = 'PAYMENTS' | 'REFUNDS';

function badgeForPayment(status: PaymentStatus): 'brand' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'CAPTURED') return 'success';
  if (status === 'AUTHORIZED' || status === 'CREATED') return 'warning';
  if (status === 'FAILED') return 'danger';
  return 'brand';
}

function badgeForRefund(status: RefundRecordStatus): 'brand' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'PROCESSED') return 'success';
  if (status === 'REQUESTED' || status === 'PROCESSING') return 'warning';
  if (status === 'REJECTED' || status === 'FAILED') return 'danger';
  return 'neutral';
}

export function CustomerPaymentsPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<ActiveTab>('PAYMENTS');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [refundStatusFilter, setRefundStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const paymentsQuery = useQuery({
    queryKey: ['customer', 'payments', paymentStatusFilter],
    queryFn: () =>
      paymentsApi.listCustomerPayments({
        status: (paymentStatusFilter || undefined) as PaymentStatus | undefined,
        size: 30,
      }),
  });

  const refundsQuery = useQuery({
    queryKey: ['customer', 'refunds', refundStatusFilter],
    queryFn: () =>
      paymentsApi.listCustomerRefunds({
        status: (refundStatusFilter || undefined) as RefundRecordStatus | undefined,
        size: 30,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: (payment: PaymentRecord) =>
      paymentsApi.verifyCustomerPayment(payment.paymentReference, payment.gatewayPaymentId ?? undefined),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'payments'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
      if (selectedPayment?.id === updated.id) {
        setSelectedPayment(updated);
      }
      notify({
        variant: updated.status === 'CAPTURED' ? 'success' : 'info',
        title: `Status Synced: ${updated.status}`,
        message: `Gateway verification completed for ${updated.paymentReference}.`,
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Verification Error', message: normalizeApiError(err).message });
    },
  });

  if (paymentsQuery.isLoading || refundsQuery.isLoading) {
    return <PageLoader message="Loading your verified payment history and refund tracker..." />;
  }

  const payments = paymentsQuery.data?.items ?? [];
  const refunds: RefundRecord[] = refundsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Payments &amp; Refunds</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Track server-verified Razorpay transactions, synchronize delayed payments, and monitor refund status.
        </p>
      </div>

      <Tabs<ActiveTab>
        label="Switch between payments and refunds"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'PAYMENTS', label: `Payment History (${payments.length})` },
          { value: 'REFUNDS', label: `Refund Requests (${refunds.length})` },
        ]}
      />

      {tab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <Select
              label="Filter by Payment Status"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Payment Statuses' },
                { value: 'CREATED', label: 'Created' },
                { value: 'AUTHORIZED', label: 'Authorized (Pending Capture)' },
                { value: 'CAPTURED', label: 'Captured' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REFUNDED', label: 'Refunded' },
              ]}
            />
          </div>

          {payments.length === 0 ? (
            <AlertBanner
              variant="info"
              title="No payment records yet"
              description="Transactions created during multi-pharmacy checkout will appear here."
            />
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink-primary">
                          {payment.paymentReference}
                        </span>
                        <Badge variant={badgeForPayment(payment.status)}>{payment.status}</Badge>
                        {payment.verificationMethod && (
                          <Badge variant="neutral">Verified: {payment.verificationMethod}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">
                        Checkout: <span className="font-mono">{payment.checkoutReference}</span> • Gateway Order:{' '}
                        <span className="font-mono">{payment.gatewayOrderId}</span>
                        {payment.gatewayPaymentId ? ` • Pay ID: ${payment.gatewayPaymentId}` : ''}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Created {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right tabular-nums">
                      <p className="text-lg font-bold text-ink-primary">
                        ₹{payment.amount.toFixed(2)} {payment.currency}
                      </p>
                      {payment.refundedAmount > 0 && (
                        <p className="text-xs font-semibold text-brand-700">
                          Refunded: ₹{payment.refundedAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {payment.failureReason && (
                    <p className="rounded-[var(--medexa-radius-sm)] bg-[#fef3f2] px-3 py-2 text-xs text-[#b42318]">
                      {payment.failureCode ? `${payment.failureCode}: ` : ''}
                      {payment.failureReason}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-2">
                    <Link to={`/customer/checkout/status/${payment.checkoutReference}`}>
                      <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                        Checkout Status
                      </Button>
                    </Link>
                    {(payment.status === 'CREATED' || payment.status === 'AUTHORIZED') && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate(payment)}
                        leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Sync with Razorpay
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPayment(payment)}
                      leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                    >
                      Audit Events ({payment.events.length})
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'REFUNDS' && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <Select
              label="Filter Refund Requests"
              value={refundStatusFilter}
              onChange={(e) => setRefundStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Refund Statuses' },
                { value: 'REQUESTED', label: 'Requested' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'PROCESSED', label: 'Processed' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'FAILED', label: 'Failed' },
              ]}
            />
          </div>

          {refunds.length === 0 ? (
            <AlertBanner
              variant="info"
              title="No refund requests"
              description="Eligible cancelled or rejected orders allow requesting refunds from Order Details."
            />
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => (
                <Card key={refund.id} className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink-primary">
                          {refund.refundReference}
                        </span>
                        <Badge variant={badgeForRefund(refund.status)}>{refund.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">
                        Order <span className="font-mono font-semibold">{refund.orderNumber}</span> • Payment{' '}
                        <span className="font-mono">{refund.paymentReference}</span>
                      </p>
                      <p className="text-xs text-ink-secondary">Reason: {refund.reason}</p>
                      {refund.gatewayRefundId && (
                        <p className="text-[11px] font-mono text-brand-700">
                          Razorpay Refund ID: {refund.gatewayRefundId}
                        </p>
                      )}
                      {refund.adminNotes && (
                        <p className="text-xs text-ink-muted">Operations Note: {refund.adminNotes}</p>
                      )}
                      {refund.failureReason && (
                        <p className="text-xs text-[#b42318]">Gateway Failure: {refund.failureReason}</p>
                      )}
                    </div>

                    <div className="text-right tabular-nums">
                      <p className="text-lg font-bold text-ink-primary">
                        ₹{refund.amount.toFixed(2)} {refund.currency}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Requested {new Date(refund.createdAt).toLocaleDateString()}
                      </p>
                      <Link
                        to={`/customer/orders/${refund.orderId}`}
                        className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={selectedPayment ? `Payment Audit ${selectedPayment.paymentReference}` : 'Payment Audit'}
        description="Immutable state transitions logged from Razorpay callbacks, server verification, and webhooks."
      >
        {selectedPayment && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 rounded-[var(--medexa-radius-sm)] bg-surface-soft p-3">
              <ShieldCheck className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
              <span>
                Gateway Order <strong className="font-mono">{selectedPayment.gatewayOrderId}</strong> • Status{' '}
                <strong>{selectedPayment.status}</strong>
              </span>
            </div>
            <ol className="space-y-2.5 border-s-2 border-brand-200 ps-3">
              {selectedPayment.events.map((ev) => (
                <li key={ev.id}>
                  <p className="font-bold text-ink-primary">
                    {ev.eventType} ({ev.previousStatus ? `${ev.previousStatus} → ` : ''}
                    {ev.newStatus})
                  </p>
                  <p className="text-ink-muted">
                    Source: {ev.eventSource} {ev.gatewayReference ? `• Ref: ${ev.gatewayReference}` : ''}
                  </p>
                  {ev.notes && <p className="text-ink-secondary">{ev.notes}</p>}
                  <p className="text-[11px] text-ink-muted">{new Date(ev.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </div>
  );
}
