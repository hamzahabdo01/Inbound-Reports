import {
  LEADTIME_MILESTONE_STEPS,
  getMilestoneStepState,
  getProgressRailPercent,
} from '../utils/leadtimeMilestones';

const STATE_STYLES = {
  active: {
    dot: 'bg-primary border-primary text-white',
    label: 'text-on-surface font-bold',
    stat: 'text-primary font-bold',
  },
  pending: {
    dot: 'bg-white border-[#CBD5E1] text-[#94A3B8]',
    label: 'text-[#94A3B8] font-medium',
    stat: 'text-[#94A3B8] font-medium',
  },
  noData: {
    dot: 'bg-white border-dashed border-[#CBD5E1] text-[#94A3B8]',
    label: 'text-[#94A3B8] font-medium',
    stat: 'text-[#94A3B8] font-medium',
  },
};

function MilestoneDot({ state }: { state: keyof typeof STATE_STYLES }) {
  const styles = STATE_STYLES[state];

  return (
    <div
      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ${styles.dot}`}
    >
      {state === 'active' && <i className="fa-solid fa-check text-xs" />}
      {(state === 'pending' || state === 'noData') && (
        <span className="text-sm font-bold leading-none">—</span>
      )}
    </div>
  );
}

interface LeadtimeMilestoneTrackerProps {
  counts: number[];
  percentages: number[];
  totalCount: number;
}

export default function LeadtimeMilestoneTracker({
  counts,
  percentages,
  totalCount,
}: LeadtimeMilestoneTrackerProps) {
  const progressPct = getProgressRailPercent(counts);

  return (
    <div className="bg-white border border-outline-variant rounded-xl px-6 pt-5 pb-4 mb-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h4 className="text-sm font-bold text-on-surface">Procurement Pipeline Progress</h4>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            PO count and share (%) at each procurement stage
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-primary tabular-nums">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wide">
            total POs
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[5%] right-[5%] h-1 bg-[#E2E8F0] z-0 top-[22px] rounded-full" />

        <div
          className="absolute left-[5%] h-1 bg-primary z-0 top-[22px] rounded-full transition-all duration-500"
          style={{ width: `${progressPct * 0.9}%` }}
        />

        <div className="relative z-10 flex items-start justify-between w-full">
          {LEADTIME_MILESTONE_STEPS.map((step, idx) => {
            const state = getMilestoneStepState(idx, counts);
            const styles = STATE_STYLES[state];
            const count = step.dataAvailable ? counts[idx] : null;
            const pct = step.dataAvailable ? percentages[idx] : null;
            const hasStats = count != null && count > 0;

            return (
              <div key={step.label} className="flex flex-col items-center flex-1 min-w-0">
                <MilestoneDot state={state} />
                <div className="text-center mt-2.5 px-0.5 w-full">
                  <span className={`text-[10px] block leading-tight ${styles.label}`}>
                    {step.label}
                  </span>
                  {step.dataAvailable && (
                    <div className={`mt-0.5 text-[10px] tabular-nums ${styles.stat}`}>
                      {hasStats ? (
                        <>
                          <span className="block leading-tight">{count.toLocaleString()} POs</span>
                          <span className="block leading-tight opacity-70">{pct}%</span>
                        </>
                      ) : (
                        <span className="block leading-tight">—</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-outline-variant/50">
        {[
          { state: 'active' as const, label: 'POs at stage' },
          { state: 'pending' as const, label: 'Pending' },
          { state: 'noData' as const, label: 'No data yet' },
        ].map(({ state, label }) => (
          <div key={state} className="flex items-center gap-2 text-[10px] font-semibold text-on-surface-variant">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${STATE_STYLES[state].dot}`}>
              {state === 'active' && <i className="fa-solid fa-check text-[7px]" />}
              {(state === 'pending' || state === 'noData') && (
                <span className="text-[8px] font-bold">—</span>
              )}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
