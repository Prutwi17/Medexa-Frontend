import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input } from '@/components/ui';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton';
import { normalizeApiError } from '@/lib/errorHandler';

const customerRegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name (at least 2 characters).').max(150),
  email: z.string().trim().email('Enter an email address in the format name@example.com.'),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[+0-9\s-]{7,20}$/.test(val),
      'Enter a valid phone number (7 to 20 digits).'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/,
      'Include uppercase, lowercase, a number, and a special character.'
    ),
});

type CustomerRegisterValues = z.infer<typeof customerRegisterSchema>;

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerRegisterValues>({
    resolver: zodResolver(customerRegisterSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values: CustomerRegisterValues) => {
    setServerError(null);
    try {
      await authApi.registerCustomer({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber || undefined,
        password: values.password,
      });
      notify({
        variant: 'success',
        title: 'Account created',
        message: 'Check your email for a verification link before signing in.',
      });
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: values.email, newlyRegistered: true } });
    } catch (err) {
      const normalized = normalizeApiError(err);
      normalized.fieldErrors.forEach((fe) => {
        if (fe.field in values) {
          setError(fe.field as keyof CustomerRegisterValues, { message: fe.message });
        }
      });
      setServerError(normalized.message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Create Customer Account</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Order verified medicines, upload prescriptions, and track doorstep delivery.
        </p>

        {serverError && (
          <AlertBanner className="mt-4" variant="error" title="Registration failed" description={serverError} />
        )}

        <div className="mt-5">
          <GoogleSignInButton role="CUSTOMER" text="signup_with" onError={setServerError} />
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Email address"
            type="email"
            autoComplete="username"
            spellCheck={false}
            enterKeyHint="next"
            hint="Format: you@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone number (optional)"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            placeholder="+91 9876543210"
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            enterKeyHint="done"
            hint="At least 8 characters with uppercase, lowercase, number, and symbol."
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth loading={isSubmitting}>
            Create Customer Account
          </Button>
        </form>

        <div className="mt-6 space-y-2 border-t border-border-subtle pt-4 text-center text-xs text-ink-secondary">
          <p>
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="flex flex-wrap justify-center gap-3 pt-1">
            <Link to={ROUTES.REGISTER_PHARMACY} className="font-semibold text-brand-700 hover:underline">
              Register as Pharmacy Partner
            </Link>
            <span aria-hidden="true">•</span>
            <Link to={ROUTES.REGISTER_RIDER} className="font-semibold text-brand-700 hover:underline">
              Register as Delivery Rider
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
