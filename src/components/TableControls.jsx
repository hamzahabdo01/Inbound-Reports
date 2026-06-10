import { useState } from 'react';

const TableControls = ({ onSearch, onOpenColumnConfig, density, onDensityChange }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="bg-white border-b border-outline-variant">
      <div className="max-w-container mx-auto px-margin-side py-3">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchValue}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 text-body-sm text-text-primary placeholder-text-tertiary bg-transparent border border-transparent rounded-lg hover:bg-surface-low hover:border-outline-variant focus:bg-white focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenColumnConfig}
              className="inline-flex items-center gap-2 px-3 py-2 text-label text-text-secondary hover:text-text-primary hover:bg-surface-low rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Columns
            </button>

            <div className="w-px h-5 bg-outline-variant mx-1" />

            {/* Density Toggle */}
            <div className="flex items-center gap-1 bg-surface-low rounded-lg p-1">
              <button
                onClick={() => onDensityChange('compact')}
                className={`p-1.5 rounded transition-all ${
                  density === 'compact'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Compact"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => onDensityChange('normal')}
                className={`p-1.5 rounded transition-all ${
                  density === 'normal'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Normal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </button>
              <button
                onClick={() => onDensityChange('comfortable')}
                className={`p-1.5 rounded transition-all ${
                  density === 'comfortable'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Comfortable"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h16M4 14h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableControls;
