import { useState, useRef, useEffect, useCallback } from 'react';
import {
  LEADTIME_MILESTONE_STEPS,
  getMilestoneStepState,
  getProgressRailPercent,
} from '../utils/leadtimeMilestones';

const MILESTONE_ICONS = [
  'fa-file-pen',             // Purchase Request
  'fa-gavel',                // On Tender Process
  'fa-trophy',               // Tender Awarded
  'fa-handshake',            // Contract
  'fa-clipboard-list',       // Purchase Order
  'fa-coins',                // LC / Payment
  'fa-ship',                 // Awaiting Shipment
  'fa-box-open',             // Partially Received
  'fa-check-double',         // Delivery Complete
];

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

function MilestoneDot({ state, stepIndex }: { state: keyof typeof STATE_STYLES; stepIndex: number }) {
  const styles = STATE_STYLES[state];

  return (
    <div
      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 ${styles.dot}`}
    >
      {state === 'active' && <i className={`fa-solid ${MILESTONE_ICONS[stepIndex]} text-sm`} />}
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

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const totalStages = LEADTIME_MILESTONE_STEPS.length;
  const [currentStage, setCurrentStage] = useState(() => {
    let lastActive = 0;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] > 0) lastActive = i;
    }
    return lastActive;
  });

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goToStage = useCallback((idx: number) => {
    setCurrentStage(Math.max(0, Math.min(idx, totalStages - 1)));
  }, [totalStages]);

  const goNext = useCallback(() => {
    setCurrentStage((prev) => (prev + 1) % totalStages);
  }, [totalStages]);

  const goPrev = useCallback(() => {
    setCurrentStage((prev) => (prev - 1 + totalStages) % totalStages);
  }, [totalStages]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, [goNext, goPrev]);

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

      {isMobile ? (
        <div>
          <div aria-live="polite" className="sr-only">
            Stage {currentStage + 1} of {totalStages}: {LEADTIME_MILESTONE_STEPS[currentStage].label}
          </div>

          <div className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentStage * 100}%)` }}
            >
              {LEADTIME_MILESTONE_STEPS.map((step, idx) => {
                const state = getMilestoneStepState(idx, counts);
                const styles = STATE_STYLES[state];
                const count = step.dataAvailable ? counts[idx] : null;
                const pct = step.dataAvailable ? percentages[idx] : null;
                const hasStats = count != null && count > 0;
                return (
                  <div key={step.label} className="flex-[0_0_100%] flex flex-col items-center py-6 px-4">
                    <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${styles.dot}`}>
                      {state === 'active' ? (
                        <i className={`fa-solid ${MILESTONE_ICONS[idx]} text-2xl`} />
                      ) : (
                        <span className="text-2xl font-bold">—</span>
                      )}
                    </div>
                    <span className={`text-sm font-bold mt-4 ${styles.label}`}>
                      {step.label}
                    </span>
                    {step.dataAvailable ? (
                      hasStats ? (
                        <div className="text-center mt-3">
                          <span className="block text-4xl font-extrabold tabular-nums text-on-surface">
                            {count.toLocaleString()}
                          </span>
                          <span className="block text-xs text-on-surface-variant mt-1">
                            {pct}% of {totalCount.toLocaleString()} total POs
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#94A3B8] italic mt-3">—</span>
                      )
                    ) : (
                      <span className="text-xs text-[#94A3B8] italic mt-3">No data yet</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            {LEADTIME_MILESTONE_STEPS.map((step, idx) => (
              <button key={step.label}
                onClick={() => goToStage(idx)}
                aria-label={`Go to ${step.label} stage`}
                aria-current={idx === currentStage ? 'true' : undefined}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStage
                    ? 'bg-primary scale-125'
                    : 'bg-[#CBD5E1] hover:bg-[#94A3B8]'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
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
                  <MilestoneDot state={state} stepIndex={idx} />
                  <div className="text-center mt-2.5 px-0.5 w-full">
                    <span className={`text-[10px] block leading-tight ${styles.label}`}>
                      {step.label}
                    </span>
                    {step.dataAvailable ? (
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
                    ) : (
                      <span className="text-[9px] text-[#94A3B8] italic mt-0.5 block">No data yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 sm:gap-5 mt-5 pt-4 border-t border-outline-variant/50">
        {[
          { state: 'active' as const, label: 'POs at stage' },
          { state: 'pending' as const, label: 'Pending' },
          { state: 'noData' as const, label: 'No data yet' },
        ].map(({ state, label }) => (
          <div key={state} className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-semibold text-on-surface-variant">
            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${STATE_STYLES[state].dot}`}>
              {state === 'active' && <i className="fa-solid fa-check text-[6px] sm:text-[7px]" />}
              {(state === 'pending' || state === 'noData') && (
                <span className="text-[6px] sm:text-[7px] font-bold leading-none">-</span>
              )}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
