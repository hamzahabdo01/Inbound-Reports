import { memo } from 'react';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  rowsPerPage, 
  onPageChange, 
  onRowsPerPageChange,
  hasFilters 
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-white border-t border-outline">
      <div className="max-w-container mx-auto px-margin-side py-4">
        <div className="flex items-center justify-between">
          {/* Result Info */}
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-text-secondary">
              Showing <span className="font-medium text-text-primary">{startItem}–{endItem}</span> of{' '}
              <span className="font-medium text-text-primary">{totalItems}</span> shipments
              {hasFilters && <span className="text-text-tertiary"> (filtered)</span>}
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-text-secondary">Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 border border-outline rounded text-body-sm text-text-primary bg-white hover:border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-low rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              Previous
            </button>
            
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-text-tertiary">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[36px] px-3 py-1.5 text-body-sm rounded transition-all ${
                    currentPage === page
                      ? 'bg-primary text-white font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || totalItems === 0}
              className="px-3 py-1.5 text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-low rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Pagination);
