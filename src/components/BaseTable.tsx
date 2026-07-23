import { ReactNode, useState, useRef, useEffect } from 'react';
import React from 'react';
import SimplePagination from './SimplePagination';

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
  page?: number;
  setPage?: (page: number) => void;
  rowsPerPage?: number;
  renderRow?: (row: any, index: number, isExpanded: boolean) => ReactNode;
  expandedRow?: any;
  rowKey?: string;
  onRowClick?: (id: any) => void;
  renderExpanded?: (row: any) => ReactNode;
  expandedRowClassName?: string;
  mobileMinWidth?: string;
  emptyMessage?: string;
  emptyState?: ReactNode;
  minWidth?: string;
  rowClassName?: string | ((row: any) => string);
  headerBg?: string;
  headerRowClassName?: string;
  cellPadding?: string;
  headerPadding?: string;
  tableClassName?: string;
  wrapperClassName?: string;
  cellTextSize?: string;
}

export function Td({ children, className = '' }: any) {
  return <td className={`px-4 py-3 text-body-sm text-on-surface ${className}`}>{children}</td>;
}

function BaseTable({
  columns,
  rows,
  pagination,
  page: pageProp,
  setPage,
  rowsPerPage: rowsPerPageProp = 15,
  renderRow,
  expandedRow,
  rowKey,
  onRowClick,
  renderExpanded,
  expandedRowClassName = '',
  mobileMinWidth,
  emptyMessage = 'No records',
  emptyState,
  minWidth,
  rowClassName,
  headerBg,
  headerRowClassName,
  cellPadding = 'px-4 py-3',
  headerPadding = 'px-4 py-3',
  tableClassName = '',
  wrapperClassName = '',
  cellTextSize = 'text-body-md',
}: BaseTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleWidth, setVisibleWidth] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobilePageSize, setMobilePageSize] = useState(10);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setVisibleWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasRows = rows.length > 0;
  const useCustomPagination = pageProp !== undefined && setPage !== undefined;
  const effectiveRowsPerPage = useCustomPagination
    ? (isMobile ? mobilePageSize : rowsPerPageProp)
    : (pagination?.rowsPerPage || rows.length);
  const totalPages = useCustomPagination
    ? Math.ceil(rows.length / effectiveRowsPerPage)
    : (pagination?.totalPages || 1);
  const displayRows = useCustomPagination
    ? rows.slice((pageProp - 1) * effectiveRowsPerPage, pageProp * effectiveRowsPerPage)
    : pagination
      ? rows.slice((pagination.page - 1) * effectiveRowsPerPage, pagination.page * effectiveRowsPerPage)
      : rows;

  const stickyHeaderCls = 'sticky left-0 z-20 bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]';
  const stickyBodyCls = 'sticky left-0 z-10 bg-white hover:bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]';

  if (!hasRows) {
    return <div className="p-6 text-center text-body-sm text-on-surface-variant">{emptyState || emptyMessage}</div>;
  }

  const headerClass = (col: ColumnDef, i: number) => {
    const alignCls = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
    const colCls = renderRow ? (col.className || '') : (col.headerClassName || '');
    return `${headerPadding} text-label-caps uppercase ${alignCls} text-on-surface-variant ${col.width || ''} ${colCls} ${i === 0 && isMobile && renderRow ? stickyHeaderCls : ''}`;
  };

  const tableEl = (
    <table className={`w-full border-collapse ${isMobile && renderRow ? 'whitespace-nowrap' : ''} ${tableClassName}`} style={minWidth ? { minWidth } : undefined}>
      <thead className={headerBg || ''}>
        <tr className={headerRowClassName || 'bg-surface-container-low border-b border-outline-variant'}>
          {columns.map((col, i) => (
            <th key={col.key} className={headerClass(col, i)}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={renderRow ? 'divide-y divide-outline-variant/30' : ''}>
        {displayRows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-12 text-center text-body-sm text-on-surface-variant">
              {emptyState || emptyMessage}
            </td>
          </tr>
        ) : renderRow ? (
          displayRows.flatMap((row, i) => {
            const id = rowKey ? row[rowKey] : i;
            const key = rowKey ? row[rowKey] : i;
            const isExpanded = expandedRow !== undefined && expandedRow === id;
            const renderedCells = renderRow(row, i, isExpanded);
            let processedCells = renderedCells;
            if (isMobile && renderedCells) {
              const cellChildren = (renderedCells as any)?.props?.children;
              if (cellChildren) {
                processedCells = React.Children.map(cellChildren, (child, ci) => {
                  if (ci === 0 && React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
                      className: `${(child.props as any)?.className || ''} ${stickyBodyCls}`
                    });
                  }
                  return child;
                });
              }
            }
            const rowEl = (
              <tr key={key} className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isExpanded ? expandedRowClassName || 'bg-surface-low/30' : ''} ${typeof rowClassName === 'function' ? rowClassName(row) : rowClassName || 'hover:bg-surface-container-low'}`}
                onClick={() => onRowClick && onRowClick(id)}>
                {processedCells}
              </tr>
            );
            if (!isExpanded || !renderExpanded) return [rowEl];
            return [rowEl, (
              <tr key={`${key}-expanded`}>
                <td colSpan={columns.length} className="p-0 border-b border-outline-variant/30">
                  <div
                    className="animate-fade-in bg-surface-container-lowest/50"
                    style={visibleWidth ? { position: 'sticky' as const, left: 0, width: visibleWidth, overflow: 'hidden' } : {}}
                  >
                    {renderExpanded(row)}
                  </div>
                </td>
              </tr>
            )];
          })
        ) : (
          rows.map((row, index) => {
            const key = rowKey ? row[rowKey] : index;
            const classes = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName || '';
            return (
              <tr key={key} className={`border-b border-surface-container-low transition-colors ${classes}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`${cellPadding} ${cellTextSize} text-on-surface ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}>
                    {col.render ? col.render(row, index) : (row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  const renderPagination = () => {
    if (useCustomPagination && pageProp && setPage) {
      if (isMobile) {
        return (
          <div className="flex items-center justify-between gap-3 py-2 px-lg bg-surface border-t border-outline-variant">
            <select value={mobilePageSize} onChange={(e) => { setMobilePageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 rounded border border-outline-variant bg-white px-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(pageProp - 1)} disabled={pageProp === 1}
                className="p-2 rounded border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-body-sm text-on-surface-variant font-semibold tabular-nums min-w-[4rem] text-center">{pageProp} of {totalPages}</span>
              <button onClick={() => setPage(pageProp + 1)} disabled={pageProp === totalPages}
                className="p-2 rounded border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                aria-label="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        );
      }
      return (
        <SimplePagination
          currentPage={pageProp}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={effectiveRowsPerPage}
          onPageChange={setPage}
          label="records"
        />
      );
    }
    if (pagination && hasRows) {
      const start = (pagination.page - 1) * pagination.rowsPerPage + 1;
      const end = Math.min(pagination.page * pagination.rowsPerPage, pagination.total);
      return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface-variant">
          <span>{pagination.info || `${start}\u2013${end} of ${pagination.total}`}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => pagination.onChange(Math.max(pagination.page - 1, 1))} disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors" aria-label="Previous page"
            >
              <i className="fa-solid fa-chevron-left text-[11px]" />
            </button>
            <span className="font-medium text-on-surface min-w-[4ch] text-center">{pagination.page}/{pagination.totalPages}</span>
            <button type="button" onClick={() => pagination.onChange(Math.min(pagination.page + 1, pagination.totalPages))} disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors" aria-label="Next page"
            >
              <i className="fa-solid fa-chevron-right text-[11px]" />
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isMobile && renderRow) {
    return (
      <div>
        <div className="relative">
          <div ref={scrollRef} tabIndex={0}
            className="overflow-x-auto -webkit-overflow-scrolling:touch outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div style={{ minWidth: mobileMinWidth ?? `${Math.max(columns.length * 90, 500)}px` }}>
              {tableEl}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
        </div>
        {renderPagination()}
      </div>
    );
  }

  return (
    <div>
      <div ref={scrollRef} className={`overflow-x-auto ${wrapperClassName}`}>
        {tableEl}
      </div>
      {renderPagination()}
    </div>
  );
}

export default BaseTable;
