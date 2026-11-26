import { Badge, Card } from '@/components/ui';

export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <Badge variant="brand">Legal &amp; Clinical Privacy</Badge>
        <h1 className="mt-3 text-3xl font-bold text-ink-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          How Medexa handles patient health details, uploaded prescriptions, addresses, and security tokens.
        </p>
      </div>

      <Card className="space-y-4 text-sm leading-relaxed text-ink-secondary">
        <section>
          <h2 className="text-base font-bold text-ink-primary">1. Protected Health &amp; Prescription Files</h2>
          <p className="mt-1">
            Uploaded prescription documents (PDFs and clinical images) and patient health notes are
            stored in access-restricted private storage. Direct public downloads are disabled; access
            requires verified customer ownership, an authorized reviewing pharmacy holding an approved
            license, or platform compliance audit authorization.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-primary">2. Customer Account &amp; Delivery Data</h2>
          <p className="mt-1">
            Profile details (contact numbers, allergies, emergency contacts) and saved delivery addresses
            are used solely to verify delivery zone serviceability, fulfill orders, and maintain clinical
            safety records.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink-primary">3. Session Security &amp; Audit Trails</h2>
          <p className="mt-1">
            Authentication relies on short-lived access tokens and HTTP-only refresh cookies with CSRF
            protection. Every prescription status transition records an immutable audit log identifying
            the timestamp, action, and authorizing pharmacy credential.
          </p>
        </section>
      </Card>
    </div>
  );
}
