import { CheckCircle2, ClipboardCheck, CreditCard, PackageCheck } from 'lucide-react';
import { Card, CardDescription, CardTitle } from '@/components/ui';

const STEPS = [
  {
    icon: ClipboardCheck,
    title: '1. Search & Prescription Screening',
    description:
      'Browse approved medicines from verified pharmacies. Upload a valid prescription whenever a medicine requires pharmacist verification.',
  },
  {
    icon: CreditCard,
    title: '2. Multi-Pharmacy Split Checkout',
    description:
      'Medexa groups cart items by pharmacy, computes totals server-side, reserves batch stock, and collects a single Razorpay payment.',
  },
  {
    icon: PackageCheck,
    title: '3. Independent Pharmacy Fulfillment',
    description:
      'Each pharmacy prepares and packs its portion of the order after compliance checks and hands off to an assigned delivery rider.',
  },
  {
    icon: CheckCircle2,
    title: '4. OTP-Verified Doorstep Delivery',
    description:
      'Track each pharmacy order independently and confirm delivery at your doorstep using your delivery OTP, then download your tax invoice.',
  },
];

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">How Medexa Works</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Medexa enforces clinical dispensing rules and transparent pharmacy-to-patient delivery
          from prescription verification to OTP handover.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} elevated>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--medexa-radius-md)] bg-brand-100 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="mt-3.5">{step.title}</CardTitle>
              <CardDescription className="mt-1.5 leading-relaxed">
                {step.description}
              </CardDescription>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
