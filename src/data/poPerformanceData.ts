import lcCadExpiryRaw from './po-perfromance-and-compliance/LCCADExpiryDetail.json';
import lcCadExpirySummaryRaw from './po-perfromance-and-compliance/LCCADExpirySummary.json';
import supplierRiskRankingRaw from './po-perfromance-and-compliance/SupplierRiskRanking.json';
import supplierPerformanceLeaderboardRaw from './po-perfromance-and-compliance/SupplierPerformanceLeaderboard.json';
import supplierPerformanceSummaryRaw from './po-perfromance-and-compliance/SupplierPerformanceSummary.json';
import contractToReceiveTrackingRaw from './po-perfromance-and-compliance/ContractToReceiveStatusTrackingReport.json';
import yearlyContractToReceiptRaw from './po-perfromance-and-compliance/YearlyContractToReceiptAmount.json';
import openPOByMaterialTypeRaw from './po-perfromance-and-compliance/OpenPOByMaterialType.json';
import openPOItemDetailRaw from './po-perfromance-and-compliance/OpenPOItemDetail.json';
import overduePOScheduleLineRaw from './po-perfromance-and-compliance/OverduePOsScheduleLineDetail.json';
import overduePOSummaryRaw from './po-perfromance-and-compliance/OverduePOsSummary.json';

const PROGRAMS = ['HIV/AIDS', 'TB', 'Malaria', 'EPI', 'Reproductive Health', 'Child Health', 'Clinical Chemistry', 'Nutrition'];
const COMMODITIES = ['ARVs', 'Antimalarials', 'Vaccines', 'Lab Reagents', 'Family Planning', 'Essential Medicines', 'Nutrition Supplies', 'Diagnostics'];
const SUPPLIERS = ['EPSS', 'MOH', 'Global Fund', 'UNICEF', 'WHO', 'UNDP', 'UNFPA', 'Clinton Access Initiative'];
const FUNDING_SOURCES = [
  { name: 'Government', sub: [{ name: 'MOH', share: 0.6 }, { name: 'EPSS', share: 0.4 }], share: 0.35 },
  { name: 'Global Fund', sub: null, share: 0.30 },
  { name: 'World Bank', sub: null, share: 0.15 },
  { name: 'Bilateral', sub: [{ name: 'USAID', share: 0.5 }, { name: 'DFID', share: 0.3 }, { name: 'EU', share: 0.2 }], share: 0.12 },
  { name: 'UN Agencies', sub: [{ name: 'UNICEF', share: 0.5 }, { name: 'WHO', share: 0.3 }, { name: 'UNFPA', share: 0.2 }], share: 0.08 },
];

const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const pick = (arr) => arr[rand(0, arr.length - 1)];
const formatAmount = (v) => v.toLocaleString('en');

let poCounter = 0;
let contractCounter = 0;
let lcCounter = 0;
let bondCounter = 0;

function generatePOs(count = 150) {
  return Array.from({ length: count }, (_, i) => {
    poCounter++;
    const amount = rand(500000, 50000000);
    const issueDate = new Date(2023, rand(0, 17), rand(1, 28));
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + rand(60, 365));
    const now = new Date();
    const isOverdue = dueDate < now && Math.random() < 0.3;
    return {
      poNo: `PO-${String(poCounter).padStart(4, '0')}`,
      supplier: pick(SUPPLIERS),
      program: pick(PROGRAMS),
      commodity: pick(COMMODITIES),
      amount,
      amountFormatted: formatAmount(amount),
      issueDate: issueDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: isOverdue ? 'Overdue' : dueDate < now ? 'Completed' : 'Open',
      daysOverdue: isOverdue ? rand(1, 90) : 0,
    };
  });
}

function generateContracts(count = 100) {
  return Array.from({ length: count }, (_, i) => {
    contractCounter++;
    const amount = rand(1000000, 100000000);
    const startDate = new Date(2022, rand(0, 24), rand(1, 28));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + rand(180, 730));
    return {
      contractNo: `CT-${String(contractCounter).padStart(4, '0')}`,
      supplier: pick(SUPPLIERS),
      program: pick(PROGRAMS),
      amount,
      amountFormatted: formatAmount(amount),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: endDate < new Date() ? 'Completed' : 'Active',
    };
  });
}

