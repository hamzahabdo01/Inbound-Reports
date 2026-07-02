import {
  LEADTIME_MILESTONE_STEPS,
  getMilestoneStepState,
  getProgressPercent,
} from '../utils/leadtimeMilestones';

const STATE_STYLES = {
  complete: {
    dot: 'bg-[#0B4F54] border-[#0B4F54] text-white',
    label: 'text-on-surface font-bold',
    line: 'bg-[#0B4F54]',
  },
  inProgress: {
    dot: 'bg-[#D97706] border-[#D97706] text-white',
    label: 'text-[#D97706] font-bold',
    line: 'bg-[#D97706]',
  },
  pending: {
    dot: 'bg-white border-[#CBD5E1] text-[#94A3B8]',
    label: 'text-[#94A3B8] font-medium',
    line: 'bg-[#E2E8F0]',
  },
  noData: {
    dot: 'bg-white border-dashed border-[#CBD5E1] text-[#94A3B8]',
    label: 'text-[#94A3B8] font-medium',
    line: 'bg-[#E2E8F0]',
  },
};

function MilestoneDot({ state }: { state: keyof typeof STATE_STYLES }) {
  const styles = STATE_STYLES[state];
  return (
    <div
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ${styles.dot}`}
    >
      {state === 'complete' && <i className="fa-solid fa-check text-xs" />}
      {state === 'inProgress' && <i className="fa-solid fa-spinner fa-spin text-xs" />}
      {state === 'pending' && <span className="text-sm font-bold leading-none">—</span>}
      {state === 'noData' && <span className="text-sm font-bold leading-none">—</span>}
    </div>
  );
}

interface LeadtimeMilestoneTrackerProps {
  averageIndex: number;
  totalCount?: number;
}

export default function LeadtimeMilestoneTracker({ averageIndex, totalCount }: LeadtimeMilestoneTrackerProps) {
  const progressPct = getProgressPercent(averageIndex);

  return (
    <div className="bg-white border border-outline-variant rounded-xl px-6 pt-5 pb-4 mb-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h4 className="text-sm font-bold text-on-surface">Procurement Pipeline Progress</h4>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Average milestone across {totalCount != null ? `${totalCount.toLocaleString()} POs` : 'all tracked POs'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-primary tabular-nums">
            {averageIndex.toFixed(1)}
          </span>
          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wide">
            avg. stage
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Background rail */}
        <div className="absolute left-[5%] right-[5%] h-1 bg-[#E2E8F0] z-0 top-[20px] rounded-full" />

        {/* Progress rail (teal portion) */}
        <div
          className="absolute left-[5%] h-1 bg-[#0B4F54] z-0 top-[20px] rounded-full transition-all duration-500"
          style={{ width: `${progressPct * 0.9}%` }}
        />

        {/* In-progress segment overlay */}
        {(() => {
          const inProgressIdx = LEADTIME_MILESTONE_STEPS.findIndex(
            (_, i) => getMilestoneStepState(i, averageIndex) === 'inProgress',
          );
          if (inProgressIdx <= 0) return null;
          const lastIndex = LEADTIME_MILESTONE_STEPS.length - 1;
          const segStart = 5 + ((inProgressIdx - 1) / lastIndex) * 90;
          const segWidth = (1 / lastIndex) * 90;
          return (
            <div
              className="absolute h-1 bg-[#D97706] z-[1] top-[20px] rounded-full transition-all duration-500"
              style={{ left: `${segStart}%`, width: `${segWidth}%` }}
            />
          );
        })()}

        <div className="relative z-10 flex items-start justify-between w-full">
          {LEADTIME_MILESTONE_STEPS.map((step, idx) => {
            const state = getMilestoneStepState(idx, averageIndex);
            const styles = STATE_STYLES[state];

            return (
              <div key={step.label} className="flex flex-col items-center flex-1 min-w-0">
                <MilestoneDot state={state} />
                <div className="text-center mt-2.5 px-0.5 w-full">
                  <span className={`text-[10px] block leading-tight ${styles.label}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-outline-variant/50">
        {[
          { state: 'complete' as const, label: 'Complete' },
          { state: 'inProgress' as const, label: 'In progress' },
          { state: 'pending' as const, label: 'Pending' },
        ].map(({ state, label }) => (
          <div key={state} className="flex items-center gap-2 text-[10px] font-semibold text-on-surface-variant">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${STATE_STYLES[state].dot}`}>
              {state === 'complete' && <i className="fa-solid fa-check text-[7px]" />}
              {state === 'inProgress' && <i className="fa-solid fa-spinner text-[7px]" />}
              {state === 'pending' && <span className="text-[8px] font-bold">—</span>}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
