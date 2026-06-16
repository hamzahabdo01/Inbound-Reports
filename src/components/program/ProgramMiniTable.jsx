function ProgramMiniTable({ columns, rows, emptyMessage = 'No records' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px]">
        <thead className="bg-[#CFD8DC]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left text-label-caps uppercase text-on-surface-variant">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                {emptyMessage}
              </td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={row.id || index} className="border-b border-surface-container-low hover:bg-surface-container-low">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-body-md text-on-surface">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProgramMiniTable;
