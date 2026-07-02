import { useReducer, useEffect } from 'react';

// Available operators
const OPERATORS = [
  'contains',
  'equals',
  'starts with',
  'ends with',
  'is empty',
  'is not empty',
  'is any of'
];

// Filter reducer
const filterReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_FILTER':
      return [
        ...state,
        { id: Date.now(), column: '', operator: 'contains', value: '' }
      ];
    
    case 'REMOVE_FILTER':
      return state.filter(filter => filter.id !== action.payload);
    
    case 'UPDATE_FILTER':
      return state.map(filter =>
        filter.id === action.payload.id
          ? { ...filter, [action.payload.field]: action.payload.value }
          : filter
      );
    
    case 'CLEAR_ALL':
      return [];
    
    case 'SET_FILTERS':
      return action.payload;
    
    default:
      return state;
  }
};

const AdvancedFiltersModal = ({ isOpen, onClose, columns, onApplyFilters, initialFilters = [] }) => {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddFilter = () => {
    dispatch({ type: 'ADD_FILTER' });
  };

  const handleRemoveFilter = (id) => {
    dispatch({ type: 'REMOVE_FILTER', payload: id });
  };

  const handleUpdateFilter = (id, field, value) => {
    dispatch({
      type: 'UPDATE_FILTER',
      payload: { id, field, value }
    });
  };

  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const handleApply = () => {
    // Only send valid filters (with column and operator selected)
    const validFilters = filters.filter(f => f.column && f.operator);
    onApplyFilters(validFilters);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial filters
    dispatch({ type: 'SET_FILTERS', payload: initialFilters });
    onClose();
  };

  // Check if operator needs value input
  const needsValue = (operator) => {
    return operator !== 'is empty' && operator !== 'is not empty';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={handleCancel}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-headline text-text-primary font-semibold mb-1">
                Advanced Filters
              </h2>
              <p className="text-body-sm text-text-secondary">
                {filters.length > 0 ? `${filters.length} filter${filters.length > 1 ? 's' : ''} configured` : 'Add filters to narrow down results'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-surface-low transition-colors text-text-tertiary hover:text-text-primary"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter List */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {filters.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div className="text-body font-medium text-text-primary mb-2">No filters added yet</div>
              <div className="text-body-sm text-text-secondary mb-6">Click "Add Filter" below to create your first filter</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter, index) => (
                <div key={filter.id}>
                  <div className="bg-surface-low rounded-xl p-5 border border-outline">
                    <div className="flex items-start gap-4">
                      {/* Filter Number Badge */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-label-sm font-semibold">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          {/* Column Selector */}
                          <div>
                            <label className="block text-label-sm text-text-secondary mb-2">
                              Column
                            </label>
                            <select
                              value={filter.column}
                              onChange={(e) => handleUpdateFilter(filter.id, 'column', e.target.value)}
                              className="w-full px-3 py-2 border border-outline rounded-lg text-body-sm text-text-primary bg-white hover:border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            >
                              <option value="">Select column</option>
                              {columns.map(column => (
                                <option key={column} value={column}>
                                  {column}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Operator Selector */}
                          <div>
                            <label className="block text-label-sm text-text-secondary mb-2">
                              Operator
                            </label>
                            <select
                              value={filter.operator}
                              onChange={(e) => handleUpdateFilter(filter.id, 'operator', e.target.value)}
                              className="w-full px-3 py-2 border border-outline rounded-lg text-body-sm text-text-primary bg-white hover:border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            >
                              {OPERATORS.map(operator => (
                                <option key={operator} value={operator}>
                                  {operator}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Value Input */}
                          <div>
                            <label className="block text-label-sm text-text-secondary mb-2">
                              Value
                            </label>
                            {needsValue(filter.operator) ? (
                              <input
                                type="text"
                                value={filter.value}
                                onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                                placeholder="Enter value..."
                                className="w-full px-3 py-2 border border-outline rounded-lg text-body-sm text-text-primary bg-white hover:border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-tertiary transition-all"
                              />
                            ) : (
                              <div className="px-3 py-2 border border-outline rounded-lg text-body-sm text-text-tertiary bg-surface italic">
                                Not required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFilter(filter.id)}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 transition-colors text-text-tertiary hover:text-error"
                        aria-label="Remove filter"
                        title="Remove filter"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* AND indicator (except for last filter) */}
                  {index < filters.length - 1 && (
                    <div className="flex items-center justify-center py-3">
                      <div className="px-4 py-1.5 bg-primary text-white text-label-sm font-semibold rounded-full">
                        AND
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-outline bg-surface">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleAddFilter}
                className="px-5 py-2.5 bg-white text-primary border border-primary rounded-lg hover:bg-primary-light transition-all text-label font-medium inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Filter
              </button>
              {filters.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-5 py-2.5 text-text-secondary border border-outline rounded-lg hover:bg-white hover:border-outline-variant transition-all text-label font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-text-secondary border border-outline rounded-lg hover:bg-white hover:border-outline-variant transition-all text-label font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all text-label font-medium shadow-sm"
              >
                Apply {filters.length > 0 && `(${filters.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedFiltersModal;
