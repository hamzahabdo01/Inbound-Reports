export type MilestoneStepState = 'noData' | 'active' | 'pending';

export interface LeadtimeMilestoneStep {
  label: string;
  dataAvailable: boolean;
}

/** Procurement pipeline — 9 stages from request to delivery. */
export const LEADTIME_MILESTONE_STEPS: LeadtimeMilestoneStep[] = [
  { label: 'Purchase Request', dataAvailable: false },
  { label: 'On Tender Process', dataAvailable: false },
  { label: 'Tender Awarded', dataAvailable: false },
  { label: 'Contract', dataAvailable: true },
  { label: 'Purchase Order', dataAvailable: true },
  { label: 'LC / Payment', dataAvailable: true },
  { label: 'Awaiting Shipment', dataAvailable: true },
  { label: 'Partially Received', dataAvailable: true },
  { label: 'Delivery Complete', dataAvailable: true },
];

/** Map process status codes to milestone index (0-based). */
const STATUS_TO_MILESTONE: Record<string, number> = {
  CONTRACTING_IN_PROGRESS: 3,
  BUDGET_CONFIRMED: 3,
  SIGNED_CONTRACT_RECEIVED: 3,
  PO_APPROVAL_IN_PROGRESS: 4,
  PO_APPROVED: 4,
  PROFORMA_RECEIVED: 4,
  PO_CREATED: 4,
  LC_CAD_APPLICATION_IN_PROGRESS: 5,
  LC_CAD_OPENED: 5,
  PERFORMANCE_GUARANTEE_RECEIVED: 5,
  AWAITING_FOREIGN_SHIPMENT: 6,
  AWAITING_SHIPMENT: 6,
  AWAITING_RECEIPT: 6,
  PARTIALLY_RECEIVED: 7,
  PARTIALLY_RECEIVED_WITH_GRV_DATE: 7,
  DELIVERY_COMPLETE: 8,
  FULLY_DELIVERED_WITH_GRV_DATE: 8,
  FULLY_DELIVERED_OR_REDUCED_BUT_GRV_DATE_MISSING: 8,
  ORDER_CLOSED: 8,
};

export interface MilestoneDistribution {
  counts: number[];
  percentages: number[];
  totalCount: number;
}

export function getMilestoneIndexForStatus(status: string | null | undefined): number | null {
  if (!status) return null;
  return STATUS_TO_MILESTONE[status] ?? null;
}

export function computeMilestoneDistribution(
  items: Array<{ currentProcessStatus?: string | null }>,
): MilestoneDistribution {
  const stepCount = LEADTIME_MILESTONE_STEPS.length;
  const counts = Array.from({ length: stepCount }, () => 0);
  let totalCount = 0;

  for (const item of items) {
    const idx = getMilestoneIndexForStatus(item.currentProcessStatus);
    if (idx == null) continue;
    counts[idx]++;
    totalCount++;
  }

  const percentages = counts.map((c) =>
    totalCount > 0 ? Math.round((c / totalCount) * 1000) / 10 : 0,
  );

  return { counts, percentages, totalCount };
}

/** Visual state from PO counts. */
export function getMilestoneStepState(
  stepIndex: number,
  counts: number[],
): MilestoneStepState {
  const step = LEADTIME_MILESTONE_STEPS[stepIndex];
  if (!step?.dataAvailable) return 'noData';

  const count = counts[stepIndex] ?? 0;
  if (count > 0) return 'active';
  return 'pending';
}

export function getProgressRailPercent(counts: number[]): number {
  const lastIndex = LEADTIME_MILESTONE_STEPS.length - 1;
  const firstTracked = LEADTIME_MILESTONE_STEPS.findIndex((s) => s.dataAvailable);
  if (firstTracked < 0) return 0;

  const peakIndex = counts.reduce(
    (max, c, i) => (c > 0 ? Math.max(max, i) : max),
    firstTracked,
  );

  return ((peakIndex - firstTracked) / (lastIndex - firstTracked)) * 100;
}
