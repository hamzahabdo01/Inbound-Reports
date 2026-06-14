import { memo } from 'react';

function SelectFilter({ value, onChange, options, allLabel, className, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`px-4 py-2 border border-[#D1D5DB] rounded text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-surface-container-lowest ${className || ''}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {allLabel && <option value="All">{allLabel}</option>}
      {options && options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={val} value={val}>{label}</option>
        );
      })}
    </select>
  );
}

export default memo(SelectFilter);
