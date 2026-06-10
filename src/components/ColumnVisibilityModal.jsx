import { useState, useRef, useEffect } from 'react';

const ColumnVisibilityModal = ({ isOpen, onClose, columns, visibleColumns, onToggleColumn, onShowAll, onHideAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    // Focus search input when modal opens
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Handle escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter columns based on search term
  const filteredColumns = columns.filter(column =>
    column.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-card shadow-overlay w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-low">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-md text-text-primary font-semibold">
              Columns
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-input hover:bg-surface-low transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 text-on-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Column title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-b-2 border-primary text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none bg-transparent"
              aria-label="Search columns"
            />
            <div className="absolute top-0 left-0 text-label-sm text-primary font-medium">
              Find column
            </div>
          </div>
        </div>

        {/* Column List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredColumns.length === 0 ? (
            <div className="px-6 py-8 text-center text-body-md text-on-surface-variant">
              No columns found
            </div>
          ) : (
            <div className="py-2">
              {filteredColumns.map((column) => (
                <div
                  key={column}
                  className="px-6 py-3 hover:bg-surface-low transition-colors flex items-center gap-4 cursor-pointer"
                  onClick={() => onToggleColumn(column)}
                >
                  {/* Toggle Switch */}
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      visibleColumns[column] ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                    role="switch"
                    aria-checked={visibleColumns[column]}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        visibleColumns[column] ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>

                  {/* Column Label */}
                  <span className="text-body-md text-on-surface">
                    {column}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-low flex items-center justify-between">
          <button
            onClick={onHideAll}
            className="text-label-sm font-semibold text-primary hover:text-primary-hover transition-colors uppercase"
          >
            Hide All
          </button>
          <button
            onClick={onShowAll}
            className="text-label-sm font-semibold text-primary hover:text-primary-hover transition-colors uppercase"
          >
            Show All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnVisibilityModal;
