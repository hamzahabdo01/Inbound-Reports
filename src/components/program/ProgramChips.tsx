export const PROGRAM_ITEMS = [
  'Child Health', 'Clinical Chemistry', 'Drought Impact', 'Family Planning',
  'HIV Adult', 'HIV Pediatric', 'HIV Test', 'Leprosy', 'LLIN', 'Malaria',
  'Maternal Health', 'MDR - TB', 'Neglected Tropical Diseases', 'Nutrition', 'RDF', 'TB', 'Vaccine',
];

function ProgramChips({ active, onChange, children }: any) {
  return (
    <div className="top-0 z-40 -mx-lg border-b border-outline-variant/40 bg-[#F6FAFC]/95 px-md py-2 shadow-sm backdrop-blur sm:px-lg">
      <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none [-webkit-overflow-scrolling:touch]">
          {PROGRAM_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange?.(item)}
              className={`h-8 shrink-0 whitespace-nowrap rounded-md px-3 text-center text-[11px] font-bold transition-colors ${
                item === active
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary'
              }`}
            >
              {item}
            </button>
          ))}
      </div>
      {children && <div className="mt-2 min-w-0">{children}</div>}
    </div>
  );
}

export default ProgramChips;
