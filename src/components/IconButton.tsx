import { useState } from 'react';
import InfoModal from './InfoModal';
import ExpandModal from './ExpandModal';

interface IconButtonProps {
  variant: 'info' | 'expand' | 'refresh' | 'export';
  contentId?: string;
  data?: any[];
  title?: string;
  totalLabel?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function IconButton({
  variant,
  contentId,
  data,
  title,
  totalLabel,
  onClick,
  loading,
  disabled,
  className = '',
}: IconButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (variant === 'info' || variant === 'expand') {
      setIsOpen(true);
    } else {
      onClick?.();
    }
  };

  const opensModal = variant === 'info' || variant === 'expand';
  const hoverClass = variant === 'refresh' ? 'hover:bg-surface-container-low' : '';

  const renderIcon = () => {
    if (variant === 'info') {
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" className="transform group-hover:scale-105 transition-transform duration-200">
          <rect x="11.25" y="9.5" width="1.5" height="7" fill="white" />
          <rect x="10.25" y="9.5" width="3.5" height="1" fill="white" />
          <rect x="10.25" y="15.5" width="3.5" height="1" fill="white" />
          <circle cx="12.0" cy="6.25" r="1.25" fill="white" />
        </svg>
      );
    }
    if (variant === 'expand') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transform group-hover:scale-105 transition-transform duration-200">
          <path d="M3 9V3h6M3 3l7 7M21 15v6h-6M21 21l-7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (variant === 'export') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transform group-hover:scale-105 transition-transform duration-200">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''} text-[11px] text-white`} />
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!opensModal ? (disabled || loading) : undefined}
        className={`w-10 h-10 bg-white rounded-xl ${hoverClass} disabled:opacity-30 transition-all duration-200 flex items-center justify-center cursor-pointer group ${className}`}
        title={!opensModal && variant === 'refresh' ? 'Refresh' : variant === 'info' ? 'Information & Guide' : variant === 'expand' ? 'Expand Chart' : 'Export'}
        aria-label={!opensModal && variant === 'refresh' ? 'Refresh data' : variant === 'info' ? 'Open Guide' : variant === 'expand' ? 'Expand Chart' : 'Export'}
      >
        <div className="w-6 h-6 rounded-full bg-[#0B4F54] group-hover:bg-[#00373B] flex items-center justify-center transition-colors duration-200">
          {renderIcon()}
        </div>
      </button>

      {variant === 'info' && (
        <InfoModal contentId={contentId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
      {variant === 'expand' && (
        <ExpandModal isOpen={isOpen} onClose={() => setIsOpen(false)} data={data || []} title={title || totalLabel || 'Chart'} />
      )}
    </>
  );
}
