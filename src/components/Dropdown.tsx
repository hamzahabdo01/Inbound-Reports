import { useState, useRef, useEffect } from 'react';

const Dropdown = ({ label, options, value, onChange, placeholder = 'Select' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const displayValue = value || placeholder;
  const hasValue = value !== null && value !== '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`min-w-[160px] px-3 py-1.5 border rounded-lg text-body-sm transition-all flex items-center justify-between gap-2 ${
          hasValue
            ? 'bg-primary-light border-primary text-primary font-medium'
            : 'bg-white border-outline text-text-secondary hover:border-outline-variant'
        } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20`}
      >
        <span className="truncate">{displayValue}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasValue && (
            <button
              onClick={handleClear}
              className="hover:bg-primary/10 rounded p-0.5 transition-colors"
              aria-label="Clear selection"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline rounded-lg shadow-md z-50 overflow-hidden max-h-64 overflow-y-auto">
          {/* Default/Reset Option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full px-3 py-2 text-left text-body-sm transition-colors ${
              !hasValue
                ? 'bg-surface-low text-text-primary font-medium'
                : 'bg-white text-text-secondary hover:bg-surface-low'
            }`}
          >
            {placeholder}
          </button>

          {/* Options */}
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left text-body-sm transition-colors ${
                value === option
                   ? 'bg-primary-light text-primary font-medium'
                  : 'bg-white text-text-primary hover:bg-surface-low'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
