import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertBanner, Badge, Button, Card, Input, PageLoader, Select, Textarea } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';
import { storefrontApi } from '@/features/storefront/storefrontApi';
import { normalizeApiError } from '@/lib/errorHandler';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.').max(150),
  phoneNumber: z.string().trim().max(30).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().max(30).optional(),
  bloodGroup: z.string().max(15).optional(),
  allergies: z.string().max(500).optional(),
  chronicConditions: z.string().max(500).optional(),
  emergencyContactName: z.string().max(150).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  preferredLanguage: z.string().max(40).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CustomerProfilePage() {
  const queryClient = useQueryClient();
  const { notify } = useNotifications();

  const profileQuery = useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: storefrontApi.getCustomerProfile,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        fullName: profileQuery.data.fullName,
        phoneNumber: profileQuery.data.phoneNumber ?? '',
        dateOfBirth: profileQuery.data.dateOfBirth ?? '',
        gender: profileQuery.data.gender ?? '',
        bloodGroup: profileQuery.data.bloodGroup ?? '',
        allergies: profileQuery.data.allergies ?? '',
        chronicConditions: profileQuery.data.chronicConditions ?? '',
        emergencyContactName: profileQuery.data.emergencyContactName ?? '',
        emergencyContactPhone: profileQuery.data.emergencyContactPhone ?? '',
        preferredLanguage: profileQuery.data.preferredLanguage ?? 'English',
      });
    }
  }, [profileQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      storefrontApi.updateCustomerProfile({
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender || undefined,
        bloodGroup: values.bloodGroup || undefined,
        allergies: values.allergies || undefined,
        chronicConditions: values.chronicConditions || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
        preferredLanguage: values.preferredLanguage || 'English',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
      notify({
        variant: 'success',
        title: 'Profile Updated',
        message: 'Your customer and clinical profile details were saved.',
      });
    },
    onError: (err) => {
      notify({ variant: 'error', title: 'Update Failed', message: normalizeApiError(err).message });
    },
  });

  if (profileQuery.isLoading) {
    return <PageLoader message="Loading customer profile..." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <AlertBanner
        variant="error"
        title="Profile unavailable"
        description={normalizeApiError(profileQuery.error).message}
      />
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Customer &amp; Health Profile</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Maintain contact information and important clinical notes shared with pharmacists during prescription verification.
          </p>
        </div>
        <Badge variant={profile.emailVerified ? 'success' : 'warning'}>
          {profile.emailVerified ? 'Email Verified' : 'Email Unverified'}
        </Badge>
      </div>

      <Card>
        <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              autoComplete="name"
              required
              error={form.formState.errors.fullName?.message}
              {...form.register('fullName')}
            />
            <Input
              label="Phone number"
              type="tel"
              autoComplete="tel"
              error={form.formState.errors.phoneNumber?.message}
              {...form.register('phoneNumber')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Date of birth"
              type="date"
              autoComplete="bday"
              {...form.register('dateOfBirth')}
            />
            <Select
              label="Gender"
              {...form.register('gender')}
              options={[
                { value: '', label: 'Prefer not to specify' },
                { value: 'Female', label: 'Female' },
                { value: 'Male', label: 'Male' },
                { value: 'Non-binary', label: 'Non-binary' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Select
              label="Blood group"
              {...form.register('bloodGroup')}
              options={[
                { value: '', label: 'Not specified' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
              ]}
            />
          </div>

          <Textarea
            label="Known Drug Allergies"
            rows={2}
            placeholder="e.g. Penicillin, Sulfa drugs"
            {...form.register('allergies')}
          />

          <Textarea
            label="Chronic Conditions"
            rows={2}
            placeholder="e.g. Type 2 Diabetes, Hypertension"
            {...form.register('chronicConditions')}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Emergency contact name"
              {...form.register('emergencyContactName')}
            />
            <Input
              label="Emergency contact phone"
              type="tel"
              {...form.register('emergencyContactPhone')}
            />
            <Select
              label="Preferred language"
              {...form.register('preferredLanguage')}
              options={[
                { value: 'English', label: 'English' },
                { value: 'Hindi', label: 'Hindi' },
                { value: 'Kannada', label: 'Kannada' },
                { value: 'Tamil', label: 'Tamil' },
              ]}
            />
          </div>

          <Button type="submit" loading={updateMutation.isPending}>
            Save Profile Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
