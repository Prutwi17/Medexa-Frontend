import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '@/components/ui/NotificationContext';
import { cn } from '@/lib/cn';
import type { AppNotification, NotificationVariant } from '@/types/common';

const variantConfig: Record<
  NotificationVariant,
  { border: string; iconBg: string; icon: typeof Info }
> = {
  success: {
    border: 'border-s-4 border-s-brand-700 border-border-subtle',
    iconBg: 'text-brand-700',
    icon: CheckCircle2,
  },
  error: {
    border: 'border-s-4 border-s-[#b42318] border-border-subtle',
    iconBg: 'text-[#b42318]',
    icon: AlertCircle,
  },
  warning: {
    border: 'border-s-4 border-s-[#b54708] border-border-subtle',
    iconBg: 'text-[#b54708]',
    icon: AlertTriangle,
  },
  info: {
    border: 'border-s-4 border-s-[#175cd3] border-border-subtle',
    iconBg: 'text-[#175cd3]',
    icon: Info,
  },
};

function ToastItem({
  item,
  onDismiss,
}: {
  item: AppNotification;
  onDismiss: (id: string) => void;
}) {
  const pausedRef = useRef(false);
  const config = variantConfig[item.variant];
  const Icon = config.icon;

  useEffect(() => {
    if (item.persistent) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) {
        onDismiss(item.id);
      }
    }, item.durationMs ?? 5500);
    return () => window.clearInterval(timer);
  }, [item.id, item.persistent, item.durationMs, onDismiss]);

  return (
    <div
      onFocus={() => {
        pausedRef.current = true;
      }}
      onBlur={() => {
        pausedRef.current = false;
      }}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      className={cn(
        'pointer-events-auto w-full rounded-[var(--medexa-radius-md)] border bg-surface-canvas p-3.5 shadow-[var(--medexa-shadow-md)]',
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconBg)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-primary">{item.title}</p>
          {item.message && <p className="mt-0.5 text-xs text-ink-secondary">{item.message}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label={`Dismiss notification: ${item.title}`}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-muted hover:bg-surface-soft hover:text-ink-primary cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications, dismiss } = useNotifications();
  const regionRef = useRef<HTMLDivElement>(null);
  const latest = notifications[0];

  useEffect(() => {
    const el = regionRef.current;
    if (!el || typeof el.showPopover !== 'function') return;

    const modalOpen = Boolean(document.querySelector('dialog:modal'));
    try {
      if (notifications.length > 0 && !modalOpen && !el.matches(':popover-open')) {
        el.showPopover();
      } else if ((notifications.length === 0 || modalOpen) && el.matches(':popover-open')) {
        el.hidePopover();
      }
    } catch {
      // Fallback to fixed positioning when top-layer popover API is unavailable
    }
  }, [notifications.length]);

  return (
    <>
      <div aria-live="polite" className="visually-hidden">
        {latest ? `${latest.title}${latest.message ? `. ${latest.message}` : ''}` : ''}
      </div>

      <div
        ref={regionRef}
        popover="manual"
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-auto bottom-4 right-4 z-50 m-0 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2.5 border-0 bg-transparent p-0"
      >
        {notifications.map((item) => (
          <ToastItem key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
