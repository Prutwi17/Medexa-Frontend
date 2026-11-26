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

const pharmacyRegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Owner/contact name is required.').max(150),
  email: z.string().trim().email('Enter a valid email address.'),
  phoneNumber: z.string().trim().regex(/^[+0-9\s-]{7,20}$/, 'Enter a valid phone number.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/,
      'Include uppercase, lowercase, a number, and a special character.'
    ),
  pharmacyName: z.string().trim().min(2, 'Pharmacy legal name is required.').max(200),
  addressLine: z.string().trim().min(4, 'Street address is required.').max(300),
  city: z.string().trim().min(2, 'City is required.').max(100),
  state: z.string().trim().min(2, 'State is required.').max(100),
  postalCode: z.string().trim().min(3, 'Postal code is required.').max(20),
  licenseNumber: z.string().trim().min(3, 'Drug license number is required.').max(120),
  issuingAuthority: z.string().trim().min(2, 'Issuing authority is required.').max(180),
  pharmacistName: z.string().trim().min(2, 'Registered pharmacist name is required.').max(150),
  pharmacistRegistrationNumber: z.string().trim().min(2, 'Pharmacist registration number is required.').max(120),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required.'),
  licenseDocumentUrl: z.string().trim().optional(),
});

type PharmacyRegisterValues = z.infer<typeof pharmacyRegisterSchema>;

export function PharmacyRegisterPage() {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PharmacyRegisterValues>({
    resolver: zodResolver(pharmacyRegisterSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values: PharmacyRegisterValues) => {
    setServerError(null);
    try {
      await authApi.registerPharmacy({
        ...values,
        licenseDocumentUrl: values.licenseDocumentUrl || undefined,
      });
      notify({
        variant: 'success',
        title: 'Pharmacy application submitted',
        message: 'Your account is pending email verification and administrator license approval.',
      });
      navigate(ROUTES.PENDING_APPROVAL, {
        state: { role: 'PHARMACY', email: values.email },
      });
    } catch (err) {
      const normalized = normalizeApiError(err);
      normalized.fieldErrors.forEach((fe) => {
        if (fe.field in values) {
          setError(fe.field as keyof PharmacyRegisterValues, { message: fe.message });
        }
      });
      setServerError(normalized.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Card elevated padding="lg">
        <h1 className="text-2xl font-bold text-ink-primary">Pharmacy Partner Registration</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Submit pharmacy and drug license details. Only verified pharmacies can list and dispense
          medicines on Medexa.
        </p>

        {serverError && (
          <AlertBanner className="mt-4" variant="error" title="Submission failed" description={serverError} />
        )}

        <div className="mt-5">
          <GoogleSignInButton role="PHARMACY" text="signup_with" onError={setServerError} />
          <p className="mt-2 text-center text-xs text-ink-muted">
            Or submit full pharmacy license credentials below for immediate review.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-ink-primary border-b border-border-subtle pb-1.5 w-full">
              Account &amp; Primary Contact
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact full name"
                autoComplete="name"
                required
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Contact phone"
                type="tel"
                autoComplete="tel"
                required
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Business email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <PasswordInput
                label="Password"
                autoComplete="new-password"
                required
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-ink-primary border-b border-border-subtle pb-1.5 w-full">
              Pharmacy Location
            </legend>
            <Input
              label="Pharmacy legal name"
              required
              error={errors.pharmacyName?.message}
              {...register('pharmacyName')}
            />
            <Input
              label="Street address"
              autoComplete="street-address"
              required
              error={errors.addressLine?.message}
              {...register('addressLine')}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="City"
                autoComplete="address-level2"
                required
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="State"
                autoComplete="address-level1"
                required
                error={errors.state?.message}
                {...register('state')}
              />
              <Input
                label="Postal code"
                autoComplete="postal-code"
                required
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-ink-primary border-b border-border-subtle pb-1.5 w-full">
              Drug License &amp; Registered Pharmacist
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Drug license number"
                required
                error={errors.licenseNumber?.message}
                {...register('licenseNumber')}
              />
              <Input
                label="Issuing authority"
                required
                error={errors.issuingAuthority?.message}
                {...register('issuingAuthority')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Registered pharmacist name"
                required
                error={errors.pharmacistName?.message}
                {...register('pharmacistName')}
              />
              <Input
                label="Pharmacist registration no."
                required
                error={errors.pharmacistRegistrationNumber?.message}
                {...register('pharmacistRegistrationNumber')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="License expiry date"
                type="date"
                required
                error={errors.licenseExpiryDate?.message}
                {...register('licenseExpiryDate')}
              />
              <Input
                label="License document URL (optional)"
                type="url"
                placeholder="https://..."
                error={errors.licenseDocumentUrl?.message}
                {...register('licenseDocumentUrl')}
              />
            </div>
          </fieldset>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Submit Pharmacy for Verification
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-secondary">
          Already verified?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-brand-700 hover:underline">
            Sign in to Pharmacy Console
          </Link>
        </p>
      </Card>
    </div>
  );
}
