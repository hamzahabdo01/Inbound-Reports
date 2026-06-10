import { useState } from 'react';
import Dropdown from './Dropdown';

const SmartFilterBar = ({ 
  topFilters, 
  onTopFilterChange, 
  columnFilters, 
  onRemoveColumnFilter,
  onClearAllFilters,
  onOpenAdvancedFilters 
}) => {
  const hasFilters = columnFilters.length > 0 || 
    topFilters.invoiceType !== null || 
    topFilters.donor !== null || 
    topFilters.procurer !== null;

  return (
    <div className="bg-white border-b border-outline-variant">
      <div className="max-w-container mx-auto px-margin-side py-lg">
        {/* Quick Filters Row */}
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-3">
            <span className="text-label text-text-secondary">Quick Filters</span>
            
            <Dropdown
              label="Invoice Type"
              placeholder="Invoice Type"
              options={['By Air', 'By Sea']}
              value={topFilters.invoiceType}
              onChange={(value) => onTopFilterChange('invoiceType', value)}
            />
            
            <Dropdown
              label="Donor"
              placeholder="Donor"
              options={[
                'RDF',
                'SDG',
                'MOH',
                'Ministry of Finance',
                'Susan Thompson Buffett Foundation',
                'Global Fund'
              ]}
              value={topFilters.donor}
              onChange={(value) => onTopFilterChange('donor', value)}
            />
            
            <Dropdown
              label="Procurer"
              placeholder="Procurer"
              options={['EPSS', 'MOH']}
              value={topFilters.procurer}
              onChange={(value) => onTopFilterChange('procurer', value)}
            />
          </div>

          {hasFilters && (
            <button
              onClick={onClearAllFilters}
              className="text-label text-text-tertiary hover:text-primary transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Advanced Filters Row */}
        {columnFilters.length > 0 && (
            <div className="pt-md border-t border-outline-variant">
            <div className="flex items-center gap-2 mb-md">
              <span className="text-label text-text-secondary">Advanced Filters</span>
              <span className="px-2 py-0.5 bg-primary text-white text-label-sm rounded">
                {columnFilters.length}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {columnFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-body-sm group hover:border-outline-variant transition-colors"
                >
                  <span className="font-medium text-primary">{filter.column}</span>
                  <span className="text-text-tertiary">{filter.operator}</span>
                  {filter.value && (
                    <span className="text-text-primary">"{filter.value}"</span>
                  )}
                  <button
                    onClick={() => onRemoveColumnFilter(filter.id)}
                    className="ml-1 text-text-tertiary hover:text-error transition-colors"
                    aria-label="Remove filter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <button
                onClick={onOpenAdvancedFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-outline-variant rounded-lg text-body-sm text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-light transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add filter
              </button>
            </div>
          </div>
        )}

        {/* Add First Filter Button (when no column filters) */}
        {columnFilters.length === 0 && (
          <div className="pt-md border-t border-outline-variant">
              <button
                onClick={onOpenAdvancedFilters}
                className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-outline-variant rounded-lg text-body-sm text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-light transition-all"
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add advanced filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartFilterBar;
