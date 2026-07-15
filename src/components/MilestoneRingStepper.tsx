import { useMemo, useState } from 'react';

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
  variant?: 'level-1' | 'level-5' | 'level-max';
}

const ON_TRACK_COLOR = '#059669';
const WARN_COLOR = '#D97706';
const TRACK_COLOR = '#CFD8DC';

const shimmerStyles = `
@keyframes shimmer {
  0%, 100% { opacity: 0.3; transform: translateX(0); }
  50% { opacity: 0.7; transform: translateX(20px); }
}
`;

function MilestoneRingStepper({ milestones, onMilestoneClick, variant = 'level-1' }: MilestoneRingStepperProps) {
  const [tooltip, setTooltip] = useState<{ data: Milestone; x: number; y: number } | null>(null);

  const bottleneck = useMemo(() => {
    const withData = milestones.filter(m => m.hasData);
    if (!withData.length) return null;
    return withData.reduce((min, m) => (m.percent < min.percent ? m : min), withData[0]);
  }, [milestones]);

  const RING_SIZE = variant === 'level-max' ? 140 : variant === 'level-5' ? 130 : 120;
  const GAP = variant === 'level-max' ? 20 : variant === 'level-5' ? 18 : 16;

  if (!milestones.length) return null;

  const lastDataIdx = milestones.length > 0
    ? Math.max(-1, ...milestones.map((m, i) => m.hasData ? i : -1))
    : -1;
  const progressPct = lastDataIdx >= 0 ? ((lastDataIdx + 1) / milestones.length) * 100 : 0;

  const totalWithData = milestones.filter(m => m.hasData).length;

  return (
    <>
      <style>{shimmerStyles}</style>
      <div className="-mx-5 overflow-x-auto scroll-smooth px-5 py-5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-surface-container [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="relative flex items-start min-w-max" style={{ gap: GAP * 4 }}>
          {/* Connecting line */}
          {variant === 'level-max' ? (
            <div className="absolute left-0 right-0 z-0" style={{ top: RING_SIZE / 2, height: 4 }}>
              <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, ${ON_TRACK_COLOR}40, ${TRACK_COLOR})` }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full opacity-30"
                  style={{
                    width: `${Math.min(progressPct * 3, 100)}%`,
                    background: `linear-gradient(90deg, ${ON_TRACK_COLOR}, ${WARN_COLOR})`,
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          ) : variant === 'level-5' ? (
            <div className="absolute left-0 right-0 z-0 h-0.5 rounded-full" style={{
              top: RING_SIZE / 2,
              background: `linear-gradient(90deg, ${ON_TRACK_COLOR} 0% ${Math.min(progressPct * 3, 100)}%, ${TRACK_COLOR} ${Math.min(progressPct * 3, 100)}% 100%)`,
            }} />
          ) : (
            <div className="absolute left-0 right-0 h-0.5 bg-outline-variant z-0" style={{ top: RING_SIZE / 2 }} />
          )}

          {milestones.map((m, idx) => {
            const isBottleneck = bottleneck?.key === m.key;
            const fillColor = isBottleneck ? WARN_COLOR : ON_TRACK_COLOR;

            return (
              <div key={m.key} className="relative z-10 flex flex-col items-center shrink-0">
                {/* Stage number badge (level-5 and level-max) */}
                {variant !== 'level-1' && (
                  <div
                    className={`absolute z-20 flex items-center justify-center rounded-full font-bold border-2 bg-white ${
                      variant === 'level-max' ? '-top-3 w-7 h-7 text-[11px]' : '-top-2 w-6 h-6 text-[10px]'
                    }`}
                    style={{
                      borderColor: m.hasData ? fillColor : TRACK_COLOR,
                      color: m.hasData ? fillColor : TRACK_COLOR,
                    }}
                  >
                    {idx + 1}
                  </div>
                )}

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
                  aria-label={`${m.label}: ${m.hasData ? `${m.count} POs, ${m.percent}% of total` : 'No data yet'}`}
                >
                  {/* Outer ring */}
                  <div
                    id={`ring-${m.key}`}
                    className={`relative rounded-full transition-all duration-200 hover:scale-110 focus-visible:scale-110 ${
                      !m.hasData ? 'border-2 border-dashed border-outline-variant' : ''
                    } ${variant === 'level-max' && m.hasData && isBottleneck ? 'animate-pulse' : ''}`}
                    style={{
                      width: RING_SIZE,
                      height: RING_SIZE,
                      boxShadow: variant === 'level-max' && m.hasData
                        ? `0 4px 24px ${fillColor}40, 0 1px 3px ${fillColor}20`
                        : variant === 'level-5' && m.hasData
                        ? `0 2px 12px ${fillColor}30`
                        : 'none',
                      background: m.hasData
                        ? `conic-gradient(from -90deg, ${fillColor} 0% ${m.percent}%, ${TRACK_COLOR} ${m.percent}% 100%)`
                        : 'transparent',
                    }}
                  >
                    {/* Inner circle */}
                    <div
                      className={`absolute rounded-full flex flex-col items-center justify-center overflow-hidden ${
                        variant === 'level-max' ? 'inset-[8px] bg-white/70 backdrop-blur-sm' : 'inset-[11px] bg-white'
                      }`}
                    >
                      <i className={`fa-solid ${m.icon} ${variant === 'level-max' ? 'text-[28px]' : variant === 'level-5' ? 'text-[26px]' : 'text-[26px]'} ${
                        m.hasData ? (isBottleneck ? 'text-warning' : 'text-primary') : 'text-on-surface-variant/40'
                      }`} />
                      <span className={`${
                        variant === 'level-max' ? 'text-[13px]' : variant === 'level-5' ? 'text-[13px]' : 'text-[14px]'
                      } font-semibold leading-tight text-center px-0.5 mt-1.5 ${
                        m.hasData ? (isBottleneck ? 'text-warning' : 'text-on-surface') : 'text-on-surface-variant/40'
                      }`}>
                        {m.label}
                      </span>
                    </div>
                  </div>

                  {/* Count badge below ring (level-max only) */}
                  {variant === 'level-max' && m.hasData && (
                    <span className="text-[10px] font-bold text-on-surface-variant mt-1.5 tabular-nums">
                      {m.count.toLocaleString()} POs
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-3.5 py-2 text-xs whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          {tooltip.data.hasData ? (
            <div className="space-y-1.5">
              <span className="font-semibold text-on-surface">
                Stage {milestones.findIndex(m => m.key === tooltip.data.key) + 1} of {milestones.length}
              </span>
              <div className="text-on-surface-variant">
                {tooltip.data.count.toLocaleString()} POs &middot; {tooltip.data.percent}% of total
              </div>
              {(variant === 'level-5' || variant === 'level-max') && (
                <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(tooltip.data.percent, 2)}%`,
                      backgroundColor: bottleneck?.key === tooltip.data.key ? WARN_COLOR : ON_TRACK_COLOR,
                    }}
                  />
                </div>
              )}
              {variant === 'level-max' && totalWithData > 0 && (
                <div className="text-[10px] text-on-surface-variant/60 pt-0.5 border-t border-outline-variant/30">
                  {Math.round((milestones.filter(m => m.hasData && milestones.indexOf(m) <= milestones.findIndex(x => x.key === tooltip.data.key)).length / totalWithData) * 100)}% of stages complete
                </div>
              )}
            </div>
          ) : (
            <span className="text-on-surface-variant">No data yet</span>
          )}
        </div>
      )}
    </>
  );
}

export default MilestoneRingStepper;
