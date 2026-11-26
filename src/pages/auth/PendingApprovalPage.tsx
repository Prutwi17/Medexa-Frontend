import { Clock, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AlertBanner, Badge, Button, Card } from '@/components/ui';
import { ROUTES } from '@/config/routes';

export function PendingApprovalPage() {
  const location = useLocation();
  const state = location.state as { role?: string; email?: string } | null;
  const isPharmacy = state?.role === 'PHARMACY';
  const isRider = state?.role === 'RIDER';

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Card elevated padding="lg">
        <Badge variant="warning" icon={<Clock className="h-3.5 w-3.5" />}>
          Pending Administrator Review
        </Badge>

        <h1 className="mt-3 text-2xl font-bold text-ink-primary">
          {isPharmacy
            ? 'Pharmacy Verification in Progress'
            : isRider
              ? 'Rider Verification in Progress'
              : 'Account Pending Approval'}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          {state?.email ? `Account (${state.email}) ` : 'Your partner account '}
          has been created with <strong className="text-ink-primary">PENDING_APPROVAL</strong> status.
          To uphold Medexa dispensing and delivery compliance, an administrator must verify your
          credentials before portal access is enabled.
        </p>

        <div className="mt-5 space-y-3 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft p-4 text-xs text-ink-secondary">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-ink-primary">Email verification:</strong> Please also verify your
              email address using the link sent to your inbox so your account is ready once approved.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-ink-primary">Compliance check:</strong> Verified pharmacies
              require approved drug license and pharmacist details; riders require approved vehicle
              and driving license details.
            </p>
          </div>
        </div>

        <AlertBanner
          className="mt-5"
          variant="info"
          title="Need to check email verification?"
          description="You can resend your verification link at any time while awaiting approval."
          action={
            <Link to={ROUTES.VERIFY_EMAIL} state={{ email: state?.email }} className="text-xs font-semibold underline">
              Verify Email
            </Link>
          }
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={ROUTES.LOGIN} className="flex-1">
            <Button variant="primary" fullWidth>
              Return to Sign In
            </Button>
          </Link>
          <Link to={ROUTES.HOME} className="flex-1">
            <Button variant="outline" fullWidth>
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
