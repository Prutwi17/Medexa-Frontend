import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { NotificationVariant } from '@/types/common';

interface AlertBannerProps {
  variant?: NotificationVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const bannerStyles: Record<NotificationVariant, { wrapper: string; icon: typeof Info }> = {
  info: {
    wrapper: 'bg-[var(--medexa-status-info-bg)] border-[#c4dbf7] text-[#175cd3]',
    icon: Info,
  },
  success: {
    wrapper: 'bg-[var(--medexa-status-success-bg)] border-[#c6e7d8] text-brand-900',
    icon: CheckCircle2,
  },
  warning: {
    wrapper: 'bg-[var(--medexa-status-warning-bg)] border-[#f5d5a7] text-[#9a5b08]',
    icon: AlertTriangle,
  },
  error: {
    wrapper: 'bg-[var(--medexa-status-danger-bg)] border-[#f5c2be] text-[#b42318]',
    icon: AlertCircle,
  },
};

export function AlertBanner({
  variant = 'info',
  title,
  description,
  action,
  className,
}: AlertBannerProps) {
  const style = bannerStyles[variant];
  const Icon = style.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[var(--medexa-radius-md)] border px-4 py-3',
        style.wrapper,
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="mt-0.5 text-xs opacity-90">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
