import { useMemo } from 'react';

export default function DonutChart({ data, subtitle }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const R = 70;
  const r = 44;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const fraction = d.value / total;
    const startAngle = cumAngle;
    const endAngle = cumAngle + fraction * 2 * Math.PI;
    cumAngle = endAngle;

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const ix1 = cx + r * Math.cos(endAngle);
    const iy1 = cy + r * Math.sin(endAngle);
    const ix2 = cx + r * Math.cos(startAngle);
    const iy2 = cy + r * Math.sin(startAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    return { ...d, path, fraction };
  });

  return (
    <div className="flex items-start gap-8">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {slices.map((s, i) => (
              <filter key={i} id={`shadow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={s.color} floodOpacity="0.25" />
              </filter>
            ))}
          </defs>
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              filter={`url(#shadow-${i})`}
              className="transition-all duration-200 cursor-pointer hover:opacity-90"
            >
              <title>{s.label}: {s.value} ({(s.fraction * 100).toFixed(1)}%)</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={r - 2} fill="white" />
          <text x={cx} y={cy - 8} textAnchor="middle" className="font-extrabold" style={{ fontSize: 22, fontWeight: 800, fill: '#181C1E', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#707979', fontFamily: 'Plus Jakarta Sans, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
            {subtitle}
          </text>
        </svg>
      </div>
      <div className="flex-1 flex flex-col gap-2 justify-center min-h-[180px]">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[12px] font-semibold text-[#404849] truncate">{s.label}</span>
            </div>
            <span className="text-[12px] font-bold text-[#181C1E]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
