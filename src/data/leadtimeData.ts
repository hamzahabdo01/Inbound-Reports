import csvText from './PO-Leadtime.csv?raw';
import { computeMilestoneDistribution } from '../utils/leadtimeMilestones';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function parseNullableInt(str: string): number | null {
  if (!str || str === '[NULL]' || str.trim() === '') return null;
  const cleaned = str.replace(/["',\s]/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? null : n;
}

export interface LeadtimeRow {
  poNo: string;
  supplier: string;
  contractToPO: number | null;
  poToLCOpening: number | null;
  lcToPortArrival: number | null;
  portToCleared: number | null;
  clearedToReceive: number | null;
  totalLeadtime: number | null;
  currentMilestoneStatus: string | null;
}

export interface LeadtimeSummary {
  contractToPO: number;
  poToLCOpening: number;
  lcToPortArrival: number;
  portToCleared: number;
  clearedToReceive: number;
  total: number;
}

function getAvg(arr: (number | null)[]): number {
  const filtered = arr.filter((v): v is number => v !== null);
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((s, v) => s + v, 0) / filtered.length);
}

function loadLeadtimeData(): { details: LeadtimeRow[]; summary: LeadtimeSummary; milestone: any } {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { details: [], summary: { contractToPO: 0, poToLCOpening: 0, lcToPortArrival: 0, portToCleared: 0, clearedToReceive: 0, total: 0 }, milestone: { counts: [], percentages: [], totalCount: 0 } };

  const headerFields = parseCSVLine(lines[0]).map(h => h.trim());
  const idx = (name: string) => headerFields.indexOf(name);
  const iPO = idx('PURCHASE_ORDER_NUMBER');
  const iSupplier = idx('SUPPLIER_NAME');
  const iCToPO = idx('CONTRACT_TO_PO_DAYS');
  const iPOToLC = idx('PO_TO_LC_CAD_OPEN_DAYS');
  const iLCToInb = idx('LC_CAD_OPEN_TO_INBOUND_CREATED_DAYS');
  const iInbToGRV = idx('INBOUND_CREATED_TO_PARTIAL_GRV_DAYS');
  const iGRVToFull = idx('PARTIAL_GRV_TO_FULL_DELIVERY_DAYS');
  const iStatus = idx('CURRENT_MILESTONE_STATUS');

  const details: LeadtimeRow[] = lines.slice(1).map(line => {
    const fields = parseCSVLine(line);
    const get = (i: number) => (fields[i] || '').replace(/"/g, '').trim();
    const cToPO = parseNullableInt(get(iCToPO));
    const poToLC = parseNullableInt(get(iPOToLC));
    const lcToInb = parseNullableInt(get(iLCToInb));
    const inbToGRV = parseNullableInt(get(iInbToGRV));
    const grvToFull = parseNullableInt(get(iGRVToFull));
    const parts = [cToPO, poToLC, lcToInb, inbToGRV, grvToFull].filter(v => v !== null) as number[];
    const total = parts.length > 0 ? parts.reduce((s, v) => s + v, 0) : null;
    return {
      poNo: get(iPO),
      supplier: get(iSupplier),
      contractToPO: cToPO,
      poToLCOpening: poToLC,
      lcToPortArrival: lcToInb,
      portToCleared: inbToGRV,
      clearedToReceive: grvToFull,
      totalLeadtime: total,
      currentMilestoneStatus: get(iStatus) || null,
    };
  });

  const summary: LeadtimeSummary = {
    contractToPO: getAvg(details.map(d => d.contractToPO)),
    poToLCOpening: getAvg(details.map(d => d.poToLCOpening)),
    lcToPortArrival: getAvg(details.map(d => d.lcToPortArrival)),
    portToCleared: getAvg(details.map(d => d.portToCleared)),
    clearedToReceive: getAvg(details.map(d => d.clearedToReceive)),
    total: getAvg(details.map(d => d.totalLeadtime)),
  };

  const milestone = computeMilestoneDistribution(
    details.map(d => ({ currentProcessStatus: d.currentMilestoneStatus }))
  );

  return { details, summary, milestone };
}

const leadtimeData = loadLeadtimeData();
export default leadtimeData;