function generateSupplierShare() {
  return SUPPLIERS.map((s, i) => ({
    label: s,
    value: [35, 25, 15, 10, 7, 4, 2, 2][i],
    amount: [420_000_000, 300_000_000, 180_000_000, 120_000_000, 84_000_000, 48_000_000, 24_000_000, 24_000_000][i],
  }));
}

function generateCommodityByProgram() {
  return PROGRAMS.flatMap((p, pi) => {
    const count = rand(2, 4);
    const selected = COMMODITIES.slice(pi % COMMODITIES.length, (pi % COMMODITIES.length) + count);
    return selected.map((c) => ({
      program: p,
      commodity: c,
      amount: rand(10_000_000, 150_000_000),
    }));
  });
}

function generateTrend() {
  const years = [2022, 2023, 2024, 2025, 2026];
  let base = 600_000_000;
  return years.map((year) => {
    base += rand(20_000_000, 80_000_000);
    return { year, amount: base };
  });
}

function generateFundingSourceSunburst() {
  return FUNDING_SOURCES.map((fs) => ({
    name: fs.name,
    value: Math.round(fs.share * 1_200_000_000),
    children: fs.sub
      ? fs.sub.map((s) => ({ name: s.name, value: Math.round(s.share * fs.share * 1_200_000_000) }))
      : null,
  }));
}

function generateLocalVsIntl() {
  return [
    { type: 'Local Procurement', amount: 420_000_000, pct: 35 },
    { type: 'International Procurement', amount: 780_000_000, pct: 65 },
  ];
}

function generateMOHWBS() {
  return [
    { wbs: 'WBS-EPI-001', description: 'Expanded Program on Immunization', amount: 95_000_000, program: 'EPI' },
    { wbs: 'WBS-HIV-002', description: 'HIV/AIDS Prevention & Treatment', amount: 145_000_000, program: 'HIV/AIDS' },
    { wbs: 'WBS-MAL-003', description: 'Malaria Control Program', amount: 88_000_000, program: 'Malaria' },
    { wbs: 'WBS-TB-004', description: 'TB Prevention & Control', amount: 62_000_000, program: 'TB' },
    { wbs: 'WBS-RH-005', description: 'Reproductive Health Commodities', amount: 54_000_000, program: 'Reproductive Health' },
    { wbs: 'WBS-CH-006', description: 'Child Health Program', amount: 78_000_000, program: 'Child Health' },
    { wbs: 'WBS-NUT-007', description: 'Nutrition Program', amount: 41_000_000, program: 'Nutrition' },
    { wbs: 'WBS-CC-008', description: 'Clinical Chemistry Supplies', amount: 37_000_000, program: 'Clinical Chemistry' },
  ];
}

function generateLCCADExpiry() {
  return Array.from({ length: 30 }, (_, i) => {
    lcCounter++;
    const amount = rand(200000, 15000000);
    const issueDate = new Date(2025, rand(0, 17), rand(1, 28));
    const expiryDate = new Date(issueDate);
    expiryDate.setDate(expiryDate.getDate() + rand(90, 360));
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    let status;
    if (diffDays <= 0) {
      status = 'Expired';
    } else if (diffDays <= 30) {
      status = 'Critical';
    } else if (diffDays <= 60) {
      status = 'Warning';
    } else {
      status = 'Active';
    }
    return {
      lcNo: `LC-${String(lcCounter).padStart(4, '0')}`,
      supplier: pick(SUPPLIERS),
      amount,
      amountFormatted: formatAmount(amount),
      issueDate: issueDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      status,
      daysToExpiry: diffDays,
    };
  });
}

function generateContractVsPO(contracts, pos) {
  return contracts.slice(0, 20).map((c) => {
    const relatedPOs = pos.filter((p) => p.supplier === c.supplier);
    const poAmount = relatedPOs.reduce((s, p) => s + p.amount, 0);
    const consumption = Math.round(poAmount * (0.3 + Math.random() * 0.5));
    return {
      contractNo: c.contractNo,
      supplier: c.supplier,
      contractAmount: c.amount,
      poAmount,
      consumption,
      remaining: poAmount - consumption,
      pctConsumed: Math.round((consumption / Math.max(poAmount, 1)) * 100),
    };
  });
}

