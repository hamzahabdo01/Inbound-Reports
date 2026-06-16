function ProgramMapPanel({ title, subtitle, focus = 'global', points = [] }) {
  const isFacility = focus === 'facility';
  const visiblePoints = points.slice(0, isFacility ? 42 : 18);

  return (
    <section className="bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant">
        <h2 className="text-header-sm text-on-surface">{title}</h2>
        {subtitle && <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      <div className="relative h-[320px] bg-[#1f5558] overflow-hidden">
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: 'linear-gradient(#86BFC5 1px, transparent 1px), linear-gradient(90deg, #86BFC5 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }} />
        <div className="absolute inset-x-10 top-14 h-28 rounded-[50%] border border-[#86BFC5]/30" />
        <div className="absolute left-16 top-24 w-56 h-28 rounded-[45%] bg-[#86BFC5]/10 border border-[#86BFC5]/20" />
        <div className="absolute right-20 top-20 w-64 h-32 rounded-[45%] bg-[#D97706]/10 border border-[#D97706]/20" />
        <div className="absolute left-[42%] top-36 w-44 h-40 rounded-[45%] bg-[#86BFC5]/10 border border-[#86BFC5]/20" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 320" preserveAspectRatio="none">
          <path d="M150 160 C 300 70, 470 85, 620 150 S 830 235, 920 135" fill="none" stroke="#86BFC5" strokeWidth="3" strokeDasharray="8 9" opacity="0.75" />
          <path d="M220 230 C 380 180, 480 230, 570 190 S 760 105, 870 205" fill="none" stroke="#D97706" strokeWidth="2" strokeDasharray="5 8" opacity="0.65" />
        </svg>
        {visiblePoints.map((point, index) => (
          <span
            key={`${point.label}-${index}`}
            className={`absolute rounded-full border-2 border-white shadow ${isFacility ? 'w-2 h-2 bg-warning' : 'w-3 h-3 bg-[#86BFC5]'}`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
            }}
            title={point.label}
          />
        ))}
        <div className="absolute left-5 bottom-5 rounded-lg bg-white/90 px-4 py-3 shadow-sm">
          <p className="text-label-caps uppercase text-primary">{isFacility ? 'Facility Distribution' : 'Supply Route'}</p>
          <p className="text-body-sm text-on-surface-variant mt-1">{visiblePoints.length} plotted reference points</p>
        </div>
      </div>
    </section>
  );
}

export default ProgramMapPanel;
