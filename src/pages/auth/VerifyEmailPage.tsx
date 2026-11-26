import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input, Spinner } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { normalizeApiError } from '@/lib/errorHandler';

const resendSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

type ResendValues = z.infer<typeof resendSchema>;

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get('token')?.trim() || '';
  const stateData = location.state as { email?: string; newlyRegistered?: boolean } | null;

  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(
    token ? 'verifying' : 'idle'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: stateData?.email ?? '' },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!token) return;
    let active = true;

    async function verify() {
      setStatus('verifying');
      try {
        await authApi.verifyEmail(token);
        if (active) {
          setStatus('verified');
          setStatusMessage('Your email address has been verified. You may now sign in.');
        }
      } catch (err) {
        if (active) {
          setStatus('error');
          setStatusMessage(normalizeApiError(err).message);
        }
      }
    }

    void verify();
    return () => {
      active = false;
    };
  }, [token]);

  const onResend = async (values: ResendValues) => {
    setResendSuccess(false);
    try {
      await authApi.resendVerification(values.email);
      setResendSuccess(true);
    } catch (err) {
      setStatusMessage(normalizeApiError(err).message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Email Verification</h1>

        {status === 'verifying' && (
          <div className="mt-6 flex items-center gap-3 text-sm text-ink-secondary">
            <Spinner size="md" label="Verifying email token" />
            <span>Verifying your email address...</span>
          </div>
        )}

        {status === 'verified' && (
          <div className="mt-5 space-y-4">
            <AlertBanner
              variant="success"
              title="Email verified"
              description={statusMessage || 'Your email address is verified.'}
            />
            <Link to={ROUTES.LOGIN} className="block">
              <Button fullWidth>Continue to Sign In</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <AlertBanner
            className="mt-5"
            variant="error"
            title="Verification failed"
            description={statusMessage || 'The verification link is invalid or expired.'}
          />
        )}

        {status === 'idle' && (
          <AlertBanner
            className="mt-5"
            variant="info"
            title={stateData?.newlyRegistered ? 'Verify your email address' : 'Verification required'}
            description={
              stateData?.email
                ? `We sent a verification link to ${stateData.email}. Open that link to activate sign-in.`
                : 'Open the verification link sent to your email, or request a fresh link below.'
            }
          />
        )}

        {status !== 'verified' && (
          <form onSubmit={handleSubmit(onResend)} noValidate className="mt-6 space-y-4 border-t border-border-subtle pt-5">
            <h2 className="text-sm font-semibold text-ink-primary">Need a new verification link?</h2>
            {resendSuccess && (
              <AlertBanner
                variant="success"
                title="Verification email queued"
                description="If an unverified account exists for that email, a new verification link has been sent."
              />
            )}
            <Input
              label="Account email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" variant="outline" fullWidth loading={isSubmitting}>
              Resend Verification Email
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
