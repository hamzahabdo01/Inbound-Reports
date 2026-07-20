import { useState } from 'react';
import { getChartColor } from '../../utils/chartUtils';

// Y-axis grid lines config
const Y_TICKS = [0, 20, 40, 60, 80, 100];
const CHART_LEFT_OFFSET = 44;

function ProgramStackedBarChart({ data = [], height = 220, normalized = false, yLabel, yTicks, showPct = true, horizontal = false }: any) {
  const ticks = yTicks || Y_TICKS;
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-on-surface-variant text-body-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const labels: string[] = [...new Set<string>(data.flatMap((item: any) => item.segments.map((seg: any) => seg.label)))];

  if (horizontal) {
    const toggleTooltip = (item) => {
      if (selectedBar === item.label) {
        setSelectedBar(null);
      } else {
        setSelectedBar(item.label);
      }
    };
    return (
      <div className="px-4 py-3 select-none">
        {data.map((item) => {
          const total = item.segments.reduce((sum, s) => sum + s.value, 0);
          const isOpen = selectedBar === item.label;
          return (
            <div key={item.label} className="relative">
              <div
                className="flex items-center gap-2 py-1.5 cursor-pointer"
                onClick={() => toggleTooltip(item)}
              >
                <span className="text-[11px] font-semibold text-on-surface-variant w-20 shrink-0 truncate" title={item.label}>{item.label}</span>
              <div className="flex-1 h-4 rounded-sm overflow-hidden flex bg-surface-container-low">
                {item.segments.map((seg, i) => {
                  const pct = total > 0 ? (seg.value / total) * 100 : 0;
                  return pct > 0 ? (
                    <div
                      key={seg.label}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: seg.color || getChartColor(labels.indexOf(seg.label)),
                      }}
                    />
                  ) : null;
                })}
              </div>
              </div>
              {isOpen && (
                <div className="bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs mb-2 mx-1">
                  <div className="font-bold text-on-surface text-[13px] mb-2">{item.label}</div>
                  {item.segments.map((seg) => {
                    const segPct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0';
                    const color = seg.color || getChartColor(labels.indexOf(seg.label));
                    return (
                      <div key={seg.label} className="flex items-center gap-1.5 mt-1.5 first:mt-0">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-on-surface-variant">{seg.label}:</span>
                        <span className="tabular-nums text-on-surface">{seg.value.toLocaleString()}</span>
                        {showPct && segPct !== '0' && <span className="text-on-surface-variant/60">({segPct}%)</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
          {labels.map((label, index) => {
            const firstItemWithSeg = data.find((item) => item.segments.some((s) => s.label === label));
            const segColor = firstItemWithSeg?.segments.find((s) => s.label === label)?.color;
            return (
              <span key={label} className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: segColor || getChartColor(index) }} />
                {label}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  const BAR_MAX_W = 64;
  const BAR_GAP = 6;
  const barsMaxWidth = Math.min(data.length * BAR_MAX_W + (data.length - 1) * BAR_GAP, 9999);

  // For absolute mode: find max total to scale bars
  const totals = data.map((item) => item.segments.reduce((sum, s) => sum + s.value, 0));
  const absMax = Math.max(...totals, 1);

  const barMax = yTicks ? ticks[ticks.length - 1] : absMax;

  const handleBarEnter = (item, e) => {
    const total = item.segments.reduce((sum, s) => sum + s.value, 0);
    setHoveredBar(item.label);
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      barLabel: item.label,
      segments: item.segments.map((s) => ({
        ...s,
        pct: total > 0 ? ((s.value / total) * 100).toFixed(1) : '0',
      })),
    });
  };

  const handleBarMove = (e) => {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
  };

  const handleBarLeave = () => {
    setHoveredBar(null);
    setTooltip(null);
  };

  return (
    <div className="px-4 pt-3 pb-2 select-none">
      <div className="flex gap-0" style={{ position: 'relative' }}>
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
              {normalized ? `${tick}%` : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 0 }).format(tick)}
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
              const barHeightPct = normalized ? 100 : Math.min((total / barMax) * 100, 100);
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
                      onMouseMove={handleBarMove}
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
              className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs"
              style={{ left: tooltip.x + 12, top: tooltip.y - 10, minWidth: 200 }}
            >
              <div className="font-bold text-on-surface text-[13px] mb-2 truncate max-w-[220px]">{tooltip.barLabel}</div>
              {tooltip.segments.map((seg) => {
                const color = seg.color || getChartColor(labels.indexOf(seg.label));
                return (
                  <div key={seg.label} className="flex items-center gap-1.5 mt-1.5 first:mt-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-on-surface-variant">{seg.label}:</span>
                    <span className="tabular-nums text-on-surface">{seg.value.toLocaleString()}</span>
                    {showPct && seg.pct !== '0' && <span className="text-on-surface-variant/60">({seg.pct}%)</span>}
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
