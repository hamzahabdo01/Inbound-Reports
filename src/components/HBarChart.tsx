export default function HBarChart({ data }: any) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-3 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 text-right text-[11px] font-semibold text-[#404849] shrink-0 truncate">{d.label}</div>
          <div className="flex-1 bg-[#F0F4F6] rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2.5 transition-all duration-700 ease-out"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || '#0B4F54', minWidth: d.value > 0 ? '2.5rem' : 0 }}
            >
              <span className="text-[10px] font-bold text-white">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
