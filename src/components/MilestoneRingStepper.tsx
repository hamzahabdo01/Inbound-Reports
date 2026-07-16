import { useEffect, useRef, useState } from 'react';
import { GaugeCircle } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface Milestone {
  key: string;
  label: string;
  icon: string;
  count: number;
  percent: number;
  hasData: boolean;
}

interface MilestoneRingStepperProps {
  milestones: Milestone[];
  onMilestoneClick?: (key: string) => void;
  connectorAverages?: (number | null)[];
  connectorTargets?: number[];
}

const fmtDuration = (days: number | null | undefined) => {
  if (days == null || days < 0) return null;
  return `${days}d`;
};

type ColorToken = 'error' | 'warning' | 'success' | 'track';

const MANUAL_TOKENS: Record<number, ColorToken> = {
  0: 'track',
  1: 'track',
  2: 'track',
  3: 'success',
  4: 'warning',
  5: 'error',
  7: 'success',
  8: 'success',
};

const TOKEN_TAILWIND_MAP: Record<ColorToken, { bg: string; stroke: string; fill: string }> = {
  error: { bg: 'bg-error', stroke: 'stroke-error', fill: 'fill-error' },
  warning: { bg: 'bg-warning', stroke: 'stroke-warning', fill: 'fill-warning' },
  success: { bg: 'bg-success', stroke: 'stroke-success', fill: 'fill-success' },
  track: { bg: 'bg-outline-variant', stroke: 'stroke-outline-variant', fill: 'fill-outline-variant' },
};

function getConnectorToken(avg: number | null, target: number | null): ColorToken {
  if (avg == null || target == null || target <= 0) return 'success';
  const diffPct = ((avg - target) / target) * 100;
  if (diffPct > 40) return 'error';
  if (diffPct > 0) return 'warning';
  return 'success';
}

function getMilestoneToken(idx: number, connectorAverages: (number | null)[], connectorTargets?: number[]): ColorToken {
  if (MANUAL_TOKENS[idx] !== undefined) return MANUAL_TOKENS[idx];
  if (idx === 0) return 'success';
  const avg = connectorAverages[idx - 1];
  const target = connectorTargets?.[idx - 1] ?? null;
  return getConnectorToken(avg, target);
}

