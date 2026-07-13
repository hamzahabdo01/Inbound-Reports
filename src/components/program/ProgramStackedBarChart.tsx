import { useState, useRef } from 'react';
import { getChartColor } from '../../utils/chartUtils';

// Y-axis grid lines config
const Y_TICKS = [0, 20, 40, 60, 80, 100];
const CHART_LEFT_OFFSET = 44;

function ProgramStackedBarChart({ data = [], height = 220, normalized = false, yLabel, yTicks }: any) {
  const ticks = yTicks || Y_TICKS;
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const rootRef = useRef(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-on-surface-variant text-body-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const labels: string[] = [...new Set<string>(data.flatMap((item: any) => item.segments.map((seg: any) => seg.label)))];

  const BAR_MAX_W = 64;
  const BAR_GAP = 6;
  const barsMaxWidth = Math.min(data.length * BAR_MAX_W + (data.length - 1) * BAR_GAP, 9999);

  // For absolute mode: find max total to scale bars
  const totals = data.map((item) => item.segments.reduce((sum, s) => sum + s.value, 0));
  const absMax = Math.max(...totals, 1);

  const handleBarEnter = (item, e) => {
    const total = item.segments.reduce((sum, s) => sum + s.value, 0);
    setHoveredBar(item.label);
    const rect = rootRef.current?.getBoundingClientRect();
    const barRect = e.currentTarget.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: barRect.left - rect.left + barRect.width / 2,
        y: barRect.top - rect.top,
        barLabel: item.label,
        segments: item.segments.map((s) => ({
          ...s,
          pct: total > 0 ? ((s.value / total) * 100).toFixed(1) : '0',
        })),
      });
    }
  };

  const handleBarLeave = () => {
    setHoveredBar(null);
    setTooltip(null);
  };

  return (
    <div className="px-4 pt-3 pb-2 select-none">
      <div className="flex gap-0" data-chart-root ref={rootRef} style={{ position: 'relative' }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between shrink-0 pr-2 pb-6" style={{ width: CHART_LEFT_OFFSET }}>
          {yLabel && (
            <div
              className="absolute text-[10px] font-bold text-on-surface-variant"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', left: 0, top: '30%' }}
            >
              {yLabel}
            </div>
          )}
          {[...ticks].reverse().map((tick) => (
            <span key={tick} className="text-[10px] font-semibold text-on-surface-variant text-right block leading-none">
              {tick}%
            </span>
          ))}
        </div>

        {/* Chart body */}
        <div className="flex-1 relative" style={{ height: height + 24 }}>
          {/* Grid lines */}
          {ticks.map((tick) => {
            const tickMax = ticks[ticks.length - 1] || 100;
            const pct = (tick / tickMax) * 100;
            return (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t"
              style={{
                bottom: `calc(24px + ${pct}%)`,
                borderColor: tick === 0 ? '#CFD8DC' : '#EAEEF0',
                borderWidth: tick === 0 ? '1px' : '1px',
              }}
            />
            );
          })}

          {/* Bars row */}
          <div className="absolute left-0 right-0 bottom-6 flex items-end gap-1.5" style={{ height, maxWidth: barsMaxWidth, margin: '0 auto' }}>
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
                  <div className="w-full flex flex-col justify-end relative" style={{ height: '100%' }}>
                    <div
                      className="w-full flex flex-col-reverse overflow-hidden rounded-sm transition-all duration-300"
                      style={{
                        height: `${Math.max(barHeightPct, total > 0 ? 2 : 0)}%`,
                        opacity: hoveredBar && !isHovered ? 0.55 : 1,
                      }}
                    >
                      {item.segments.map((seg, idx) => {
                        const segPct = total > 0 ? (seg.value / total) * 100 : 0;
                        return (
                          <div
                            key={seg.label}
                            style={{
                              height: `${segPct}%`,
                              backgroundColor: seg.color || getChartColor(labels.indexOf(seg.label)),
                              minHeight: segPct > 0 ? 2 : 0,
                            }}
                          />
                        );
                      })}
                    </div>
                    {/* Full-bar invisible hover zone */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      style={{ bottom: 0 }}
                      onMouseEnter={(e) => handleBarEnter(item, e)}
                      onMouseLeave={handleBarLeave}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-0 flex gap-1.5" style={{ height: 24, maxWidth: barsMaxWidth, margin: '0 auto' }}>
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
              className="absolute z-50 pointer-events-none bg-[#00373B] text-white rounded-lg shadow-lg px-3 py-2 text-xs"
              style={{
                left: Math.min(Math.max(tooltip.x - 80, 0), 9999),
                top: Math.max(tooltip.y - 80, 0),
                minWidth: 180,
              }}
            >
              <div className="font-bold text-[#86BFC5] mb-1.5 truncate max-w-[200px]">{tooltip.barLabel}</div>
              {tooltip.segments.map((seg) => {
                const color = seg.color || getChartColor(labels.indexOf(seg.label));
                return (
                  <div key={seg.label} className="flex items-center gap-1.5 mt-1 first:mt-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold">{seg.label}:</span>
                    <span>{seg.value.toLocaleString()}</span>
                    <span className="text-white/60">({seg.pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-3">
        {labels.map((label, index) => {
          const firstItemWithSeg = data.find((item) => item.segments.some((s) => s.label === label));
          const segColor = firstItemWithSeg?.segments.find((s) => s.label === label)?.color;
          const color = segColor || getChartColor(index);
          return (
            <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default ProgramStackedBarChart;
