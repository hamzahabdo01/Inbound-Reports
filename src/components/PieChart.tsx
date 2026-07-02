import { useEffect, useMemo, useRef, useState } from 'react';

const palette = ['#00373B', '#D97706', '#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74', '#059669'];

const polarToCartesian = (cx, cy, r, angle) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

const describeSlice = (cx, cy, r, startAngle, endAngle, offset = 0) => {
  const midAngle = (startAngle + endAngle) / 2;
  const offsetPoint = polarToCartesian(0, 0, offset, midAngle);
  const centerX = cx + offsetPoint.x;
  const centerY = cy + offsetPoint.y;
  const start = polarToCartesian(centerX, centerY, r, startAngle);
  const end = polarToCartesian(centerX, centerY, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const formatValue = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return new Intl.NumberFormat('en').format(value);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function PieChart({ data, totalLabel, showCenterLabel = true, legendPosition = 'bottom' }: any) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(420);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const updateSize = ([entry]) => {
      setContainerWidth(entry.contentRect.width || 420);
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const slices = useMemo(() => {
    let cursor = -Math.PI / 2;
    return data.map((item, index) => {
      const value = Number(item.value) || 0;
      const angle = total > 0 ? (value / total) * Math.PI * 2 : 0;
      const slice = {
        ...item,
        value,
        index,
        color: item.color || palette[index % palette.length],
        startAngle: cursor,
        endAngle: cursor + angle,
        percent: total > 0 ? (value / total) * 100 : 0,
      };
      cursor += angle;
      return slice;
    }).filter((item) => item.value > 0);
  }, [data, total]);

  if (!total || slices.length === 0) {
    return <div className="p-5 text-body-sm text-on-surface-variant">No data available</div>;
  }

  const activeIndex = hoveredIndex;
  const active = activeIndex !== null ? slices[activeIndex] : null;
  const chartWidth = Math.max(240, containerWidth);
  const isCompact = chartWidth < 500;
  const legendLeft = legendPosition === 'left' && !isCompact;
  const viewWidth = isCompact ? 320 : Math.min(Math.round(chartWidth * 0.48), 360);
  const viewHeight = Math.round(viewWidth * 0.55);
  const cx = viewWidth / 2;
  const cy = viewHeight * 0.5;
  const r = viewWidth * 0.22;
  const labelRadius = r + (isCompact ? 26 : Math.round(viewWidth * 0.09));
  const activeMidAngle = active ? (active.startAngle + active.endAngle) / 2 : 0;
  const activeLabelPoint = active ? polarToCartesian(cx, cy, labelRadius, activeMidAngle) : null;
  const activeLabelLeft = activeLabelPoint ? clamp((activeLabelPoint.x / viewWidth) * 100, isCompact ? 32 : 28, isCompact ? 68 : 72) : 50;
  const activeLabelTop = activeLabelPoint ? clamp((activeLabelPoint.y / viewHeight) * 100, 12, 88) : 50;

  return (
    <div ref={containerRef} className="w-full">
        <div className={legendLeft ? 'flex h-full items-center gap-3' : ''}>
        {legendLeft && (
          <div className="w-[260px] shrink-0 space-y-2">
            {slices.map((slice, index) => (
              <button
                key={slice.label}
                type="button"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              >
                <span className="h-3 w-3 shrink-0 rounded" style={{ backgroundColor: slice.color }} />
                <span className="min-w-0 flex-1 leading-snug">{slice.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative mx-auto w-full" style={{ maxWidth: legendLeft ? Math.min(chartWidth - 260, viewWidth) : chartWidth }}>
          <svg className="w-full h-auto" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={totalLabel || 'Pie chart'}>
            {slices.map((slice, index) => {
              const activeSlice = index === activeIndex;
              const path = describeSlice(cx, cy, r, slice.startAngle, slice.endAngle, activeSlice ? (isCompact ? 5 : 7) : 2);
              return (
                <path
                  key={slice.label}
                  d={path}
                  fill={slice.color}
                  stroke="#ffffff"
                  strokeWidth="4"
                  className="cursor-pointer transition-opacity duration-200"
                  opacity={hoveredIndex === null || activeSlice ? 0.95 : 0.42}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {showCenterLabel && active && activeLabelPoint && (
            <div
              className="absolute rounded-lg border border-outline-variant bg-white text-left shadow-[0px_4px_20px_rgba(10,50,53,0.06)] pointer-events-none"
              style={{
                left: `${activeLabelLeft}%`,
                top: `${activeLabelTop}%`,
                transform: 'translate(-50%, -50%)',
                padding: isCompact ? '8px 10px' : '12px 16px',
                width: 'max-content',
                maxWidth: isCompact ? '180px' : '240px',
              }}
            >
              <p className={`${isCompact ? 'text-[12px]' : 'text-body-md'} font-semibold leading-snug whitespace-normal break-words`} style={{ color: active.color }}>
                {active.label}: {formatValue(active.value)}
              </p>
              <p className="mt-1 text-[11px] font-bold text-on-surface-variant">
                {active.percent.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {!legendLeft && (
        <div className={`flex flex-wrap items-center justify-center ${isCompact ? 'gap-x-3 gap-y-1.5' : 'gap-x-5 gap-y-1'}`}>
          {slices.map((slice, index) => (
            <button
              key={slice.label}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`inline-flex items-center gap-2 ${isCompact ? 'text-[11px]' : 'text-body-sm'} text-on-surface-variant hover:text-on-surface`}
            >
              <span className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} rounded`} style={{ backgroundColor: slice.color }} />
              <span>{slice.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
