import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white border border-brand-700 hover:bg-brand-800 hover:border-brand-800 shadow-[var(--medexa-shadow-xs)]',
  secondary:
    'bg-brand-100 text-brand-900 border border-brand-100 hover:bg-[#d8ede4] hover:border-[#c8e4d8]',
  outline:
    'bg-surface-canvas text-ink-primary border border-border-subtle hover:bg-surface-soft hover:border-border-strong',
  ghost: 'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-soft hover:text-ink-primary',
  danger: 'bg-[#b42318] text-white border border-[#b42318] hover:bg-[#912018]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs gap-1.5 rounded-[var(--medexa-radius-sm)]',
  md: 'min-h-11 px-4 text-sm gap-2 rounded-[var(--medexa-radius-md)]',
  lg: 'min-h-12 px-5 text-base gap-2.5 rounded-[var(--medexa-radius-md)]',
};

export function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors cursor-pointer select-none',
        'disabled:opacity-55 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
    </button>
  );
}
