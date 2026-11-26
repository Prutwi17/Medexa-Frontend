import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { normalizeApiError } from '@/lib/errorHandler';

const forgotSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values: ForgotValues) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      setServerError(normalizeApiError(err).message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Reset Your Password</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Enter the email address associated with your Medexa account to receive a reset link.
        </p>

        {serverError && (
          <AlertBanner className="mt-4" variant="error" title="Request failed" description={serverError} />
        )}

        {submittedEmail ? (
          <AlertBanner
            className="mt-5"
            variant="success"
            title="Check your inbox"
            description={`If an account exists for ${submittedEmail}, a password reset link has been sent (valid for 30 minutes).`}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="done"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" fullWidth loading={isSubmitting}>
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-border-subtle pt-4 text-center text-xs text-ink-secondary">
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-700 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
