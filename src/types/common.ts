import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

export type NotificationVariant = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  variant: NotificationVariant;
  persistent?: boolean;
  durationMs?: number;
}
