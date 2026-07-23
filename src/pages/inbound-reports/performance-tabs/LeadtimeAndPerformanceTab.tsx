import { useState, useRef, useEffect } from 'react';
import AutoScrollKPIRow from '../../../components/AutoScrollKPIRow';
import KpiCarousel from '../../../components/KpiCarousel';
import KPICard from '../../../components/KPICard';
import IconButton from '../../../components/IconButton';
import MilestoneRingStepper from '../../../components/MilestoneRingStepper';
import { LEADTIME_MILESTONE_STEPS } from '../../../utils/leadtimeMilestones';
import Table, { Td } from '../../../components/BaseTable';
import { StatusBadge, SectionPanel, formatAmount } from './poShared';
import ExportDropdown from '../../../components/ExportDropdown';
import LandscapeToggle from '../../../components/LandscapeToggle';

const fmtDuration = (days) => {
  if (days == null || days < 0) return null;
  return `${days}d`;
};

export default function LeadtimeAndPerformanceTab({ data, activeSections, tp, sp }: any) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [supplierPerfLandscape, setSupplierPerfLandscape] = useState(false);
  const [supplierRiskLandscape, setSupplierRiskLandscape] = useState(false);
  const supplierPerfScrollRef = useRef<HTMLDivElement>(null);
  const supplierRiskScrollRef = useRef<HTMLDivElement>(null);
  const [bondStatusFilter, setBondStatusFilter] = useState('All');
  const BOND_STATUS_PRIORITY = { 'VALID': 0, 'RECEIVED_EXPIRY_MISSING': 1, 'SUBMITTED_NOT_RECEIVED': 2, 'EXPIRING_WITHIN_30_DAYS': 3, 'EXPIRED': 4, 'MISSING': 5 };
  const sortedBonds = [...(data.performanceBonds || [])].sort((a, b) => (BOND_STATUS_PRIORITY[a.status] ?? 99) - (BOND_STATUS_PRIORITY[b.status] ?? 99));
  const filteredBonds = bondStatusFilter === 'All' ? sortedBonds : sortedBonds.filter(b => b.status === bondStatusFilter);

  return (
    <>
      {activeSections.includes('ppc-leadtime') && (
        <section id="ppc-leadtime">
          <SectionPanel title="Leadtime Analysis" subtitle="Average processing times across procurement stages" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-leadtime" /><ExportDropdown headers={[{ key: 'poNo', label: 'PO No' }, { key: 'supplier', label: 'Supplier' }, { key: 'contractToPO', label: 'C→PO' }, { key: 'poToLCOpening', label: 'PO→LC' }, { key: 'lcToPortArrival', label: 'LC→Port' }, { key: 'portToCleared', label: 'Port→Clr' }, { key: 'clearedToReceive', label: 'Clr→Rcv' }, { key: 'totalLeadtime', label: 'Total' }]} rows={data.leadtime.details} filename="leadtime" /></div>}>

            {isMobile ? (
              <KpiCarousel>
                <KPICard variant="detailed" icon="fa-file-signature" iconBg="bg-primary/10" iconColor="text-primary" label="Contract → PO" value={120} subtitle="Tender process" />
                <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="PO → LC Opening" value={104} subtitle="Contract management" />
                <KPICard variant="detailed" icon="fa-ship" iconBg="bg-warning/10" iconColor="text-warning" label="LC → Port Arrival" value={110} subtitle="Supplier lead" />
                <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Port → Cleared" value={9.7} subtitle="Customs & clearance" />
                <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Cleared → Received" value={23} subtitle="Inbound delivery" />
              </KpiCarousel>
            ) : (
              <AutoScrollKPIRow cards={[
                { icon: 'fa-file-signature', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: 'Contract → PO', value: 120, subtitle: 'Tender process' },
                { icon: 'fa-file-invoice', iconBg: 'bg-[#4A8EA5]/10', iconColor: 'text-[#4A8EA5]', label: 'PO → LC Opening', value: 104, subtitle: 'Contract management' },
                { icon: 'fa-ship', iconBg: 'bg-warning/10', iconColor: 'text-warning', label: 'LC → Port Arrival', value: 110, subtitle: 'Supplier lead' },
                { icon: 'fa-check-circle', iconBg: 'bg-success/10', iconColor: 'text-success', label: 'Port → Cleared', value: 9.7, subtitle: 'Customs & clearance' },
                { icon: 'fa-warehouse', iconBg: 'bg-success/10', iconColor: 'text-success', label: 'Cleared → Received', value: 23, subtitle: 'Inbound delivery' },
              ]} />
            )}
            <div className="flex items-center gap-3 mb-2 mt-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-outline-variant to-outline-variant" />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap select-none">
                <i className="fa-solid fa-ellipsis-h text-[8px] opacity-50" />
                Process Overview
                <i className="fa-solid fa-ellipsis-h text-[8px] opacity-50" />
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-outline-variant to-outline-variant" />
            </div>
                        {data.leadtime.milestone && (() => {
              const MILESTONE_ICONS = [
                'fa-file-pen', 'fa-gavel', 'fa-trophy', 'fa-handshake',
                'fa-clipboard-list', 'fa-coins', 'fa-ship', 'fa-box-open', 'fa-check-double',
              ];
              const merged = LEADTIME_MILESTONE_STEPS.map((step, i) => ({
                key: `step-${i}`,
                label: step.label,
                icon: MILESTONE_ICONS[i] || 'fa-circle',
                count: data.leadtime.milestone.counts[i] || 0,
                percent: i < 3 ? 0 : (data.leadtime.milestone.percentages[i] || 0),
                hasData: i < 3 ? true : step.dataAvailable && (data.leadtime.milestone.counts[i] || 0) > 0,
              }));
              const s = data.leadtime.summary;
              const connectorAverages: (number | null)[] = [
                null, null, null,
                120,
                104,
                110,
                9.7,
                23,
              ];
              const connectorTargets: (number | null)[] = [null, null, null, 14.5, 29, 61.75, 30, 3];
              return (
                <div className="-mt-4 mb-5">
                  <MilestoneRingStepper milestones={merged} connectorAverages={connectorAverages} connectorTargets={connectorTargets} />
                </div>
              );
            })()}
            <Table page={tp('leadtime')} setPage={sp('leadtime')}
              columns={[
                { key: 'poNo', label: 'PO No' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'ctPO', label: 'C→PO', className: 'text-right' },
                { key: 'poLC', label: 'PO→LC', className: 'text-right' },
                { key: 'lcPort', label: 'LC→Port', className: 'text-right' },
                { key: 'portClear', label: 'Port→Clr', className: 'text-right' },
                { key: 'clearRecv', label: 'Clr→Rcv', className: 'text-right' },
                { key: 'total', label: 'Total', className: 'text-right' },
              ]}
              rows={data.leadtime.details}
              renderRow={(row) => (
                <>
                  <Td className="font-mono">{row.poNo}</Td>
                  <Td>{row.supplier}</Td>
                  <Td className="text-right">{fmtDuration(row.contractToPO)}</Td>
                  <Td className="text-right">{fmtDuration(row.poToLCOpening)}</Td>
                  <Td className="text-right">{fmtDuration(row.lcToPortArrival)}</Td>
                  <Td className="text-right">{fmtDuration(row.portToCleared)}</Td>
                  <Td className="text-right">{fmtDuration(row.clearedToReceive)}</Td>
                  <Td className="text-right font-bold">{fmtDuration(row.totalLeadtime)}</Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-supplier-perf') && (
        <section id="ppc-supplier-perf">
          {(() => {
            const s = data.supplierPerformanceSummary;
            return (
              <SectionPanel title="Supplier Performance Tracking" subtitle="Delivery performance leaderboard based on evaluated delivery records" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-supplier-perf" /><ExportDropdown headers={[{ key: 'rank', label: 'Rank' }, { key: 'supplierName', label: 'Supplier' }, { key: 'supplierCountryCode', label: 'Country' }, { key: 'purchaseOrderCount', label: 'POs' }, { key: 'purchaseOrderItemCount', label: 'Items' }, { key: 'favorableDeliveryRatePercent', label: 'Delivery Rate' }, { key: 'secondaryPerformanceRatePercent', label: 'Perf. Rate' }, { key: 'overdueScheduleLineCount', label: 'Overdue Lines' }, { key: 'maximumDaysOverdue', label: 'Max Overdue' }]} rows={data.supplierPerformanceLeaderboard} filename="supplier-performance" /></div>}>
                {s && (
                  isMobile ? (
                    <KpiCarousel>
                      <KPICard variant="detailed" icon="fa-building" iconBg="bg-primary/10" iconColor="text-primary" label="Suppliers" value={s.supplierCount.toLocaleString()} subtitle={`${s.purchaseOrderCount.toLocaleString()} POs`} />
                      <KPICard variant="detailed" icon="fa-truck" iconBg="bg-success/10" iconColor="text-success" label="Favorable Rate" value={`${s.performanceRatesPercent.favorableRate}%`} subtitle={`${s.performanceMeasurementCounts.favorableRecordCount.toLocaleString()} of ${s.performanceMeasurementCounts.evaluatedRecordCount.toLocaleString()}`} />
                      <KPICard variant="detailed" icon="fa-exclamation-circle" iconBg="bg-warning/10" iconColor="text-warning" label="Overdue Schedule" value={s.overdueScheduleLineCount.toLocaleString()} subtitle={`${s.overdueOpenAmountPercent}% overdue amount`} />
                      <KPICard variant="detailed" icon="fa-clock" iconBg="bg-error/10" iconColor="text-error" label="Open Amount" value={`${formatAmount(s.totalOpenAmount)} ETB`} subtitle={`${formatAmount(s.totalOverdueOpenAmount)} overdue`} />
                    </KpiCarousel>
                  ) : (
                    <AutoScrollKPIRow cards={[
                      { icon: 'fa-building', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: 'Suppliers', value: s.supplierCount.toLocaleString(), subtitle: `${s.purchaseOrderCount.toLocaleString()} POs` },
                      { icon: 'fa-truck', iconBg: 'bg-success/10', iconColor: 'text-success', label: 'Favorable Rate', value: `${s.performanceRatesPercent.favorableRate}%`, subtitle: `${s.performanceMeasurementCounts.favorableRecordCount.toLocaleString()} of ${s.performanceMeasurementCounts.evaluatedRecordCount.toLocaleString()}` },
                      { icon: 'fa-exclamation-circle', iconBg: 'bg-warning/10', iconColor: 'text-warning', label: 'Overdue Schedule', value: s.overdueScheduleLineCount.toLocaleString(), subtitle: `${s.overdueOpenAmountPercent}% overdue amount` },
                      { icon: 'fa-clock', iconBg: 'bg-error/10', iconColor: 'text-error', label: 'Open Amount', value: `${formatAmount(s.totalOpenAmount)} ETB`, subtitle: `${formatAmount(s.totalOverdueOpenAmount)} overdue` },
                    ]} />
                  )
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {data.supplierPerformanceLeaderboard?.length || 0} suppliers
                  </span>
                  {isMobile && <LandscapeToggle value={supplierPerfLandscape} onChange={setSupplierPerfLandscape} />}
                </div>
                <div
                  ref={supplierPerfScrollRef}
                  className="overflow-x-auto relative"
                  style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' } as any}
                >
<div style={{ minWidth: isMobile ? (supplierPerfLandscape ? '1200px' : 'auto') : 'auto', transition: 'min-width 180ms ease' }}>
                     <Table page={tp('supplier-perf')} setPage={sp('supplier-perf')}
                  columns={[
                    { key: 'supplier', label: 'Supplier', className: 'truncate' },
                    { key: 'country', label: 'Country', className: 'text-center' },
                    { key: 'pos', label: 'POs', className: 'text-right' },
                    { key: 'items', label: 'Items', className: 'text-right' },
                    { key: 'favorable', label: 'Delivery Rate', className: 'text-right' },
                    { key: 'secondary', label: 'Perf. Rate', className: 'text-right' },
                    { key: 'overdueLines', label: 'Overdue Lines', className: 'text-right' },
                    { key: 'maxOverdue', label: 'Max Overdue', className: 'text-right' },
                  ]}
                  rows={data.supplierPerformanceLeaderboard}
                  mobileMinWidth="auto"
                  renderRow={(row) => {
                    const pctColor = row.favorableDeliveryRatePercent != null
                      ? row.favorableDeliveryRatePercent >= 80 ? 'text-success'
                        : row.favorableDeliveryRatePercent >= 50 ? 'text-warning'
                        : 'text-error'
                      : 'text-on-surface-variant';
                    return (
                      <>
                        <Td className="font-bold" title={row.supplierName}>
                          <span className={`block ${supplierPerfLandscape || !isMobile ? '' : 'truncate max-w-[100px] md:max-w-none'}`}>{row.supplierName}</span>
                        </Td>
                        <Td className="text-center">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-surface-container rounded">{row.supplierCountryCode}</span>
                        </Td>
                        <Td className="text-right">{row.purchaseOrderCount.toLocaleString()}</Td>
                        <Td className="text-right">{row.purchaseOrderItemCount.toLocaleString()}</Td>
                        <Td className={`text-right font-bold ${pctColor}`}>{row.favorableDeliveryRatePercent != null ? `${row.favorableDeliveryRatePercent}%` : '—'}</Td>
                        <Td className="text-right">{row.secondaryPerformanceRatePercent != null ? `${row.secondaryPerformanceRatePercent}%` : '—'}</Td>
                        <Td className="text-right">{row.overdueScheduleLineCount.toLocaleString()}</Td>
                        <Td className="text-right font-mono">{row.maximumDaysOverdue != null ? fmtDuration(row.maximumDaysOverdue) : '—'}</Td>
                      </>
                    );
                  }}
                    />
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
              </SectionPanel>
            );
          })()}
        </section>
      )}

      {activeSections.includes('ppc-supplier-risk') && (
        <section id="ppc-supplier-risk">
          {(() => {
            const risk = data.supplierRiskRanking || [];
            return (
              <SectionPanel title="Supplier Risk Ranking" subtitle="Risk assessment based on overdue amounts, delivery rates, and max days overdue" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-supplier-risk" /><ExportDropdown headers={[{ key: 'rank', label: 'Rank' }, { key: 'supplierName', label: 'Supplier' }, { key: 'supplierCountryCode', label: 'Country' }, { key: 'purchaseOrderItemCount', label: 'PO Items' }, { key: 'favorableDeliveryRatePercent', label: 'Delivery Rate' }, { key: 'overdueOpenAmountPercent', label: 'Overdue %' }, { key: 'maximumDaysOverdue', label: 'Max Overdue' }, { key: 'totalOpenAmount', label: 'Open Amount' }, { key: 'riskLevel', label: 'Risk' }]} rows={risk} filename="supplier-risk" /></div>}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {risk?.length || 0} suppliers
                  </span>
                  {isMobile && <LandscapeToggle value={supplierRiskLandscape} onChange={setSupplierRiskLandscape} />}
                </div>
                <div
                  ref={supplierRiskScrollRef}
                  className="overflow-x-auto relative"
                  style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' } as any}
                >
<div style={{ minWidth: isMobile ? (supplierRiskLandscape ? '1200px' : 'auto') : 'auto', transition: 'min-width 180ms ease' }}>
                     <Table page={tp('supplier-risk')} setPage={sp('supplier-risk')}
                  columns={[
                    { key: 'supplier', label: 'Supplier', className: 'truncate' },
                    { key: 'country', label: 'Country', className: `text-center ${supplierRiskLandscape ? '' : 'hidden md:table-cell'}` },
                    { key: 'poItems', label: 'PO Items', className: `text-right ${supplierRiskLandscape ? '' : 'hidden md:table-cell'}` },
                    { key: 'favorableRate', label: 'Delivery Rate', className: `text-right ${supplierRiskLandscape ? '' : 'hidden lg:table-cell'}` },
                    { key: 'overduePct', label: 'Overdue %', className: 'text-right' },
                    { key: 'maxOverdue', label: 'Max Overdue', className: `text-right ${supplierRiskLandscape ? '' : 'hidden lg:table-cell'}` },
                    { key: 'openAmount', label: 'Open Amount', className: `text-right ${supplierRiskLandscape ? '' : 'hidden lg:table-cell'}` },
                    { key: 'riskLevel', label: 'Risk', className: 'text-center' },
                  ]}
                  rows={risk}
                  mobileMinWidth="auto"
                  renderRow={(row) => {
                    const levelColors = { LOW: 'bg-success/10 text-success', MODERATE: 'bg-warning/10 text-warning', HIGH: 'bg-orange-100 text-orange-700', CRITICAL: 'bg-error/10 text-error' };
                    const flag = row.supplierCountryCode;
                    return (
                      <>
                        <Td className="font-bold" title={row.supplierName}>
                          <span className={`block ${supplierRiskLandscape || !isMobile ? '' : 'truncate max-w-[100px] md:max-w-none'}`}>{row.supplierName}</span>
                        </Td>
                        <Td className={`text-center ${supplierRiskLandscape || !isMobile ? '' : 'hidden md:table-cell'}`}>
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-surface-container rounded">{flag}</span>
                        </Td>
                        <Td className={`text-right ${supplierRiskLandscape || !isMobile ? '' : 'hidden md:table-cell'}`}>{row.purchaseOrderItemCount.toLocaleString()}</Td>
                        <Td className={`text-right ${supplierRiskLandscape || !isMobile ? '' : 'hidden lg:table-cell'}`}>{row.favorableDeliveryRatePercent != null ? `${row.favorableDeliveryRatePercent}%` : '—'}</Td>
                        <Td className="text-right">{row.overdueOpenAmountPercent}%</Td>
                        <Td className={`text-right font-mono ${supplierRiskLandscape || !isMobile ? '' : 'hidden lg:table-cell'}`}>{fmtDuration(row.maximumDaysOverdue)}</Td>
                        <Td className={`text-right font-mono ${supplierRiskLandscape || !isMobile ? '' : 'hidden lg:table-cell'}`}>{formatAmount(row.totalOpenAmount)}</Td>
                        <Td className="text-center">
                          <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${levelColors[row.riskLevel] || 'bg-surface-container text-on-surface-variant'}`}>
                            {row.riskLevel}
                          </span>
                        </Td>
                      </>
                    );
                  }}
                    />
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
              </SectionPanel>
            );
          })()}
        </section>
      )}

      {activeSections.includes('ppc-bond') && (
        <section id="ppc-bond">
          <SectionPanel title="Performance Bond Report" subtitle="Received, Verified, Expiry, Confiscated, Extended" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-bond" /><ExportDropdown headers={[{ key: 'bondNo', label: 'Bond No' }, { key: 'supplier', label: 'Supplier' }, { key: 'amount', label: 'Amount (ETB)' }, { key: 'receivedDate', label: 'Received Date' }, { key: 'verifiedDate', label: 'Verified Date' }, { key: 'expiryDate', label: 'Expiry Date' }, { key: 'status', label: 'Status' }]} rows={data.performanceBonds} filename="performance-bonds" /></div>}>
            {(() => {
              const bonds = data.performanceBonds;
              const totalAmount = bonds.reduce((s, b) => s + b.amount, 0);
              const statusGroups = bonds.reduce((acc, b) => {
                if (!acc[b.status]) acc[b.status] = { count: 0, total: 0 };
                acc[b.status].count++;
                acc[b.status].total += b.amount;
                return acc;
              }, {});
              const activeCount = (statusGroups['VALID']?.count || 0);
              const pendingCount = (statusGroups['SUBMITTED_NOT_RECEIVED']?.count || 0) + (statusGroups['EXPIRING_WITHIN_30_DAYS']?.count || 0);
              const expiredCount = (statusGroups['EXPIRED']?.count || 0);
              const missingCount = (statusGroups['MISSING']?.count || 0);
              const submittedNotRecv = statusGroups['SUBMITTED_NOT_RECEIVED'];
              const atRiskAmt = (statusGroups['EXPIRING_WITHIN_30_DAYS']?.total || 0) + (statusGroups['EXPIRED']?.total || 0) + (statusGroups['MISSING']?.total || 0);
              return (
                <>
                  {isMobile ? (
                    <KpiCarousel>
                      <KPICard variant="detailed" icon="fa-file-contract" iconBg="bg-primary/10" iconColor="text-primary" label="Total Bonds" value={bonds.length.toLocaleString()} subtitle={`Value: $${formatAmount(totalAmount)}`} />
                      <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Valid" value={activeCount.toLocaleString()} subtitle="in good standing" />
                      <KPICard variant="detailed" icon="fa-paper-plane" iconBg="bg-warning/10" iconColor="text-warning" label="Submitted Not Received" value={submittedNotRecv?.count.toLocaleString() || '0'} subtitle={`${formatAmount(submittedNotRecv?.total || 0)} ETB`} />
                      <KPICard variant="detailed" icon="fa-calendar-xmark" iconBg="bg-error/10" iconColor="text-error" label="Expired" value={expiredCount.toLocaleString()} subtitle={`${formatAmount(statusGroups['EXPIRED']?.total || 0)} ETB`} />
                      <KPICard variant="detailed" icon="fa-circle-exclamation" iconBg="bg-error/10" iconColor="text-error" label="Missing" value={missingCount.toLocaleString()} subtitle={`${formatAmount(statusGroups['MISSING']?.total || 0)} ETB`} />
                      <KPICard variant="detailed" icon="fa-triangle-exclamation" iconBg="bg-error/10" iconColor="text-error" label="At Risk Open Value" value={`${formatAmount(atRiskAmt)} ETB`} subtitle="expiring / expired / missing" />
                    </KpiCarousel>
                  ) : (
                    <AutoScrollKPIRow cards={[
                      { icon: 'fa-file-contract', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: 'Total Bonds', value: bonds.length.toLocaleString(), subtitle: `Value: $${formatAmount(totalAmount)}` },
                      { icon: 'fa-check-circle', iconBg: 'bg-success/10', iconColor: 'text-success', label: 'Valid', value: activeCount.toLocaleString(), subtitle: 'in good standing' },
                      { icon: 'fa-paper-plane', iconBg: 'bg-warning/10', iconColor: 'text-warning', label: 'Submitted Not Received', value: submittedNotRecv?.count.toLocaleString() || '0', subtitle: `${formatAmount(submittedNotRecv?.total || 0)} ETB` },
                      { icon: 'fa-calendar-xmark', iconBg: 'bg-error/10', iconColor: 'text-error', label: 'Expired', value: expiredCount.toLocaleString(), subtitle: `${formatAmount(statusGroups['EXPIRED']?.total || 0)} ETB` },
                      { icon: 'fa-circle-exclamation', iconBg: 'bg-error/10', iconColor: 'text-error', label: 'Missing', value: missingCount.toLocaleString(), subtitle: `${formatAmount(statusGroups['MISSING']?.total || 0)} ETB` },
                      { icon: 'fa-triangle-exclamation', iconBg: 'bg-error/10', iconColor: 'text-error', label: 'At Risk Open Value', value: `${formatAmount(atRiskAmt)} ETB`, subtitle: 'expiring / expired / missing' },
                    ]} />
                  )}
                  <div className="flex items-center justify-between my-4">
                    <span className="text-xs text-on-surface-variant font-medium">{filteredBonds.length} of {bonds.length} bonds</span>
                    <select value={bondStatusFilter} onChange={(e) => setBondStatusFilter(e.target.value)}
                      className="h-8 rounded-md border border-outline-variant bg-white px-2 text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="All">All Statuses</option>
                      {[...new Set(bonds.map(b => b.status).filter(Boolean))].map((s: string) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <Table page={tp('bond')} setPage={sp('bond')}
                    columns={[
                      { key: 'bondNo', label: 'Bond No' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'amount', label: 'Amount (ETB)', className: 'text-right' },
                      { key: 'received', label: 'Received Date' },
                      { key: 'verified', label: 'Verified Date' },
                      { key: 'expiry', label: 'Expiry Date' },
                      { key: 'status', label: 'Status' },
                    ]}
                    rows={filteredBonds}
                    renderRow={(row) => (
                      <>
                        <Td className="font-mono">{row.bondNo}</Td>
                        <Td>{row.supplier}</Td>
                        <Td className="text-right font-mono">{formatAmount(row.amount)}</Td>
                        <Td>{row.receivedDate}</Td>
                        <Td>{row.verifiedDate}</Td>
                        <Td>{row.expiryDate}</Td>
                        <Td><StatusBadge status={row.status} /></Td>
                      </>
                    )}
                  />
                </>
              );
            })()}
          </SectionPanel>
        </section>
      )}
    </>
  );
}
