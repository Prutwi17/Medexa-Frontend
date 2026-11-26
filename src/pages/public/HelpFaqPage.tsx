import { Badge, Card } from '@/components/ui';

const FAQ_ITEMS = [
  {
    q: 'Which medicines require uploading a valid prescription?',
    a: 'All medicines classified under Schedule H, Schedule H1, Schedule X, or marked as Prescription Required (Rx) in the catalog require uploading a legible PDF or image of a doctor’s prescription. Over-the-Counter (OTC) items can be added directly to your cart without a prescription.',
  },
  {
    q: 'Who reviews uploaded prescriptions and how long does it take?',
    a: 'Only verified partner pharmacies holding an approved, unexpired retail drug license and a registered pharmacist may review prescriptions. You can upload a prescription targeting a specific pharmacy or allow any eligible partner pharmacy in your fulfillment path to verify it.',
  },
  {
    q: 'Does Medexa substitute medicines if a brand is out of stock?',
    a: 'No. Medexa strictly prohibits automatic substitution of prescription medicines. Dispatch only proceeds for the exact approved medicine listed in your cart once its attached prescription is verified.',
  },
  {
    q: 'Why is my cart grouped by pharmacy?',
    a: 'Because Medexa is a multi-vendor pharmacy marketplace, each dispensing pharmacy manages its own batch inventory, pricing, delivery zones, and prescription compliance. Each pharmacy group displays its own items, delivery fee, minimum order requirement, and dispatch readiness.',
  },
  {
    q: 'How can I check whether Medexa delivers to my PIN/postal code?',
    a: 'Use the postal code availability checker on the Medexa Home page or save multiple delivery addresses in your Customer Portal to see live zone coverage, minimum order thresholds, and estimated delivery windows.',
  },
  {
    q: 'What file formats are accepted for prescription uploads?',
    a: 'PDF, JPEG, PNG, and WEBP files up to 10 MB are supported. All prescription files are stored securely outside public image endpoints and are accessible only to the owning patient, authorized reviewing pharmacy personnel, and compliance admins.',
  },
];

export function HelpFaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <Badge variant="brand">Help Center</Badge>
        <h1 className="mt-3 text-3xl font-bold text-ink-primary">Help &amp; Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Clear answers about prescription rules, multi-pharmacy cart grouping, batch inventory, and
          zone-verified home delivery.
        </p>
      </div>

      <section aria-labelledby="faq-section-heading" className="mt-8 space-y-3">
        <h2 id="faq-section-heading" className="text-lg font-bold text-ink-primary">
          Patient &amp; Prescription Compliance Guide
        </h2>

        {FAQ_ITEMS.map((item) => (
          <Card key={item.q} padding="none" className="overflow-hidden">
            <details className="medexa-faq-details group">
              <summary className="medexa-faq-summary flex items-center gap-3 px-5 py-4 text-sm font-semibold text-ink-primary hover:bg-surface-soft">
                <span>{item.q}</span>
              </summary>
              <div className="medexa-faq-content border-t border-border-subtle px-5 py-4 text-sm leading-relaxed text-ink-secondary">
                <p>{item.a}</p>
              </div>
            </details>
          </Card>
        ))}
      </section>
    </div>
  );
}
