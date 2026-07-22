import csvText from './OpenPO.csv?raw';

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

export interface OpenPORow {
  poNo: string;
  item: string;
  scheduleLine: string;
  poDate: string;
  poType: string;
  supplierName: string;
  materialDescription: string;
  materialTypeDesc: string;
  itemNetValue: number;
  deliveryCompleted: boolean;
  finalInvoice: boolean;
  deliveryDate: string;
  scheduledQty: number;
  receivedQty: number;
  reducedQty: number;
  openQty: number;
  status: string;
  openValue: number;
}

let cached: OpenPORow[] | null = null;

export function getOpenPOData(): OpenPORow[] {
  if (cached) return cached;
  const lines = csvText.trim().split('\n');
  const rows: OpenPORow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 27) continue;
    rows.push({
      poNo: cols[1],
      item: cols[2],
      scheduleLine: cols[3],
      poDate: cols[4],
      poType: cols[5],
      supplierName: cols[7],
      materialDescription: cols[9],
      materialTypeDesc: cols[11],
      itemNetValue: parseNum(cols[14]),
      deliveryCompleted: cols[18] === 'X',
      finalInvoice: cols[19] === 'X',
      deliveryDate: cols[20],
      scheduledQty: parseNum(cols[21]),
      receivedQty: parseNum(cols[22]),
      reducedQty: parseNum(cols[23]),
      openQty: parseNum(cols[24]),
      status: cols[25],
      openValue: parseNum(cols[26]),
    });
  }
  cached = rows;
  return rows;
}
