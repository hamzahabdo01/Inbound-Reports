import { useState } from 'react';

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

const SUCCESS_COLOR = '#059669';
const WARN_COLOR = '#D97706';
const ERROR_COLOR = '#DC2626';
const TRACK_COLOR = '#CFD8DC';

const MANUAL_COLORS: Record<number, string> = {
  0: TRACK_COLOR,
  1: TRACK_COLOR,
  2: TRACK_COLOR,
  3: SUCCESS_COLOR,
  4: WARN_COLOR,
  5: ERROR_COLOR,
  7: SUCCESS_COLOR,
  8: SUCCESS_COLOR,
};

const fmtDuration = (days: number | null | undefined) => {
  if (days == null || days < 0) return null;
  if (days === 0) return '0d';
  if (days >= 365) {
    const y = Math.round(days / 365);
    const rem = Math.round((days % 365) / 30);
    return rem ? `${y}y ${rem}mo` : `${y}y`;
  }
  if (days >= 90) return `${Math.round(days / 30)}mo`;
  if (days >= 30) {
    const mo = Math.floor(days / 30);
    const d = days % 30;
    return d ? `${mo}mo ${d}d` : `${mo}mo`;
  }
  if (days >= 7) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    return d ? `${w}w ${d}d` : `${w}w`;
  }
  return `${days}d`;
};

function getConnectorColor(avg: number | null, target: number | null): string {
  if (avg == null || target == null || target <= 0) return SUCCESS_COLOR;
  const diffPct = ((avg - target) / target) * 100;
  if (diffPct > 40) return ERROR_COLOR;
  if (diffPct > 0) return WARN_COLOR;
  return SUCCESS_COLOR;
}

function getMilestoneColor(idx: number, connectorAverages: (number | null)[], connectorTargets?: number[]): string {
  if (MANUAL_COLORS[idx] !== undefined) return MANUAL_COLORS[idx];
  if (idx === 0) return SUCCESS_COLOR;
  const avg = connectorAverages[idx - 1];
  const target = connectorTargets?.[idx - 1] ?? null;
  return getConnectorColor(avg, target);
}

function MilestoneRingStepper({ milestones, onMilestoneClick, connectorAverages, connectorTargets }: MilestoneRingStepperProps) {
  const [tooltip, setTooltip] = useState<{ data: Milestone; x: number; y: number } | null>(null);

  if (!milestones.length) return null;

  const renderMilestone = (m: Milestone, idx: number) => {
    const fillColor = getMilestoneColor(idx, connectorAverages ?? [], connectorTargets);

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
                      !m.hasData ? 'border-2 border-dashed border-outline-variant' : ''
                    }`}
                    style={{
                      width: 120,
                      height: 120,
                      background: m.hasData ? fillColor : 'transparent',
                    }}
                  >
                    <div className="absolute inset-[11px] rounded-full bg-white flex flex-col items-center justify-center overflow-hidden">
                      <i className={`fa-solid ${m.icon} text-[26px] ${m.hasData ? 'text-primary' : 'text-on-surface-variant/40'}`} />
                      <span className={`text-[14px] font-semibold leading-tight text-center px-0.5 mt-1.5 ${
                        m.hasData ? 'text-on-surface' : 'text-on-surface-variant/40'
                      }`}>
                        {m.label}
                      </span>
                    </div>
                  </div>
        </button>
      </div>
    );
  };

  const renderConnector = (globalConnIdx: number) => {
    const avg = connectorAverages?.[globalConnIdx] ?? null;
    const target = connectorTargets?.[globalConnIdx] ?? null;
    const avgStr = fmtDuration(avg);
    const targetStr = fmtDuration(target);
    return (
      <div className="self-center shrink-0 flex flex-col items-center gap-1">
        {targetStr ? (
          <span className="text-[11px] font-semibold text-on-surface tabular-nums whitespace-nowrap leading-tight">
            Target: ~{targetStr}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-on-surface-variant/50 tabular-nums whitespace-nowrap leading-tight">
            No data
          </span>
        )}
        <div className="w-[120px] h-0.5 bg-primary rounded-full" />
        {avgStr ? (
          <span className="text-[11px] font-semibold text-on-surface tabular-nums whitespace-nowrap leading-tight">
            Average: ~{avgStr}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-on-surface-variant/50 tabular-nums whitespace-nowrap leading-tight">
            No data
          </span>
        )}
      </div>
    );
  };

  const renderRow = (items: Milestone[], connOffset: number, globalStartIdx: number, prependConnIdx?: number) => (
    <div className="flex justify-center items-start gap-4">
      {prependConnIdx != null && renderConnector(prependConnIdx)}
      {items.flatMap((m, idx) => {
        const node = renderMilestone(m, globalStartIdx + idx);
        if (idx < items.length - 1) {
          return [node, renderConnector(connOffset + idx)];
        }
        return [node];
      })}
    </div>
  );

  const mid = Math.ceil(milestones.length / 2);

  return (
    <>
      <div className="-mx-5 px-5 py-5 flex flex-col items-center gap-6">
        {renderRow(milestones.slice(0, mid), 0, 0)}
        {renderRow(milestones.slice(mid), mid, mid, mid - 1)}
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
    </>
  );
}

export default MilestoneRingStepper;
