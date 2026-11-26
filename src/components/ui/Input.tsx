import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftAddon, rightAddon, id, className, required, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-primary">
        {label}
        {required && (
          <span className="text-[#b42318] ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && (
        <span id={hintId} className="text-xs text-ink-muted">
          {hint}
        </span>
      )}

      <div className="relative flex items-center">
        {leftAddon && (
          <span className="pointer-events-none absolute inset-inline-start-3 text-ink-muted inline-flex">
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full min-h-11 rounded-[var(--medexa-radius-md)] border bg-surface-canvas px-3.5 py-2.5',
            'text-[max(1rem,1em)] text-ink-primary placeholder:text-ink-muted',
            'transition-colors',
            error
              ? 'border-[#b42318] focus-visible:outline-[#b42318]'
              : 'border-border-strong hover:border-ink-secondary focus-visible:border-brand-700',
            'disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
            Boolean(leftAddon) && 'ps-10',
            Boolean(rightAddon) && 'pe-10',
            className
          )}
          {...props}
        />
        {rightAddon && (
          <span className="absolute inset-inline-end-3 text-ink-muted inline-flex">{rightAddon}</span>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
});
