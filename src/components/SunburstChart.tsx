import { useMemo, useState } from 'react';

const colors = ['#00373B', '#D97706', '#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74', '#059669', '#BA1A1A', '#4A8EA5'];

function polarToCartesian(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function describeArc(cx, cy, innerR, outerR, startAngle, endAngle) {
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function formatAmount(v) {
  if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

export default function SunburstChart({ data = [] }: any) {
  const [hovered, setHovered] = useState(null);

  const { arcs, total } = useMemo(() => {
    const totalValue = data.reduce((s, d) => s + d.value, 0);
    const result = [];
    let cursor = -Math.PI / 2;

    data.forEach((item, idx) => {
      const angle = totalValue > 0 ? (item.value / totalValue) * Math.PI * 2 : 0;
      const innerR = 50;
      const outerR = 90;
      const color = colors[idx % colors.length];

      result.push({
        key: `parent-${idx}`,
        label: item.name,
        value: item.value,
        percent: (item.value / totalValue) * 100,
        isParent: true,
        color,
        path: describeArc(180, 140, innerR, outerR, cursor, cursor + angle),
        startAngle: cursor,
        endAngle: cursor + angle,
      });

      if (item.children) {
        const childTotal = item.children.reduce((s, c) => s + c.value, 0);
        let childCursor = cursor;
        item.children.forEach((child, cIdx) => {
          const childAngle = childTotal > 0 ? (child.value / childTotal) * angle : 0;
          const childInnerR = 90;
          const childOuterR = 125;
          const childColor = colors[(idx * 3 + cIdx) % colors.length];
          result.push({
            key: `child-${idx}-${cIdx}`,
            label: child.name,
            value: child.value,
            percent: (child.value / totalValue) * 100,
            isParent: false,
            parentLabel: item.name,
            color: childColor,
            path: describeArc(180, 140, childInnerR, childOuterR, childCursor, childCursor + childAngle),
            startAngle: childCursor,
            endAngle: childCursor + childAngle,
          });
          childCursor += childAngle;
        });
      }

      cursor += angle;
    });

    return { arcs: result, total: totalValue };
  }, [data]);

  if (!data.length) {
    return <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>;
  }

  const active = hovered !== null ? arcs[hovered] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="360" height="280" viewBox="0 0 360 280" role="img" aria-label="Funding source sunburst chart">
          {arcs.map((arc, idx) => (
            <path
              key={arc.key}
              d={arc.path}
              fill={arc.color}
              stroke="#ffffff"
              strokeWidth="2"
              className="transition-opacity duration-200 cursor-pointer"
              opacity={hovered === null || hovered === idx || (active && !arc.isParent && arc.parentLabel === active.parentLabel) ? 0.92 : 0.3}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <text x="180" y="138" textAnchor="middle" fontSize="15" fontWeight="800" fill="#181C1E">Total</text>
          <text x="180" y="156" textAnchor="middle" fontSize="13" fontWeight="600" fill="#404849">{formatAmount(total)}</text>
        </svg>

        {active && (
          <div
            className="absolute pointer-events-none bg-white border border-outline-variant rounded-xl px-3 py-2 shadow-[0px_4px_20px_rgba(10,50,53,0.06)]"
            style={{
              left: '50%',
              top: '8px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-xs font-bold text-on-surface">{active.label}</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {formatAmount(active.value)} ({active.percent.toFixed(1)}%)
            </p>
            {active.parentLabel && (
              <p className="text-[10px] text-on-surface-variant/70 mt-0.5">Under: {active.parentLabel}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
