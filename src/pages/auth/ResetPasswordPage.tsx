import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input } from '@/components/ui';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { normalizeApiError } from '@/lib/errorHandler';

const resetSchema = z.object({
  token: z.string().trim().min(10, 'Enter the reset token from your email.'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/,
      'Include uppercase, lowercase, a number, and a special character.'
    ),
});

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') ?? '';
  const [resetDone, setResetDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: initialToken },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ResetValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword(values);
      setResetDone(true);
    } catch (err) {
      setServerError(normalizeApiError(err).message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Choose a New Password</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Resetting your password will sign out all active sessions for security.
        </p>

        {serverError && (
          <AlertBanner className="mt-4" variant="error" title="Reset failed" description={serverError} />
        )}

        {resetDone ? (
          <div className="mt-5 space-y-4">
            <AlertBanner
              variant="success"
              title="Password updated"
              description="Your password has been reset. You can now sign in with your new credentials."
            />
            <Link to={ROUTES.LOGIN} className="block">
              <Button fullWidth>Go to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            {!initialToken && (
              <Input
                label="Reset token"
                required
                error={errors.token?.message}
                {...register('token')}
              />
            )}

            <PasswordInput
              label="New password"
              autoComplete="new-password"
              enterKeyHint="done"
              hint="At least 8 characters with uppercase, lowercase, number, and symbol."
              required
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Button type="submit" fullWidth loading={isSubmitting}>
              Update Password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