function generateContractPipeline(contracts) {
  return contracts.slice(0, 20).map((c) => {
    const poPct = 0.65 + Math.random() * 0.30;
    const poAmount = Math.round(c.amount * poPct);
    const inboundPct = 0.75 + Math.random() * 0.20;
    const inbound = Math.round(poAmount * inboundPct);
    const receivedPct = 0.70 + Math.random() * 0.25;
    const received = Math.round(inbound * receivedPct);
    return {
      contractNo: c.contractNo,
      supplier: c.supplier,
      contractAmount: c.amount,
      poAmount,
      inboundDelivery: inbound,
      received,
    };
  });
}

function generatePerformanceBonds() {
  return Array.from({ length: 25 }, (_, i) => {
    bondCounter++;
    const amount = rand(50000, 2000000);
    const receivedDate = new Date(2024, rand(0, 11), rand(1, 28));
    const verifiedDate = new Date(receivedDate);
    verifiedDate.setDate(verifiedDate.getDate() + rand(5, 30));
    const expiryDate = new Date(receivedDate);
    expiryDate.setDate(expiryDate.getDate() + rand(180, 540));
    const now = new Date();
    const statuses = ['Received', 'Verified', 'Expired', 'Confiscated', 'Extended'];
    let status;
    if (expiryDate < now) status = 'Expired';
    else if (Math.random() < 0.05) status = 'Confiscated';
    else if (Math.random() < 0.1) status = 'Extended';
    else if (verifiedDate < now) status = 'Verified';
    else status = 'Received';
    return {
      bondNo: `PB-${String(bondCounter).padStart(3, '0')}`,
      supplier: pick(SUPPLIERS),
      amount,
      amountFormatted: formatAmount(amount),
      receivedDate: receivedDate.toISOString().split('T')[0],
      verifiedDate: verifiedDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      status,
    };
  });
}

function generateLeadtime(pos) {
  const details = pos.slice(0, 50).map((po) => {
    const contractDate = new Date(po.issueDate);
    contractDate.setDate(contractDate.getDate() - rand(30, 120));
    const poDate = new Date(po.issueDate);
    const lcDate = new Date(poDate);
    lcDate.setDate(lcDate.getDate() + rand(15, 60));
    const portDate = new Date(lcDate);
    portDate.setDate(portDate.getDate() + rand(30, 90));
    const clearedDate = new Date(portDate);
    clearedDate.setDate(clearedDate.getDate() + rand(5, 25));
    const receiveDate = new Date(clearedDate);
    receiveDate.setDate(receiveDate.getDate() + rand(3, 15));
    return {
      poNo: po.poNo,
      supplier: po.supplier,
      contractToPO: Math.round((poDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24)),
      poToLCOpening: Math.round((lcDate.getTime() - poDate.getTime()) / (1000 * 60 * 60 * 24)),
      lcToPortArrival: Math.round((portDate.getTime() - lcDate.getTime()) / (1000 * 60 * 60 * 24)),
      portToCleared: Math.round((clearedDate.getTime() - portDate.getTime()) / (1000 * 60 * 60 * 24)),
      clearedToReceive: Math.round((receiveDate.getTime() - clearedDate.getTime()) / (1000 * 60 * 60 * 24)),
      totalLeadtime: Math.round((receiveDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24)),
    };
  });
  const summary = {
    contractToPO: Math.round(details.reduce((s, d) => s + d.contractToPO, 0) / details.length),
    poToLCOpening: Math.round(details.reduce((s, d) => s + d.poToLCOpening, 0) / details.length),
    lcToPortArrival: Math.round(details.reduce((s, d) => s + d.lcToPortArrival, 0) / details.length),
    portToCleared: Math.round(details.reduce((s, d) => s + d.portToCleared, 0) / details.length),
    clearedToReceive: Math.round(details.reduce((s, d) => s + d.clearedToReceive, 0) / details.length),
    total: Math.round(details.reduce((s, d) => s + d.totalLeadtime, 0) / details.length),
  };
  return { summary, details };
}

