import { useRef } from 'react';
import { cn } from '@/lib/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  label: string;
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string>({ label, options, value, onChange }: TabsProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-border-subtle"
    >
      {options.map((opt, index) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={(e) => {
              onChange(opt.value);
              e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const nextIndex =
                e.key === 'ArrowRight'
                  ? (index + 1) % options.length
                  : (index - 1 + options.length) % options.length;
              const nextOpt = options[nextIndex];
              onChange(nextOpt.value);
              buttonRefs.current[nextIndex]?.focus();
            }}
            className={cn(
              'relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors',
              selected
                ? 'text-brand-800 after:content-[""] after:absolute after:inset-x-0 after:bottom-0 after:border-b-2 after:border-brand-700'
                : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className="ms-1.5 rounded bg-surface-subtle px-1.5 py-0.5 text-xs tabular-nums text-ink-secondary">
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
