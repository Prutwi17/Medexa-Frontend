import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AlertBanner, Button, Card, Input, Select } from '@/components/ui';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useNotifications } from '@/components/ui/NotificationContext';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton';
import { normalizeApiError } from '@/lib/errorHandler';

const riderRegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.').max(150),
  email: z.string().trim().email('Enter a valid email address.'),
  phoneNumber: z.string().trim().regex(/^[+0-9\s-]{7,20}$/, 'Enter a valid phone number.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/,
      'Include uppercase, lowercase, a number, and a special character.'
    ),
  vehicleType: z.enum(['BICYCLE', 'SCOOTER', 'MOTORCYCLE', 'CAR']),
  vehicleRegistrationNumber: z.string().trim().min(3, 'Vehicle registration number is required.').max(60),
  drivingLicenseNumber: z.string().trim().min(3, 'Driving license number is required.').max(100),
  serviceCity: z.string().trim().min(2, 'Service city is required.').max(100),
});

type RiderRegisterValues = z.infer<typeof riderRegisterSchema>;

export function RiderRegisterPage() {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RiderRegisterValues>({
    resolver: zodResolver(riderRegisterSchema),
    defaultValues: { vehicleType: 'MOTORCYCLE' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: RiderRegisterValues) => {
    setServerError(null);
    try {
      await authApi.registerRider(values);
      notify({
        variant: 'success',
        title: 'Rider registration submitted',
        message: 'Your rider application is pending administrator verification.',
      });
      navigate(ROUTES.PENDING_APPROVAL, {
        state: { role: 'RIDER', email: values.email },
      });
    } catch (err) {
      const normalized = normalizeApiError(err);
      normalized.fieldErrors.forEach((fe) => {
        if (fe.field in values) {
          setError(fe.field as keyof RiderRegisterValues, { message: fe.message });
        }
      });
      setServerError(normalized.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Delivery Rider Registration</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Submit your vehicle and driving credentials. Riders must be approved by an administrator
          before accepting pharmacy deliveries.
        </p>

        {serverError && (
          <AlertBanner className="mt-4" variant="error" title="Registration failed" description={serverError} />
        )}

        <div className="mt-5">
          <GoogleSignInButton role="RIDER" text="signup_with" onError={setServerError} />
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Full name"
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              spellCheck={false}
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone number"
              type="tel"
              autoComplete="tel"
              required
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
          </div>

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Vehicle type"
              required
              options={[
                { value: 'MOTORCYCLE', label: 'Motorcycle' },
                { value: 'SCOOTER', label: 'Scooter' },
                { value: 'BICYCLE', label: 'Bicycle' },
                { value: 'CAR', label: 'Car' },
              ]}
              error={errors.vehicleType?.message}
              {...register('vehicleType')}
            />
            <Input
              label="Service city"
              required
              error={errors.serviceCity?.message}
              {...register('serviceCity')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Vehicle registration number"
              required
              error={errors.vehicleRegistrationNumber?.message}
              {...register('vehicleRegistrationNumber')}
            />
            <Input
              label="Driving license number"
              required
              error={errors.drivingLicenseNumber?.message}
              {...register('drivingLicenseNumber')}
            />
          </div>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Submit Rider Application
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-secondary">
          Already an approved rider?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
