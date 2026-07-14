export default function LandscapeToggle({ value, onChange, className = '' }: { value: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <div className={`flex items-center rounded-lg border border-outline-variant bg-surface-container-low p-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1 ${
          !value
            ? 'bg-white text-on-surface shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <i className="fa-solid fa-compress text-[9px]" />
        Compact
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1 ${
          value
            ? 'bg-white text-on-surface shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <i className="fa-solid fa-expand text-[9px]" />
        Landscape
      </button>
    </div>
  );
}
