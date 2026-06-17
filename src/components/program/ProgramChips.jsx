export const PROGRAM_ITEMS = [
  'Child Health', 'Clinical Chemistry', 'Drought Impact', 'Family Planning',
  'HIV Adult', 'HIV Pediatric', 'HIV Test', 'Leprosy', 'LLIN', 'Malaria',
  'Maternal Health', 'MDR - TB', 'Neglected Tropical Diseases', 'Nutrition', 'RDF', 'TB',
];

function ProgramChips({ active, onChange }) {
  return (
    <div className="border-b border-outline-variant/30 py-2">
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {PROGRAM_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange?.(item)}
            className={`px-2 py-1 rounded text-[11px] font-bold text-center truncate transition-colors ${
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
