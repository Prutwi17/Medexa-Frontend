import { useQuery } from '@tanstack/react-query';
import { Banknote, CalendarDays, CheckCircle2, Wallet } from 'lucide-react';
import { AlertBanner, Badge, Card, PageLoader } from '@/components/ui';
import { deliveryApi } from '@/features/delivery/deliveryApi';

export function RiderEarningsPage() {
  const earningsQuery = useQuery({
    queryKey: ['rider', 'earnings', 'full'],
    queryFn: () => deliveryApi.getRiderEarnings({ size: 50 }),
  });

  if (earningsQuery.isLoading) {
    return <PageLoader message="Calculating your daily and monthly rider earnings..." />;
  }

  const data = earningsQuery.data;
  if (!data) {
    return <AlertBanner variant="error" title="Unable to load earnings summary" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Rider Earnings &amp; Payout Ledger</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Track base delivery fees, distance bonuses, and daily/monthly totals from OTP-verified deliveries.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Banknote className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Today&apos;s Earnings</span>
          </div>
          <p className="text-3xl font-bold text-brand-700 tabular-nums">₹{data.dailyEarnings.toFixed(2)}</p>
          <p className="text-xs text-ink-secondary">{data.todayDeliveries} completed today</p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <CalendarDays className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Monthly Earnings</span>
          </div>
          <p className="text-3xl font-bold text-ink-primary tabular-nums">₹{data.monthlyEarnings.toFixed(2)}</p>
          <p className="text-xs text-ink-secondary">{data.monthDeliveries} completed this month</p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Wallet className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <span>Lifetime Accrued</span>
          </div>
          <p className="text-3xl font-bold text-ink-primary tabular-nums">₹{data.totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-ink-secondary">{data.totalDeliveries} total deliveries</p>
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-brand-700" aria-hidden="true" />
          <span>Completed Delivery Payout History ({data.recentEarnings.length})</span>
        </h2>

        {data.recentEarnings.length === 0 ? (
          <AlertBanner
            variant="info"
            title="No completed delivery earnings yet"
            description="Complete an OTP-verified doorstep delivery to earn your first payout entry."
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.recentEarnings.map((entry) => (
              <div key={entry.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink-primary">{entry.earningReference}</span>
                    <Badge variant={entry.status === 'PAID' ? 'success' : 'brand'}>{entry.status}</Badge>
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Order <span className="font-mono">{entry.orderNumber}</span> • Delivery{' '}
                    <span className="font-mono">{entry.deliveryReference}</span>
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Base Fee ₹{entry.baseFee.toFixed(2)} + Distance Bonus ₹{entry.distanceBonus.toFixed(2)} •{' '}
                    {new Date(entry.earnedAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right tabular-nums">
                  <span className="text-lg font-bold text-brand-700">
                    ₹{entry.totalEarning.toFixed(2)} {entry.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
