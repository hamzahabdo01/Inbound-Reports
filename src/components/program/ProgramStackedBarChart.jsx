const palette = ['#0B4F54', '#4A9598', '#86BFC5', '#D97706', '#515F74'];

function ProgramStackedBarChart({ data, height = 220 }) {
  const max = Math.max(...data.map((item) => item.segments.reduce((sum, segment) => sum + segment.value, 0)), 1);
  const labels = [...new Set(data.flatMap((item) => item.segments.map((segment) => segment.label)))];

  return (
    <div className="p-5">
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((item) => {
          const total = item.segments.reduce((sum, segment) => sum + segment.value, 0);
          return (
            <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="w-full h-full flex items-end rounded bg-surface-container-low overflow-hidden">
                <div className="w-full flex flex-col justify-end" style={{ height: `${Math.max((total / max) * 100, total ? 8 : 0)}%` }}>
                  {item.segments.map((segment, index) => (
                    <div
                      key={segment.label}
                      className="w-full"
                      style={{
                        height: `${total ? (segment.value / total) * 100 : 0}%`,
                        backgroundColor: palette[index % palette.length],
                      }}
                      title={`${item.label} / ${segment.label}: ${segment.value}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant truncate w-full text-center" title={item.label}>{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {labels.map((label, index) => (
          <span key={label} className="inline-flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProgramStackedBarChart;
