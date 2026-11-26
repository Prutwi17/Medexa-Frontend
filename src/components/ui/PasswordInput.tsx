import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, hint, error, id, className, required, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
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
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full min-h-11 rounded-[var(--medexa-radius-md)] border bg-surface-canvas ps-3.5 pe-11 py-2.5',
            'text-[max(1rem,1em)] text-ink-primary placeholder:text-ink-muted transition-colors',
            error
              ? 'border-[#b42318] focus-visible:outline-[#b42318]'
              : 'border-border-strong hover:border-ink-secondary focus-visible:border-brand-700',
            'disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-inline-end-1.5 inline-flex h-8 w-8 items-center justify-center rounded-[var(--medexa-radius-sm)] text-ink-secondary hover:bg-surface-soft hover:text-ink-primary cursor-pointer"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
});