function MilestoneRingStepper({ milestones, onMilestoneClick, connectorAverages, connectorTargets }: MilestoneRingStepperProps) {
  const [tooltip, setTooltip] = useState<{ data: Milestone; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ x: number; yTop: number; yBot: number }[]>([]);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [slideIdx, setSlideIdx] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (!containerRef.current || isMobile) { setLayout([]); return; }
    const update = () => {
      const cols = containerRef.current?.querySelectorAll<HTMLDivElement>('[data-zigzag-col]');
      if (!cols) return;
      const parentRect = containerRef.current!.getBoundingClientRect();
      const points: { x: number; yTop: number; yBot: number }[] = [];
      cols.forEach((el) => {
        const rect = el.getBoundingClientRect();
        points.push({
          x: rect.left + rect.width / 2 - parentRect.left,
          yTop: rect.top - parentRect.top,
          yBot: rect.top + rect.height - parentRect.top,
        });
      });
      setLayout(points);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [milestones, isMobile]);

  const renderMilestone = (m: Milestone, idx: number) => {
    const token = getMilestoneToken(idx, connectorAverages ?? [], connectorTargets);
    const { bg } = TOKEN_TAILWIND_MAP[token];
    const iconTextCls = m.hasData ? 'text-primary' : 'text-on-surface-variant/40';
    return (
      <div key={m.key} className="relative z-10 flex flex-col items-center shrink-0">
        <button
          type="button"
          onClick={() => onMilestoneClick?.(m.key)}
          onMouseEnter={(e) => setTooltip({ data: m, x: e.clientX, y: e.clientY })}
          onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
          onMouseLeave={() => setTooltip(null)}
          onFocus={() => {
            const rect = document.getElementById(`ring-${m.key}`)?.getBoundingClientRect();
            if (rect) setTooltip({ data: m, x: rect.left + rect.width / 2, y: rect.top });
          }}
          onBlur={() => setTooltip(null)}
          className="flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
          aria-label={`${m.label}: ${m.hasData ? `${m.count} POs` : 'No data yet'}`}
        >
          <div
            id={`ring-${m.key}`}
            className={`relative rounded-full transition-all duration-200 hover:scale-105 focus-visible:scale-105 ${
              !m.hasData ? 'border-[0.5px] border-dashed border-outline-variant' : bg
            }`}
            style={{
              width: 120,
              height: 120,
              background: m.hasData ? undefined : 'transparent',
            }}
          >
            <div className="absolute inset-[8px] rounded-full bg-white flex flex-col items-center justify-center overflow-hidden">
              <i className={`fa-solid ${m.icon} text-[28px] ${iconTextCls}`} />
              <span className={`text-[16px] font-semibold leading-tight text-center px-1 mt-0.5 ${iconTextCls}`}>
                {m.label}
              </span>
            </div>
          </div>
        </button>
      </div>
    );
  };

  if (!milestones.length) return null;

  if (isMobile) {
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
    const handleTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
    const handleTouchEnd = () => {
      if (Math.abs(touchDeltaX.current) > 50) {
        if (touchDeltaX.current < 0 && slideIdx < milestones.length - 1) setSlideIdx(i => i + 1);
        else if (touchDeltaX.current > 0 && slideIdx > 0) setSlideIdx(i => i - 1);
      }
    };
    return (
      <div className="py-5">
        <div className="overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${slideIdx * 100}%)` }}>
            {milestones.map((m, idx) => {
              const token = getMilestoneToken(idx, connectorAverages ?? [], connectorTargets);
              const { fill: fillCls } = TOKEN_TAILWIND_MAP[token];
              const avg = connectorAverages?.[idx - 1] ?? null;
              const target = connectorTargets?.[idx - 1] ?? null;
              const avgStr = fmtDuration(avg);
              const targetStr = fmtDuration(target);
              return (
                <div key={m.key} className="w-full shrink-0 flex flex-col items-center gap-4 px-4">
                  {renderMilestone(m, idx)}
                  {idx > 0 && (targetStr || avgStr) && (
                    <div className="flex items-center gap-4 text-[11px] font-semibold">
                      {targetStr && (
                        <span className="flex items-center gap-1 text-on-surface">
                          <i className="fa-solid fa-bullseye text-[11px]" /> {targetStr}
                        </span>
                      )}
                      {avgStr && (
                        <span className={`flex items-center gap-1 ${fillCls.replace('fill-', 'text-')}`}>
                          <GaugeCircle size={13} className="inline-block shrink-0" strokeWidth={1.2} /> {avgStr}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button type="button" onClick={() => setSlideIdx(i => Math.max(i - 1, 0))} disabled={slideIdx === 0}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center disabled:bg-outline-variant disabled:text-on-surface-variant/40 transition-colors"
          ><i className="fa-solid fa-chevron-left text-[9px]" /></button>
          <div className="flex items-center gap-1.5">
            {milestones.map((_, i) => (
              <button key={i} type="button" onClick={() => setSlideIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === slideIdx ? 'bg-primary w-5' : 'bg-outline-variant w-2 hover:bg-outline'}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => setSlideIdx(i => Math.min(i + 1, milestones.length - 1))} disabled={slideIdx === milestones.length - 1}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center disabled:bg-outline-variant disabled:text-on-surface-variant/40 transition-colors"
          ><i className="fa-solid fa-chevron-right text-[9px]" /></button>
        </div>
      </div>
    );
  }

  const labelOffX = (x1: number, y1: number, x2: number, y2: number, dist: number): [number, number] => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return [-dy / len * dist, dx / len * dist];
  };

  return (
    <div className="relative">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ overflow: 'visible' }}
      >
        {layout.map((p, i) => {
          if (i >= milestones.length - 1) return null;
          const x1 = p.x;
          const y1 = (p.yTop + p.yBot) / 2;
          const x2 = layout[i + 1].x;
          const y2 = (layout[i + 1].yTop + layout[i + 1].yBot) / 2;
          const token = getConnectorToken(connectorAverages?.[i] ?? null, connectorTargets?.[i] ?? null);
          const strokeCls = TOKEN_TAILWIND_MAP[token].stroke;
          const fillCls = TOKEN_TAILWIND_MAP[token].fill;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const [nx, ny] = labelOffX(x1, y1, x2, y2, 12);
          const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
          const avg = connectorAverages?.[i] ?? null;
          const target = connectorTargets?.[i] ?? null;
          const avgStr = fmtDuration(avg);
          const targetStr = fmtDuration(target);
          return (
            <g key={`conn-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={strokeCls} strokeWidth={2} />
              {!targetStr && !avgStr ? (
                <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX}, ${midY})`} className="text-[13px] font-semibold fill-on-surface-variant/50" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  No data
                </text>
              ) : (
                <>
                  {targetStr ? (
                    <foreignObject x={midX + nx - 26} y={midY + ny - 8} width={52} height={16} transform={`rotate(${angle}, ${midX + nx}, ${midY + ny})`}>
                      <div className="flex items-center justify-center gap-0.5 text-[13px] font-semibold text-on-surface whitespace-nowrap" style={{ textShadow: '-0.5px -0.5px 0 #fff, 0.5px -0.5px 0 #fff, -0.5px 0.5px 0 #fff, 0.5px 0.5px 0 #fff' }}>
                        <i className="fa-solid fa-bullseye text-[13px]" />
                        <span>{targetStr}</span>
                      </div>
                    </foreignObject>
                  ) : (
                    <text x={midX + nx} y={midY + ny} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX + nx}, ${midY + ny})`} className="text-[13px] font-semibold fill-on-surface-variant/50" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      No data
                    </text>
                  )}
                  {avgStr ? (
                    <foreignObject x={midX - nx - 26} y={midY - ny - 8} width={52} height={16} transform={`rotate(${angle}, ${midX - nx}, ${midY - ny})`}>
                      <div className={`flex items-center justify-center gap-0.5 text-[13px] font-semibold whitespace-nowrap ${fillCls.replace('fill-', 'text-')}`} style={{ textShadow: '-0.5px -0.5px 0 #fff, 0.5px -0.5px 0 #fff, -0.5px 0.5px 0 #fff, 0.5px 0.5px 0 #fff' }}>
<GaugeCircle size={13} className="inline-block shrink-0" strokeWidth={1.2} /><span>{avgStr}</span>
                      </div>
                    </foreignObject>
                  ) : (
                    <text x={midX - nx} y={midY - ny} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX - nx}, ${midY - ny})`} className="text-[13px] font-semibold fill-on-surface-variant/50" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      No data
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
      <div ref={containerRef} className="flex w-full items-start gap-2 py-5">
        {milestones.map((m, idx) => (
          <div
            key={m.key}
            data-zigzag-col
            className={`flex flex-col items-center flex-1 min-w-0 ${idx % 2 === 0 ? '' : 'mt-36'}`}
          >
            {renderMilestone(m, idx)}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-3.5 py-2 text-xs whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          {tooltip.data.hasData ? (
            <span className="font-semibold text-on-surface">
              {tooltip.data.count.toLocaleString()} POs
            </span>
          ) : (
            <span className="text-on-surface-variant">No data yet</span>
          )}
        </div>
      )}
    </div>
  );
}

export default MilestoneRingStepper;
