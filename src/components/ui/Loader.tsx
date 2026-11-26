import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-9 w-9',
  };

  return (
    <span role="progressbar" aria-label={label} className={cn('inline-flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-brand-700', sizes[size])} aria-hidden="true" />
    </span>
  );
}

export function PageLoader({ message = 'Loading clinical workspace...' }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Spinner size="lg" label={message} />
      <p className="text-sm font-medium text-ink-secondary">{message}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded bg-surface-subtle', className)} />;
}
