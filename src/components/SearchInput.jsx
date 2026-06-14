import { memo } from 'react';

function SearchInput({ value, onChange, placeholder, className }) {
  return (
    <div className={`relative w-full ${className || ''}`}>
      <svg className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-[#D1D5DB] rounded text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

export default memo(SearchInput);