function generateProcurementStatus() {
  const stages = ['Contract Signed', 'PO Issued', 'LC Opened', 'Port Arrival', 'Cleared', 'Received at Warehouse'];
  const counts = [980, 850, 720, 580, 420, 350];
  const colors = ['#00373B', '#0B4F54', '#D97706', '#216E6A', '#4A9598', '#86BFC5'];
  const details = Array.from({ length: 50 }, (_, i) => {
    const stageIdx = rand(0, 5);
    return {
      refNo: `REF-${String(i + 1).padStart(4, '0')}`,
      supplier: pick(SUPPLIERS),
      stage: stages[stageIdx],
      statusDate: new Date(2024, rand(0, 11), rand(1, 28)).toISOString().split('T')[0],
    };
  });
  return {
    stages: stages.map((s, i) => ({ stage: s, count: counts[i], color: colors[i] })),
    details,
  };
}

function generateSupplierPerformance(pos) {
  return SUPPLIERS.map((supplier) => {
    const supplierPOs = pos.filter((p) => p.supplier === supplier);
    const totalPOs = supplierPOs.length || 1;
    const avgLeadtime = rand(60, 180);
    const onTime = supplierPOs.filter((p) => p.status !== 'Overdue').length;
    return {
      supplier,
      totalPOs,
      avgLeadtime,
      onTimePct: Math.round((onTime / totalPOs) * 100),
      totalAmount: supplierPOs.reduce((s, p) => s + p.amount, 0),
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);
}

function getKpis(pos, contracts) {
  const totalPOAmount = pos.reduce((s, p) => s + p.amount, 0);
  const totalContractAmount = contracts.reduce((s, c) => s + c.amount, 0);
  return {
    totalPO: pos.length,
    totalPOAmount,
    totalPOFormatted: formatAmount(totalPOAmount),
    totalContracts: contracts.length,
    totalContractAmount,
    totalContractFormatted: formatAmount(totalContractAmount),
  };
}

export default function generateAllData() {
  const pos = generatePOs(150);
  const contracts = generateContracts(100);
  const leadtime = generateLeadtime(pos);
  return {
    kpis: getKpis(pos, contracts),
    openOverduePOs: pos.filter((p) => p.status === 'Open' || p.status === 'Overdue'),
    allPOs: pos,
    supplierShare: generateSupplierShare(),
    commodityByProgram: generateCommodityByProgram(),
    trend: generateTrend(),
    fundingSources: generateFundingSourceSunburst(),
    localVsIntl: generateLocalVsIntl(),
    mohWBS: generateMOHWBS(),
    lcCadExpiry: lcCadExpiryRaw.data.map(d => ({
      lcNo: d.lcCadReferenceNumber || d.purchaseOrderNumber,
      supplier: d.supplierName,
      amount: d.amount,
      issueDate: d.purchaseOrderDate,
      expiryDate: d.effectiveExpiryDate,
      status: d.expiryStatus,
      daysToExpiry: d.daysUntilExpiry,
    })).sort((a, b) => {
      const priority = { EXPIRES_TODAY: 0, EXPIRES_WITHIN_7_DAYS: 0, EXPIRES_WITHIN_30_DAYS: 0, EXPIRES_WITHIN_60_DAYS: 1, EXPIRED: 3 };
      const pa = priority[a.status] ?? 2;
      const pb = priority[b.status] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.daysToExpiry - b.daysToExpiry;
    }),
    lcCadExpirySummary: lcCadExpirySummaryRaw.data,
    contractVsPO: generateContractVsPO(contracts, pos),
    contractPipeline: generateContractPipeline(contracts),
    performanceBonds: generatePerformanceBonds(),
    leadtime,
    procurementStatus: generateProcurementStatus(),
    supplierPerformance: generateSupplierPerformance(pos),
    supplierRiskRanking: supplierRiskRankingRaw.data,
    supplierPerformanceLeaderboard: supplierPerformanceLeaderboardRaw.data,
    supplierPerformanceSummary: supplierPerformanceSummaryRaw.data,
    contractToReceiveTracking: contractToReceiveTrackingRaw.data,
    yearlyContractToReceipt: yearlyContractToReceiptRaw,
    openPOByType: openPOByMaterialTypeRaw,
    openPOItemDetail: openPOItemDetailRaw,
    overduePOScheduleLine: overduePOScheduleLineRaw,
    overduePOSummary: overduePOSummaryRaw,
  };
}
