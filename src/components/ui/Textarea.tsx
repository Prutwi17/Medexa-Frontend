import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, required, rows = 3, ...props },
  ref
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={textareaId} className="text-sm font-medium text-ink-primary">
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

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-[var(--medexa-radius-md)] border bg-surface-canvas px-3.5 py-2.5',
          'text-[max(1rem,1em)] text-ink-primary placeholder:text-ink-muted',
          error
            ? 'border-[#b42318] focus-visible:outline-[#b42318]'
            : 'border-border-strong hover:border-ink-secondary focus-visible:border-brand-700',
          'disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
});
