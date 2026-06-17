import { useState } from 'react';

const palette = ['#4A9598', '#216E6A', '#86BFC5', '#D97706', '#515F74', '#0B4F54', '#059669', '#00373B'];

// Y-axis grid lines config
const Y_TICKS = [0, 20, 40, 60, 80, 100];
const CHART_LEFT_OFFSET = 44; // px reserved for Y-axis labels

/**
 * ProgramStackedBarChart
 *
 * Props:
 *  - data: Array<{ label: string, segments: Array<{ label: string, value: number }> }>
 *  - height: number (default 220) — chart body height in px
 *  - normalized: boolean (default false) — when true, renders a 100% normalized stacked bar
 *    with Y-axis labeled 0–100%. When false, renders absolute values.
 *  - yLabel: string — optional Y-axis label
 */
function ProgramStackedBarChart({ data = [], height = 220, normalized = false, yLabel }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-on-surface-variant text-body-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const labels = [...new Set(data.flatMap((item) => item.segments.map((seg) => seg.label)))];

  // For absolute mode: find max total to scale bars
  const totals = data.map((item) => item.segments.reduce((sum, s) => sum + s.value, 0));
  const absMax = Math.max(...totals, 1);

  const handleMouseEnter = (barLabel, segLabel, value, total, e) => {
    setHoveredBar(barLabel);
    setHoveredSeg(segLabel);
    const rect = e.currentTarget.closest('[data-chart-root]').getBoundingClientRect();
    const segRect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: segRect.left - rect.left + segRect.width / 2,
      y: segRect.top - rect.top,
      barLabel,
      segLabel,
      value,
      pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
    });
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    setHoveredSeg(null);
    setTooltip(null);
  };

  return (
    <div className="px-4 pt-3 pb-2 select-none">
      <div className="flex gap-0" data-chart-root style={{ position: 'relative' }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between shrink-0 pr-2 pb-6" style={{ width: CHART_LEFT_OFFSET }}>
          {/* optional rotated label */}
          {yLabel && (
            <div
              className="absolute text-[10px] font-bold text-on-surface-variant"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', left: 0, top: '30%' }}
            >
              {yLabel}
            </div>
          )}
          {[...Y_TICKS].reverse().map((tick) => (
            <span key={tick} className="text-[10px] font-semibold text-on-surface-variant text-right block leading-none">
              {tick}%
            </span>
          ))}
        </div>

        {/* Chart body */}
        <div className="flex-1 relative" style={{ height: height + 24 }}>
          {/* Grid lines */}
          {Y_TICKS.map((tick) => (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t"
              style={{
                bottom: `calc(24px + ${tick}%)`,
                borderColor: tick === 0 ? '#CFD8DC' : '#EAEEF0',
                borderWidth: tick === 0 ? '1px' : '1px',
              }}
            />
          ))}

          {/* Bars row */}
          <div className="absolute left-0 right-0 bottom-6 flex items-end gap-1.5" style={{ height }}>
            {data.map((item) => {
              const total = item.segments.reduce((sum, s) => sum + s.value, 0);
              const barHeightPct = normalized ? 100 : (total / absMax) * 100;
              const isHovered = hoveredBar === item.label;

              return (
                <div
                  key={item.label}
                  className="flex-1 min-w-0 flex flex-col items-center"
                  style={{ height: '100%' }}
                >
                  {/* Bar stack */}
                  <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                    <div
                      className="w-full flex flex-col-reverse overflow-hidden rounded-sm transition-all duration-300"
                      style={{
                        height: `${Math.max(barHeightPct, total > 0 ? 2 : 0)}%`,
                        opacity: hoveredBar && !isHovered ? 0.55 : 1,
                      }}
                    >
                      {item.segments.map((seg, idx) => {
                        const segPct = total > 0 ? (seg.value / total) * 100 : 0;
                        const isSegHovered = isHovered && hoveredSeg === seg.label;
                        return (
                          <div
                            key={seg.label}
                            style={{
                              height: `${segPct}%`,
                              backgroundColor: palette[labels.indexOf(seg.label) % palette.length],
                              minHeight: segPct > 0 ? 2 : 0,
                              filter: isSegHovered ? 'brightness(1.15)' : undefined,
                              cursor: 'default',
                            }}
                            title={`${item.label} / ${seg.label}: ${seg.value}`}
                            onMouseEnter={(e) => handleMouseEnter(item.label, seg.label, seg.value, total, e)}
                            onMouseLeave={handleMouseLeave}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-0 flex gap-1.5" style={{ height: 24 }}>
            {data.map((item) => (
              <div
                key={item.label}
                className="flex-1 min-w-0 flex items-end justify-center"
                style={{ height: 24 }}
              >
                <p
                  className="text-[9px] font-semibold text-on-surface-variant truncate w-full text-center leading-tight"
                  title={item.label}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none bg-[#00373B] text-white rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap"
              style={{
                left: Math.min(Math.max(tooltip.x - 60, 0), 9999),
                top: Math.max(tooltip.y - 72, 0),
                minWidth: 140,
              }}
            >
              <div className="font-bold text-[#86BFC5] mb-1 truncate max-w-[180px]">{tooltip.barLabel}</div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: palette[labels.indexOf(tooltip.segLabel) % palette.length] }}
                />
                <span className="font-semibold">{tooltip.segLabel}:</span>
                <span>{tooltip.value.toLocaleString()}</span>
                <span className="text-white/60">({tooltip.pct}%)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-3">
        {labels.map((label, index) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: palette[index % palette.length] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProgramStackedBarChart;
