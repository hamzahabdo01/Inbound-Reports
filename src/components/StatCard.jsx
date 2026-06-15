export default function StatCard({ icon, label, value, valueColor, bgIcon, trend, trendLabel }) {
  return (
    <div className="bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] p-5 flex flex-col gap-3 hover:shadow-[0px_8px_28px_rgba(10,50,53,0.1)] transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgIcon || 'bg-[#F0F4F6]'}`}>
          <i className={`fa-solid ${icon} text-base ${valueColor || 'text-[#0B4F54]'}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#BA1A1A]/10 text-[#BA1A1A]'
          }`}>
            {trend >= 0 ? '\u2191' : '\u2193'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className={`text-3xl font-extrabold leading-none tracking-tight ${valueColor || 'text-[#181C1E]'}`}>
          {value}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#707979] mt-1.5">
          {label}
        </div>
        {trendLabel && (
          <div className="text-xs text-[#404849] mt-1">{trendLabel}</div>
        )}
      </div>
    </div>
  );
}
