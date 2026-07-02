export type MilestoneStepState = 'noData' | 'complete' | 'inProgress' | 'pending';

export interface LeadtimeMilestoneStep {
  label: string;
  dataAvailable: boolean;
}

/** Visual pipeline for leadtime analysis — matches design spec (9 steps). */
export const LEADTIME_MILESTONE_STEPS: LeadtimeMilestoneStep[] = [
  { label: 'Purchase request', dataAvailable: false },
  { label: 'On tender process', dataAvailable: false },
  { label: 'Tender awarded', dataAvailable: false },
  { label: 'Contract', dataAvailable: false },
  { label: 'Purchase order', dataAvailable: false },
  { label: 'LC / Payment', dataAvailable: true },
  { label: 'Awaiting shipment', dataAvailable: true },
  { label: 'Partially received', dataAvailable: true },
  { label: 'Delivery complete', dataAvailable: true },
];

const FIRST_TRACKED_INDEX = LEADTIME_MILESTONE_STEPS.findIndex((s) => s.dataAvailable);

/** Map process status codes to milestone index (0-based). */
const STATUS_TO_MILESTONE: Record<string, number> = {
  LC_CAD_APPLICATION_IN_PROGRESS: 5,
  LC_CAD_OPENED: 5,
  PERFORMANCE_GUARANTEE_RECEIVED: 5,
  AWAITING_FOREIGN_SHIPMENT: 6,
  PARTIALLY_RECEIVED: 7,
  DELIVERY_COMPLETE: 8,
  ORDER_CLOSED: 8,
};

/** Items without a mapped status are treated as pre-LC (index 4). */
const PRE_TRACKED_INDEX = FIRST_TRACKED_INDEX - 1;

export function getMilestoneIndexForStatus(status: string | null | undefined): number | null {
  if (!status) return null;
  return STATUS_TO_MILESTONE[status] ?? PRE_TRACKED_INDEX;
}

export function computeAverageMilestoneIndex(
  items: Array<{ currentProcessStatus?: string | null }>,
): { averageIndex: number; mappedCount: number; totalCount: number } {
  const totalCount = items.length;
  if (!totalCount) {
    return { averageIndex: PRE_TRACKED_INDEX, mappedCount: 0, totalCount: 0 };
  }

  const indices = items
    .map((item) => getMilestoneIndexForStatus(item.currentProcessStatus))
    .filter((idx): idx is number => idx !== null);

  if (!indices.length) {
    return { averageIndex: PRE_TRACKED_INDEX, mappedCount: 0, totalCount };
  }

  const averageIndex = indices.reduce((sum, idx) => sum + idx, 0) / indices.length;
  return { averageIndex, mappedCount: indices.length, totalCount };
}

export function getMilestoneStepState(stepIndex: number, averageIndex: number): MilestoneStepState {
  const lastIndex = LEADTIME_MILESTONE_STEPS.length - 1;

  if (averageIndex >= lastIndex) return 'complete';

  // e.g. avg 5.4 → steps 1–5 (indices 0–4) complete, step 6 (index 5) in progress
  if (stepIndex < Math.floor(averageIndex)) return 'complete';

  if (stepIndex === Math.floor(averageIndex)) return 'inProgress';

  return 'pending';
}

export function getProgressPercent(averageIndex: number): number {
  const lastIndex = LEADTIME_MILESTONE_STEPS.length - 1;
  const clamped = Math.max(0, Math.min(averageIndex, lastIndex));
  return (clamped / lastIndex) * 100;
}
