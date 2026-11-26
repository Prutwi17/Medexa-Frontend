import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  isRowHeader?: boolean;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  caption: string;
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  responsiveStack?: boolean;
  className?: string;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function Table<T>({
  caption,
  columns,
  data,
  rowKey,
  emptyMessage = 'No records available.',
  responsiveStack = true,
  className,
}: TableProps<T>) {
  const captionId = useId();

  if (data.length === 0) {
    return (
      <div className="rounded-[var(--medexa-radius-lg)] border border-border-subtle bg-surface-soft px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className={cn(
        'medexa-table-wrapper rounded-[var(--medexa-radius-lg)] border border-border-subtle bg-surface-canvas',
        className
      )}
    >
      <table className={cn('medexa-table text-sm', responsiveStack && 'medexa-table--responsive')}>
        <caption id={captionId} className="visually-hidden">
          {caption}
        </caption>
        <thead className="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-secondary">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'border-b border-border-subtle px-4 py-3 whitespace-nowrap',
                  alignClass[column.align ?? 'left']
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-brand-50/50 transition-colors">
              {columns.map((column, index) => {
                const isRowHeader = column.isRowHeader ?? index === 0;
                const cellContent = column.render(row);

                if (isRowHeader) {
                  return (
                    <th
                      key={column.key}
                      scope="row"
                      className={cn(
                        'px-4 py-3.5 font-semibold text-ink-primary whitespace-nowrap',
                        alignClass[column.align ?? 'left']
                      )}
                    >
                      {cellContent}
                    </th>
                  );
                }

                return (
                  <td
                    key={column.key}
                    data-label={column.header}
                    className={cn(
                      'px-4 py-3.5 text-ink-secondary',
                      alignClass[column.align ?? 'left']
                    )}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
