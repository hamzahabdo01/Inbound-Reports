import { ReactNode } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  headerClassName?: string;
  render?: (row: any, index: number) => ReactNode;
}

export interface PaginationConfig {
  page: number;
  totalPages: number;
  total: number;
  rowsPerPage: number;
  onChange: (page: number) => void;
  info?: ReactNode;
}

interface BaseTableProps {
  columns: ColumnDef[];
  rows: any[];
  pagination?: PaginationConfig;
  emptyMessage?: string;
  emptyState?: ReactNode;
  minWidth?: string;
  rowKey?: (row: any, index: number) => string;
  onRowClick?: (row: any) => void;
  rowClassName?: string | ((row: any) => string);
  headerBg?: string;
  headerRowClassName?: string;
  cellPadding?: string;
  headerPadding?: string;
  tableClassName?: string;
  wrapperClassName?: string;
  cellTextSize?: string;
}

function BaseTable({
  columns,
  rows,
  pagination,
  emptyMessage = 'No records',
  emptyState,
  minWidth,
  rowKey,
  onRowClick,
  rowClassName,
  headerBg,
  headerRowClassName,
  cellPadding = 'px-4 py-3',
  headerPadding = 'px-4 py-3',
  tableClassName = '',
  wrapperClassName = '',
  cellTextSize = 'text-body-md',
}: BaseTableProps) {
  const hasRows = rows.length > 0;
  const start = hasRows ? (pagination ? (pagination.page - 1) * pagination.rowsPerPage + 1 : 1) : 0;
  const end = pagination ? Math.min(pagination.page * pagination.rowsPerPage, pagination.total) : rows.length;

  return (
    <div>
      <div className={`overflow-x-auto ${wrapperClassName}`}>
        <table className={`w-full ${tableClassName}`} style={minWidth ? { minWidth } : undefined}>
          <thead className={headerBg || ''}>
            <tr className={headerRowClassName || ''}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${headerPadding} text-label-caps uppercase ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} text-on-surface-variant ${col.width || ''} ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!hasRows ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-body-sm text-on-surface-variant">
                  {emptyState || emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const key = rowKey ? rowKey(row, index) : index;
                const classes = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName || '';
                return (
                  <tr
                    key={key}
                    className={`border-b border-surface-container-low transition-colors ${classes}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${cellPadding} ${cellTextSize} text-on-surface ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, index) : (row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && hasRows && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface-variant">
          <span>
            {pagination.info || `${start}\u2013${end} of ${pagination.total}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => pagination.onChange(Math.max(pagination.page - 1, 1))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors"
              aria-label="Previous page"
            >
              <i className="fa-solid fa-chevron-left text-[11px]" />
            </button>
            <span className="font-medium text-on-surface min-w-[4ch] text-center">
              {pagination.page}/{pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => pagination.onChange(Math.min(pagination.page + 1, pagination.totalPages))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors"
              aria-label="Next page"
            >
              <i className="fa-solid fa-chevron-right text-[11px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BaseTable;
