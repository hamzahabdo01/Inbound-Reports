import { useState, useRef, useEffect } from 'react';

const ColumnVisibilityPanel = ({ isOpen, onClose, columns, visibleColumns, onToggleColumn, onShowAll, onHideAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    // Focus search input when panel opens
    if (searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    // Handle escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Handle click outside
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter columns based on search term
  const filteredColumns = columns.filter(column =>
    column.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      
      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg z-50 flex flex-col"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-outline">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-headline text-text-primary font-semibold mb-1">
                Column Visibility
              </h2>
              <p className="text-body-sm text-text-secondary">
                {visibleCount} of {columns.length} columns visible
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-low transition-colors text-text-tertiary hover:text-text-primary"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-body-sm text-text-primary placeholder-text-tertiary bg-surface-low border border-transparent rounded-lg focus:bg-white focus:border-primary focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredColumns.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-body-sm text-text-secondary">No columns found</div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredColumns.map((column) => (
                <label
                  key={column}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-low rounded-lg cursor-pointer transition-colors group"
                >
                  {/* Custom Checkbox */}
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column]}
                      onChange={() => onToggleColumn(column)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-outline rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                      {visibleColumns[column] && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Column Label */}
                  <span className="text-body text-text-primary group-hover:text-text-primary">
                    {column}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-outline bg-surface">
          <div className="flex items-center gap-3">
            <button
              onClick={onShowAll}
              className="flex-1 px-4 py-2.5 text-label text-text-secondary border border-outline rounded-lg hover:bg-white hover:text-text-primary hover:border-outline-variant transition-all"
            >
              Show All
            </button>
            <button
              onClick={onHideAll}
              className="flex-1 px-4 py-2.5 text-label text-text-secondary border border-outline rounded-lg hover:bg-white hover:text-text-primary hover:border-outline-variant transition-all"
            >
              Hide All
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default ColumnVisibilityPanel;
