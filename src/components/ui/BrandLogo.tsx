import { cn } from '@/lib/cn';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="9" fill="#0B6E4F" />
        <path
          d="M15.25 8.5C15.25 7.94772 15.6977 7.5 16.25 7.5H19.75C20.3023 7.5 20.75 7.94772 20.75 8.5V15.25H27.5C28.0523 15.25 28.5 15.6977 28.5 16.25V19.75C28.5 20.3023 28.0523 20.75 27.5 20.75H20.75V27.5C20.75 28.0523 20.3023 28.5 19.75 28.5H16.25C15.6977 28.5 15.25 28.0523 15.25 27.5V20.75H8.5C7.94772 20.75 7.5 20.3023 7.5 19.75V16.25C7.5 15.6977 7.94772 15.25 8.5 15.25H15.25V8.5Z"
          fill="#FFFFFF"
        />
        <circle cx="27" cy="9" r="3" fill="#7FE3BE" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight text-ink-primary">Medexa</span>
          <span className="text-[11px] font-medium tracking-wide text-brand-700 uppercase">
            Pharmacy Network
          </span>
        </span>
      )}
    </span>
  );
}
