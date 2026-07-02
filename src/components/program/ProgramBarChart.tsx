function ProgramBarChart({ data, valueFormatter = (value) => value }: any) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="h-64 flex items-end gap-3 px-2 pt-4 pb-2">
      {data.map((item) => (
        <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center gap-2">
          <div className="w-full h-44 flex items-end justify-center rounded bg-surface-container-low overflow-hidden">
            <div
              className="w-full rounded-t bg-primary transition-all duration-500"
              style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%`, backgroundColor: item.color || '#0B4F54' }}
              title={`${item.label}: ${valueFormatter(item.value)}`}
            />
          </div>
          <p className="text-[11px] font-bold text-on-surface truncate w-full text-center">{valueFormatter(item.value)}</p>
          <p className="text-[10px] text-on-surface-variant truncate w-full text-center" title={item.label}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default ProgramBarChart;
