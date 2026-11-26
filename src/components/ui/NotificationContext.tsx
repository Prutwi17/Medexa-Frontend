import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { subscribeAppErrors } from '@/lib/errorHandler';
import type { AppNotification, NotificationVariant } from '@/types/common';

interface NotifyInput {
  title: string;
  message?: string;
  variant?: NotificationVariant;
  persistent?: boolean;
  durationMs?: number;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  notify: (input: NotifyInput) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const notify = useCallback((input: NotifyInput) => {
    const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next: AppNotification = {
      id,
      title: input.title,
      message: input.message,
      variant: input.variant ?? 'info',
      persistent: input.persistent ?? input.variant === 'error',
      durationMs: input.durationMs ?? 5500,
    };

    setNotifications((prev) => [next, ...prev].slice(0, 5));
    return id;
  }, []);

  useEffect(() => {
    return subscribeAppErrors((err) => {
      notify({
        variant: 'error',
        title: err.isNetworkError ? 'Connection Error' : 'Server Error',
        message: err.correlationId ? `${err.message} (Ref: ${err.correlationId})` : err.message,
        persistent: true,
      });
    });
  }, [notify]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
