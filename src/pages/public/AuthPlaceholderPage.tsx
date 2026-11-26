import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input, Select } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['CUSTOMER', 'PHARMACY', 'RIDER']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function LoginPage() {
  const { notify } = useNotifications();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = (values: LoginFormValues) => {
    notify({
      variant: 'info',
      title: 'Authentication Endpoint Pending',
      message: `Form validation succeeded for ${values.email}. JWT & Google OAuth login connects in the Authentication phase.`,
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Sign in to Medexa</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Access your Customer, Pharmacy, Rider, or Admin workspace.
        </p>

        <AlertBanner
          className="mt-4"
          variant="info"
          title="Phase 1 UI Foundation"
          description="Authentication endpoints (JWT + Google OAuth2) will be wired in Phase 2."
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="username"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth loading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-secondary">
          New to Medexa?{' '}
          <Link to={ROUTES.REGISTER} className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { notify } = useNotifications();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER' },
    mode: 'onBlur',
  });

  const onSubmit = (values: RegisterFormValues) => {
    notify({
      variant: 'info',
      title: 'Registration Form Validated',
      message: `Account type ${values.role} for ${values.email} will connect to /api/v1/auth/register in Phase 2.`,
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Create Medexa Account</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Register as a Customer, Pharmacy Partner, or Delivery Rider. Admin accounts cannot be
          self-registered.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Select
            label="Account role"
            required
            options={[
              { value: 'CUSTOMER', label: 'Customer (Order Medicines)' },
              { value: 'PHARMACY', label: 'Pharmacy Partner (License Verification Required)' },
              { value: 'RIDER', label: 'Delivery Rider (Verification Required)' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="Minimum 8 characters"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth loading={isSubmitting}>
            Continue Registration
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-secondary">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
