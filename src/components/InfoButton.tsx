import { useState } from 'react';
import InfoModal from './InfoModal';

export default function InfoButton({ contentId, className = '' }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-10 h-10 bg-white rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group ${className}`}
        title="Information & Guide"
        aria-label="Open Guide"
      >
        <div className="w-6 h-6 rounded-full bg-[#0B4F54] group-hover:bg-[#00373B] flex items-center justify-center transition-colors duration-200">
          <svg 
            width="30" 
            height="30" 
            viewBox="0 0 24 24" 
            className="transform group-hover:scale-105 transition-transform duration-200"
          >
            <rect x="11.25" y="9.5" width="1.5" height="7" fill="white" />
            <rect x="10.25" y="9.5" width="3.5" height="1" fill="white" />
            <rect x="10.25" y="15.5" width="3.5" height="1" fill="white" />
            <circle cx="12.0" cy="6.25" r="1.25" fill="white" />
          </svg>
        </div>
      </button>

      <InfoModal 
        contentId={contentId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
