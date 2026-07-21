import csvText from './Performance Bond Report.csv?raw';

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

function parseAmount(str: string): number {
  if (!str || str === '[NULL]' || str.trim() === '') return 0;
  return parseFloat(str.replace(/["',\s]/g, '')) || 0;
}

function parseDateValue(str: string): string {
  if (!str || str === '[NULL]' || str.trim() === '') return '';
  return str.replace(/"/g, '').trim();
}

export interface PerformanceBond {
  bondNo: string;
  supplier: string;
  amount: number;
  receivedDate: string;
  verifiedDate: string;
  expiryDate: string;
  status: string;
}

export function loadPerformanceBonds(): PerformanceBond[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headerFields = parseCSVLine(lines[0]).map(h => h.trim());
  const idx = (name: string) => headerFields.indexOf(name);
  const iPO = idx('PURCHASE_ORDER_NUMBER');
  const iSupplier = idx('SUPPLIER_NAME');
  const iPOVal = idx('PO_VALUE_ETB');
  const iRecv = idx('PERFORMANCE_GUARANTEE_RECEIVED_DATE');
  const iSub = idx('PERFORMANCE_GUARANTEE_SUBMISSION_DATE');
  const iExp = idx('PERFORMANCE_GUARANTEE_EXPIRY_DATE');
  const iStatus = idx('PERFORMANCE_BOND_STATUS');

  return lines.slice(1).map(line => {
    const fields = parseCSVLine(line);
    return {
      bondNo: (fields[iPO] || '').replace(/"/g, '').trim(),
      supplier: (fields[iSupplier] || '').replace(/"/g, '').trim(),
      amount: parseAmount(fields[iPOVal]),
      receivedDate: parseDateValue(fields[iRecv]),
      verifiedDate: parseDateValue(fields[iSub]),
      expiryDate: parseDateValue(fields[iExp]),
      status: (fields[iStatus] || '').replace(/"/g, '').trim(),
    };
  });
}

const performanceBonds = loadPerformanceBonds();
export default performanceBonds;
