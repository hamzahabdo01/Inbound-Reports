export const PROGRAM_ITEMS = [
  'Child Health', 'Clinical Chemistry', 'Drought Impact', 'Family Planning',
  'HIV Adult', 'HIV Pediatric', 'HIV Test', 'Leprosy', 'LLIN', 'Malaria',
  'Maternal Health', 'MDR - TB', 'Neglected Tropical Diseases', 'Nutrition', 'RDF', 'TB', 'Vaccine',
];

function ProgramChips({ active, onChange }: any) {
  return (
    <div className="border-b border-outline-variant/30 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PROGRAM_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange?.(item)}
              className={`shrink-0 px-3 py-1.5 rounded text-[11px] font-bold text-center transition-colors ${
                item === active
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
    </div>
  );
}

export default ProgramChips;
