import { memo } from 'react';

function SimplePagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, label }) {
  if (totalPages <= 1) return null;

  const start = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const displayLabel = label || 'items';

  return (
    <div className="flex items-center justify-between px-lg py-4 bg-surface border-t border-outline-variant">
      <div className="text-body-sm text-on-surface-variant">
        Showing {start}-{end} of {totalItems} {displayLabel}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(SimplePagination);
