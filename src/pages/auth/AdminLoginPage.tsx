import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Badge, Button, Card, Input } from '@/components/ui';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { useAuth } from '@/features/auth/AuthContext';
import { normalizeApiError } from '@/lib/errorHandler';
import { getDashboardRouteForRole } from '@/types/auth';

const adminLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid administrator email address.'),
  password: z.string().min(1, 'Enter your administrator password.'),
});

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    mode: 'onBlur',
  });

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const onSubmit = async (values: AdminLoginValues) => {
    setServerError(null);
    try {
      const session = await authApi.adminLogin({
        email: values.email,
        password: values.password,
      });
      setSession(session);
      navigate(redirectTo || getDashboardRouteForRole(session.user.role), { replace: true });
    } catch (err) {
      setServerError(normalizeApiError(err).message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <Badge variant="brand" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          Restricted Operations Portal
        </Badge>
        <h1 className="mt-3 text-2xl font-bold text-ink-primary">Administrator Sign In</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Authorized Medexa administrators only. Public registration is disabled for admin roles.
        </p>

        {serverError && (
          <AlertBanner className="mt-4" variant="error" title="Access denied" description={serverError} />
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <Input
            label="Administrator email"
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

          <Button type="submit" fullWidth loading={isSubmitting}>
            Sign In to Admin Console
          </Button>
        </form>

        <div className="mt-6 border-t border-border-subtle pt-4 text-center text-xs text-ink-secondary">
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-700 hover:underline">
            Return to Customer / Partner sign-in
          </Link>
        </div>
      </Card>
    </div>
  );
}
