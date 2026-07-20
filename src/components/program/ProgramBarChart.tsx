import { useState } from 'react';

const CHART_LEFT = 44;
const CHART_HEIGHT = 256;

function ProgramBarChart({ data, valueFormatter = (value) => value, titleFormatter, yTicks }: any) {
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const hasAxis = !!yTicks;

  const yMin = hasAxis ? yTicks[0] : 0;
  const yMax = hasAxis ? yTicks[yTicks.length - 1] : Math.max(...data.map((item) => item.value), 1);
  const range = yMax - yMin || 1;
  const zeroPct = hasAxis ? ((0 - yMin) / range) * 100 : 0;

  const BAR_MAX_W = 64;
  const BAR_GAP = 12;
  const barsMaxWidth = Math.min(data.length * BAR_MAX_W + (data.length - 1) * BAR_GAP, 9999);
  const formatTitle = titleFormatter || ((item) => valueFormatter(item.value));

  const handleBarEnter = (item, e) => {
    setHoveredLabel(item.label);
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      label: item.label,
      value: formatTitle(item),
    });
  };

  const handleBarMove = (e) => {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
  };

  const handleBarLeave = () => {
    setHoveredLabel(null);
    setTooltip(null);
  };

  if (hasAxis) {
    return (
      <div className="px-4 pt-3 pb-2 select-none">
        <div className="flex gap-0" style={{ position: 'relative' }}>
          <div className="flex flex-col justify-between shrink-0 pr-2 pb-6" style={{ width: CHART_LEFT }}>
            {[...yTicks].reverse().map((tick) => (
              <span key={tick} className="text-[10px] font-semibold text-on-surface-variant text-right block leading-none">
                {tick.toFixed(1)}
              </span>
            ))}
          </div>
          <div className="flex-1 relative" style={{ height: CHART_HEIGHT + 24 }}>
            {yTicks.map((tick) => {
              const pct = ((tick - yMin) / range) * 100;
              return (
                <div
                  key={tick}
                  className="absolute left-0 right-0 border-t"
                  style={{
                    bottom: `calc(24px + ${pct}%)`,
                    borderColor: tick === 0 ? '#CFD8DC' : '#EAEEF0',
                    borderWidth: '1px',
                  }}
                />
              );
            })}
            <div className="absolute left-0 right-0 bottom-6" style={{ height: CHART_HEIGHT }}>
              <div className="flex items-end justify-center gap-3 h-full" style={{ maxWidth: barsMaxWidth, margin: '0 auto' }}>
                {data.map((item) => {
                  const valuePct = ((Math.min(Math.max(item.value, yMin), yMax) - yMin) / range) * 100;
                  const bottomPct = Math.min(valuePct, zeroPct);
                  const heightPct = Math.abs(valuePct - zeroPct);
                  const isHovered = hoveredLabel === item.label;
                  return (
                    <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end relative">
                      <div className="w-full relative" style={{ height: '100%' }}>
                        <div
                          className="w-full absolute rounded-t rounded-b transition-all duration-300 cursor-pointer"
                          style={{
                            left: 0,
                            bottom: `${bottomPct}%`,
                            height: `${Math.max(heightPct, heightPct > 0 ? 2 : 0)}%`,
                            backgroundColor: item.color || '#0B4F54',
                            opacity: hoveredLabel && !isHovered ? 0.55 : 1,
                          }}
                        />
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
            </div>
            <div className="absolute left-0 right-0 bottom-0 flex gap-3" style={{ height: 24, maxWidth: barsMaxWidth, margin: '0 auto' }}>
              {data.map((item) => (
                <div key={item.label} className="flex-1 min-w-0 flex items-end justify-center" style={{ height: 24 }}>
                  <p className="text-[9px] font-semibold text-on-surface-variant truncate w-full text-center leading-tight" title={item.label}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            {tooltip && (
              <div
                className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs"
                style={{ left: tooltip.x + 12, top: tooltip.y - 10, minWidth: 180 }}
              >
                <div className="font-bold text-on-surface text-[13px] truncate max-w-[220px]">{tooltip.label}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: '#0B4F54' }} />
                  <span className="tabular-nums text-on-surface">{tooltip.value}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="h-64 flex items-end gap-3 px-2 pt-4 pb-2" style={{ maxWidth: barsMaxWidth, margin: '0 auto' }}>
      {data.map((item) => (
        <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center gap-2">
          <div className="w-full h-44 flex items-end justify-center rounded bg-surface-container-low overflow-hidden relative">
            <div
              className="w-full rounded-t bg-primary transition-all duration-300 cursor-pointer"
              style={{
                height: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%`,
                backgroundColor: item.color || '#0B4F54',
                opacity: hoveredLabel && hoveredLabel !== item.label ? 0.55 : 1,
              }}
            />
            <div
              className="absolute inset-0 cursor-pointer"
              onMouseEnter={(e) => handleBarEnter(item, e)}
              onMouseMove={handleBarMove}
              onMouseLeave={handleBarLeave}
            />
          </div>
          <p className="text-[11px] font-bold text-on-surface truncate w-full text-center">{valueFormatter(item.value)}</p>
          <p className="text-[10px] text-on-surface-variant truncate w-full text-center" title={item.label}>{item.label}</p>
        </div>
      ))}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, minWidth: 180 }}
        >
          <div className="font-bold text-on-surface text-[13px] truncate max-w-[220px]">{tooltip.label}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: '#0B4F54' }} />
            <span className="tabular-nums text-on-surface">{tooltip.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramBarChart;
