import csvText from './Contract-vs-PO.csv?raw';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNum(str: string): number {
  if (!str || str === '[NULL]' || str.trim() === '') return 0;
  const cleaned = str.replace(/["',\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parsePct(str: string): number | null {
  if (!str || str === '[NULL]' || str.trim() === '') return null;
  const cleaned = str.replace(/["',\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export interface ContractVsPORow {
  contractNo: string;
  supplier: string;
  poCount: number;
  contractAmount: number;
  consumedAmount: number;
  remaining: number;
  pctConsumed: number | null;
}

let cached: ContractVsPORow[] | null = null;

export function getContractVsPOData(): ContractVsPORow[] {
  if (cached) return cached;
  const lines = csvText.trim().split('\n');
  const rows: ContractVsPORow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 9) continue;
    rows.push({
      contractNo: cols[0],
      supplier: cols[2],
      poCount: parseNum(cols[3]),
      contractAmount: parseNum(cols[4]),
      consumedAmount: parseNum(cols[5]),
      remaining: parseNum(cols[6]),
      pctConsumed: parsePct(cols[7]),
    });
  }
  cached = rows;
  return rows;
}
