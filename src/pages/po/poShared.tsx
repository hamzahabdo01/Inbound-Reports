import { useState, useRef, useEffect } from 'react';
import React from 'react';
import SimplePagination from '../../components/SimplePagination';

export const formatAmount = (v) => {
  if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
};

export function Table({ headers, rows, renderRow, className = '', page, setPage, rowsPerPage = 15, expandedRow, onRowClick, rowKey, renderExpanded, rowClassName = '', expandedRowClassName = '', mobileMinWidth }: any) {
  const scrollRef = useRef(null);
  const [visibleWidth, setVisibleWidth] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobilePageSize, setMobilePageSize] = useState(10);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
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

  if (!rows.length) {
    return <div className="p-6 text-center text-body-sm text-on-surface-variant">No records</div>;
  }

  const effectiveRowsPerPage = isMobile ? mobilePageSize : rowsPerPage;
  const totalPages = Math.ceil(rows.length / effectiveRowsPerPage);
  const displayRows = page ? rows.slice((page - 1) * effectiveRowsPerPage, page * effectiveRowsPerPage) : rows;

  const stickyHeaderCls = 'sticky left-0 z-20 bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]';
  const stickyBodyCls = 'sticky left-0 z-10 bg-white hover:bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]';

  const tableEl = (
    <table className={`w-full border-collapse ${isMobile ? 'whitespace-nowrap' : ''}`}>
      <thead>
        <tr className="bg-surface-container-low border-b border-outline-variant">
          {headers.map((h, i) => (
            <th key={h.key} className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase ${h.className || ''} ${i === 0 && isMobile ? stickyHeaderCls : ''}`}>
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {displayRows.flatMap((row, i) => {
          const id = rowKey ? row[rowKey] : i;
          const key = rowKey ? row[rowKey] : i;
          const isExpanded = expandedRow !== undefined && expandedRow === id;
          const renderedCells = renderRow(row, i, isExpanded);
          let processedCells = renderedCells;
          if (isMobile && renderedCells) {
            const cellChildren = renderedCells.props?.children;
            if (cellChildren) {
              processedCells = React.Children.map(cellChildren, (child, ci) => {
                if (ci === 0 && React.isValidElement(child)) {
                  const el = child as React.ReactElement<{ className?: string }>;
                  return React.cloneElement(el, {
                    className: `${el.props.className || ''} ${stickyBodyCls}`
                  });
                }
                return child;
              });
            }
          }
          const rowEl = (
            <tr key={key} className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isExpanded ? expandedRowClassName || 'bg-surface-low/30' : ''} ${rowClassName || 'hover:bg-surface-container-low'}`}
              onClick={() => onRowClick && onRowClick(id)}>
              {processedCells}
              </tr>
          );
          if (!isExpanded || !renderExpanded) return [rowEl];
          return [rowEl, (
            <tr key={`${key}-expanded`}>
              <td colSpan={headers.length} className="p-0 border-b border-outline-variant/30">
                <div
                  className="animate-fade-in bg-surface-container-lowest/50"
                  style={visibleWidth ? { position: 'sticky', left: 0, width: visibleWidth, overflow: 'hidden' } : {}}
                >
                  {renderExpanded(row)}
                </div>
              </td>
            </tr>
          )];
        })}
      </tbody>
    </table>
  );

  return (
    <div>
      {isMobile ? (
        <div className="relative">
          <div ref={scrollRef} tabIndex={0}
            className="overflow-x-auto -webkit-overflow-scrolling:touch outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div style={{ minWidth: mobileMinWidth ?? `${Math.max(headers.length * 90, 500)}px` }}>
              {tableEl}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
        </div>
      ) : (
        <div ref={scrollRef} className={`overflow-x-auto ${className}`}>
          {tableEl}
        </div>
      )}
      {page && setPage && (
        isMobile ? (
          <div className="flex items-center justify-between gap-3 py-2 px-lg bg-surface border-t border-outline-variant">
            <select value={mobilePageSize} onChange={(e) => { setMobilePageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 rounded border border-outline-variant bg-white px-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1}
                className="p-2 rounded border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-body-sm text-on-surface-variant font-semibold tabular-nums min-w-[4rem] text-center">{page} of {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                className="p-2 rounded border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                aria-label="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={rows.length}
            itemsPerPage={effectiveRowsPerPage}
            onPageChange={setPage}
            label="records"
          />
        )
      )}
    </div>
  );
}

export function Td({ children, className = '' }: any) {
  return <td className={`px-4 py-3 text-body-sm text-on-surface ${className}`}>{children}</td>;
}

export function StatusBadge({ status }: any) {
  const map = {
    Open: 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    Overdue: 'bg-error/10 text-error',
    Completed: 'bg-success/10 text-success',
    Active: 'bg-success/10 text-success',
    Expired: 'bg-surface-container text-on-surface-variant',
    Critical: 'bg-error/10 text-error',
    Warning: 'bg-warning/10 text-warning',
    'Received at Warehouse': 'bg-success/10 text-success',
    'Contract Signed': 'bg-primary/10 text-primary',
    'PO Issued': 'bg-primary/10 text-primary',
    'LC Opened': 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    'Port Arrival': 'bg-warning/10 text-warning',
    Cleared: 'bg-success/10 text-success',
    Received: 'bg-success/10 text-success',
    Verified: 'bg-success/10 text-success',
    Confiscated: 'bg-error/10 text-error',
    Extended: 'bg-warning/10 text-warning',
    MISSING: 'bg-surface-container text-on-surface-variant',
    SUBMITTED_NOT_RECEIVED: 'bg-warning/10 text-warning',
    EXPIRING_WITHIN_30_DAYS: 'bg-error/10 text-error',
    RECEIVED_EXPIRY_MISSING: 'bg-warning/10 text-warning',
    VALID: 'bg-success/10 text-success',
    EXPIRED: 'bg-surface-container text-on-surface-variant',
    EXPIRES_TODAY: 'bg-error/10 text-error',
    EXPIRES_WITHIN_7_DAYS: 'bg-error/10 text-error',
    EXPIRES_WITHIN_30_DAYS: 'bg-warning/10 text-warning',
    EXPIRES_WITHIN_60_DAYS: 'bg-success/10 text-success',
  };
  const cls = map[status] || 'bg-surface-container text-on-surface-variant';
  return <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${cls}`}>{status}</span>;
}

export function SectionPanel({ title, subtitle, action, searchBar, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-level-1">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-outline-variant/50">
        <div className="min-w-0 shrink">
          <h3 className="text-title-sm font-bold text-on-surface lg:truncate">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5 lg:truncate">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {searchBar && (
        <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container-lowest/40">
          {searchBar}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
