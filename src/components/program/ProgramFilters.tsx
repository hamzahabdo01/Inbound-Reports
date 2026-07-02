function ProgramFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  product,
  onProductChange,
  products,
  hasFilters,
  onClear,
}: any) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-[0px_4px_20px_rgba(10,50,53,0.06)]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[280px]">
          <span className="sr-only">Search program records</span>
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"></i>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search products, manufacturers, countries, purchase orders"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>

        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-11 min-w-[180px] rounded-lg border border-outline-variant bg-white px-3 text-body-md text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10"
          aria-label="Filter by stock status"
        >
          <option value="">Stock status: All</option>
          <option value="Normal">Normal</option>
          <option value="Below EOP">Below EOP</option>
          <option value="Stocked Out">Stocked Out</option>
          <option value="Excess">Excess</option>
        </select>

        <select
          value={product}
          onChange={(event) => onProductChange(event.target.value)}
          className="h-11 min-w-[190px] rounded-lg border border-outline-variant bg-white px-3 text-body-md text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10"
          aria-label="Filter by product"
        >
          <option value="">Product: All</option>
          {products.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={onClear}
            className="h-11 px-4 rounded-lg border border-outline-variant text-body-md font-semibold text-primary hover:bg-surface-container-low"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

export default ProgramFilters;
