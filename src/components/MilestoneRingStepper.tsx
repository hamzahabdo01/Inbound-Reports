import { useEffect, useRef, useState } from 'react';
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
              width: 84,
              height: 84,
              background: m.hasData ? undefined : 'transparent',
            }}
          >
            <div className="absolute inset-[6px] rounded-full bg-white flex flex-col items-center justify-center overflow-hidden">
              <i className={`fa-solid ${m.icon} text-[19px] ${iconTextCls}`} />
              <span className={`text-[10px] font-semibold leading-tight text-center px-0.5 mt-0.5 ${iconTextCls}`}>
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
    return (
      <div className="py-5 flex flex-col items-center gap-6">
        {milestones.map((m, idx) => (
          <div key={m.key} className="flex items-center gap-4">
            {renderMilestone(m, idx)}
          </div>
        ))}
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
                <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX}, ${midY})`} className="text-[10px] font-semibold fill-on-surface-variant/50" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  No data
                </text>
              ) : (
                <>
                  {targetStr ? (
                    <text x={midX + nx} y={midY + ny} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX + nx}, ${midY + ny})`} className="text-[10px] font-semibold fill-on-surface" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      Target: {targetStr}
                    </text>
                  ) : (
                    <text x={midX + nx} y={midY + ny} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX + nx}, ${midY + ny})`} className="text-[10px] font-semibold fill-on-surface-variant/50" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      No data
                    </text>
                  )}
                  {avgStr ? (
                    <text x={midX - nx} y={midY - ny} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX - nx}, ${midY - ny})`} className={`text-[10px] font-semibold ${fillCls}`} style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      Avg: {avgStr}
                    </text>
                  ) : (
                    <text x={midX - nx} y={midY - ny} textAnchor="middle" dominantBaseline="central" transform={`rotate(${angle}, ${midX - nx}, ${midY - ny})`} className="text-[10px] font-semibold fill-on-surface-variant/50" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
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
            className={`flex flex-col items-center flex-1 min-w-0 ${idx % 2 === 0 ? '' : 'mt-14'}`}
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
