import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-subtle text-ink-secondary border-border-subtle',
  brand: 'bg-brand-100 text-brand-900 border-[#c6e7d8]',
  success: 'bg-[var(--medexa-status-success-bg)] text-[var(--medexa-status-success-fg)] border-[#c6e7d8]',
  warning: 'bg-[var(--medexa-status-warning-bg)] text-[var(--medexa-status-warning-fg)] border-[#f5d5a7]',
  danger: 'bg-[var(--medexa-status-danger-bg)] text-[var(--medexa-status-danger-fg)] border-[#f5c2be]',
  info: 'bg-[var(--medexa-status-info-bg)] text-[var(--medexa-status-info-fg)] border-[#c4dbf7]',
};

export function Badge({ variant = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--medexa-radius-sm)] border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        badgeStyles[variant],
        className
      )}
    >
      {icon && <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
