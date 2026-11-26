import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, hint, error, id, className, required, ...props },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={selectId} className="text-sm font-medium text-ink-primary">
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

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full min-h-11 appearance-none rounded-[var(--medexa-radius-md)] border bg-surface-canvas px-3.5 pe-10 py-2.5',
            'text-[max(1rem,1em)] text-ink-primary',
            error
              ? 'border-[#b42318] focus-visible:outline-[#b42318]'
              : 'border-border-strong hover:border-ink-secondary focus-visible:border-brand-700',
            'disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
});
