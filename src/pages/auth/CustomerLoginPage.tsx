import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input } from '@/components/ui';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { useAuth } from '@/features/auth/AuthContext';
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton';
import { normalizeApiError } from '@/lib/errorHandler';
import { getDashboardRouteForRole } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    setNeedsVerificationEmail(null);
    try {
      const session = await authApi.login({
        email: values.email,
        password: values.password,
      });
      setSession(session);
      navigate(redirectTo || getDashboardRouteForRole(session.user.role), { replace: true });
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (normalized.code === 'ACCOUNT_PENDING_APPROVAL') {
        navigate(ROUTES.PENDING_APPROVAL, { state: { email: values.email } });
        return;
      }
      if (normalized.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerificationEmail(values.email);
      }
      setServerError(normalized.message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Sign in to Medexa</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Sign in to your Customer, Pharmacy Partner, or Delivery Rider account.
        </p>

        {serverError && (
          <AlertBanner
            className="mt-4"
            variant="error"
            title="Sign-in could not be completed"
            description={serverError}
            action={
              needsVerificationEmail ? (
                <Link
                  to={ROUTES.VERIFY_EMAIL}
                  state={{ email: needsVerificationEmail }}
                  className="text-xs font-semibold underline"
                >
                  Verify Email
                </Link>
              ) : undefined
            }
          />
        )}

        <div className="mt-5">
          <GoogleSignInButton role="CUSTOMER" text="signin_with" onError={setServerError} />
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="username"
            spellCheck={false}
            enterKeyHint="next"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            enterKeyHint="done"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 space-y-2 border-t border-border-subtle pt-4 text-center text-xs text-ink-secondary">
          <p>
            New to Medexa?{' '}
            <Link to={ROUTES.REGISTER} className="font-semibold text-brand-700 hover:underline">
              Create customer account
            </Link>
          </p>
          <p className="flex flex-wrap justify-center gap-3">
            <Link to={ROUTES.REGISTER_PHARMACY} className="font-semibold text-brand-700 hover:underline">
              Pharmacy onboarding
            </Link>
            <span aria-hidden="true">•</span>
            <Link to={ROUTES.REGISTER_RIDER} className="font-semibold text-brand-700 hover:underline">
              Rider onboarding
            </Link>
            <span aria-hidden="true">•</span>
            <Link to={ROUTES.ADMIN_LOGIN} className="font-semibold text-ink-secondary hover:underline">
              Admin sign-in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
