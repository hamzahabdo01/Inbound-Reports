/**
 * Top-level page filter: "Health Program" vs "RDF"
 * Rendered inside the sticky shell in ProgramDashboard — no sticky/bg of its own.
 */
function ProgramTypeFilter({ value, onChange }: any) {
  return (
    <div className="border-b border-outline-variant/30 py-2 flex items-center gap-2 w-full">
      <span className="text-body-sm font-semibold text-on-surface-variant shrink-0">Filter:</span>
      <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-outline-variant/40 flex-1">
        {['Health Program', 'RDF'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${
              value === option
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProgramTypeFilter;
