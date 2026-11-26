import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  dismissOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  children: ReactNode;
}

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  dismissOnBackdrop = true,
  size = 'md',
  footer,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const isPointerOutside = (clientX: number, clientY: number, dialog: HTMLDialogElement): boolean => {
    const rect = dialog.getBoundingClientRect();
    return clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onPointerDown={(e) => {
        if (!dismissOnBackdrop || !dialogRef.current) return;
        pressedOutsideRef.current = isPointerOutside(e.clientX, e.clientY, dialogRef.current);
      }}
      onPointerUp={(e) => {
        if (!dismissOnBackdrop || !dialogRef.current) return;
        if (pressedOutsideRef.current && isPointerOutside(e.clientX, e.clientY, dialogRef.current)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-[var(--medexa-radius-lg)] border border-border-subtle',
        'bg-surface-canvas p-0 text-ink-primary shadow-[var(--medexa-shadow-md)]',
        modalSizes[size]
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div>
          <h1 id={titleId} className="text-lg font-semibold text-ink-primary">
            {title}
          </h1>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-ink-secondary">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--medexa-radius-sm)] text-ink-secondary hover:bg-surface-soft hover:text-ink-primary cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[70dvh] overflow-y-auto px-5 py-4">{children}</div>

      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border-subtle bg-surface-soft px-5 py-3.5">
          {footer}
        </div>
      )}
    </dialog>
  );
}
