import { useState, type FormEvent } from 'react';
import { Clock, Mail, MapPin, PhoneCall, Send } from 'lucide-react';
import { AlertBanner, Badge, Button, Card, Input, Select, Textarea } from '@/components/ui';
import { useNotifications } from '@/components/ui/NotificationContext';

export function ContactPage() {
  const { notify } = useNotifications();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('PRESCRIPTION_SUPPORT');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    notify({
      variant: 'success',
      title: 'Support Inquiry Recorded',
      message: 'Reach us directly at support@medexa.in with your prescription or order reference.',
    });
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <Badge variant="brand">Customer &amp; Partner Support</Badge>
        <h1 className="mt-3 text-3xl font-bold text-ink-primary">Contact Medexa</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Questions about prescription verification, delivery zones, or pharmacy onboarding? Reach our
          operations desk directly.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <Card>
            <h2 className="text-base font-bold text-ink-primary">Official Support Channels</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-ink-primary">Patient &amp; Order Support</dt>
                  <dd className="text-ink-secondary">support@medexa.in</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="mt-0.5 h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-ink-primary">Pharmacy Compliance Desk</dt>
                  <dd className="text-ink-secondary">compliance@medexa.in</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-ink-primary">Verification Desk Hours</dt>
                  <dd className="text-ink-secondary">Monday – Sunday, 08:00 AM – 10:00 PM IST</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="font-semibold text-ink-primary">Registered Operations</dt>
                  <dd className="text-ink-secondary">Bengaluru, Karnataka, India</dd>
                </div>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <h2 className="text-base font-bold text-ink-primary">Send a Support Message</h2>
          {submitted && (
            <AlertBanner
              className="mt-4"
              variant="success"
              title="Inquiry prepared"
              description="For urgent clinical or prescription queries, email support@medexa.in quoting your RX reference code."
            />
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Full name"
              name="fullName"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select
              label="Inquiry topic"
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              options={[
                { value: 'PRESCRIPTION_SUPPORT', label: 'Prescription Upload / Verification' },
                { value: 'DELIVERY_ZONE', label: 'Delivery Zone Availability' },
                { value: 'PHARMACY_ONBOARDING', label: 'Pharmacy Partner Verification' },
                { value: 'ACCOUNT_HELP', label: 'Customer Account Help' },
              ]}
            />
            <Textarea
              label="Message details"
              name="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include medicine name, postal code, or RX reference if applicable."
            />
            <Button type="submit" leftIcon={<Send className="h-4 w-4" />}>
              Submit Inquiry
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
