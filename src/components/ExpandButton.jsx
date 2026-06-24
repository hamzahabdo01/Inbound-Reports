import { useState } from 'react';
import ExpandModal from './ExpandModal';

/**
 * ExpandButton — placed beside InfoButton on every pie chart card.
 * Opens ExpandModal with two tabs: Charts and Tabular.
 *
 * Props:
 *   data         - Array<{ label: string, value: number, color?: string }>
 *   title        - string  (chart title — used as modal heading + left column header)
 *   totalLabel   - string  (optional fallback label)
 *   className    - string  (optional extra Tailwind classes)
 */
export default function ExpandButton({ data, title, totalLabel, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-10 h-10 bg-white rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group ${className}`}
        title="Expand Chart"
        aria-label="Expand Chart"
      >
        <div className="w-6 h-6 rounded-full bg-[#0B4F54] group-hover:bg-[#00373B] flex items-center justify-center transition-colors duration-200">
          {/* Expand / arrows-out icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="transform group-hover:scale-105 transition-transform duration-200"
          >
            <path
              d="M3 9V3h6M3 3l7 7M21 15v6h-6M21 21l-7-7"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      <ExpandModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        data={data}
        title={title || totalLabel || 'Chart'}
      />
    </>
  );
}
