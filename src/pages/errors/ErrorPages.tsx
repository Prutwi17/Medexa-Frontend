import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/config/routes';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Card elevated padding="lg">
        <p className="text-sm font-bold text-brand-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-primary">Page not found</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          The requested Medexa route does not exist or may have moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={ROUTES.HOME}>
            <Button variant="primary">Return Home</Button>
          </Link>
          <Link to={ROUTES.MEDICINES}>
            <Button variant="outline">Browse Medicines</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Card elevated padding="lg">
        <p className="text-sm font-bold text-[#b42318]">403</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-primary">Access restricted</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Your current role does not have permission to open this Medexa workspace.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={ROUTES.HOME}>
            <Button variant="primary">Go to Marketplace</Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
