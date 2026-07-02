import KPICard from '../../components/KPICard';
import InfoButton from '../../components/InfoButton';
import LeadtimeMilestoneTracker from '../../components/LeadtimeMilestoneTracker';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';

const fmtDuration = (days) => {
  if (days == null || days < 0) return null;
  if (days === 0) return '0d';
  if (days >= 365) {
    const y = Math.round(days / 365);
    const rem = Math.round((days % 365) / 30);
    return rem ? `${y}y ${rem}mo` : `${y}y`;
  }
  if (days >= 90) return `${Math.round(days / 30)}mo`;
  if (days >= 30) {
    const mo = Math.floor(days / 30);
    const d = days % 30;
    return d ? `${mo}mo ${d}d` : `${mo}mo`;
  }
  if (days >= 7) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    return d ? `${w}w ${d}d` : `${w}w`;
  }
  return `${days}d`;
};

export default function PerformanceComplianceTab({ data, activeSections, tp, sp }: any) {
  return (
    <>
      {activeSections.includes('ppc-leadtime') && (
        <section id="ppc-leadtime">
          <SectionPanel title="Leadtime Analysis" subtitle="Average processing times across procurement stages" action={<InfoButton contentId="po-leadtime" />}>
            {data.leadtime.milestone && (
              <LeadtimeMilestoneTracker
                averageIndex={data.leadtime.milestone.averageIndex}
                totalCount={data.leadtime.milestone.totalCount}
              />
            )}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <KPICard variant="detailed" icon="fa-file-signature" iconBg="bg-primary/10" iconColor="text-primary" label="Contract → PO" value={fmtDuration(data.leadtime.summary.contractToPO)} subtitle="Tender process" />
              <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="PO → LC Opening" value={fmtDuration(data.leadtime.summary.poToLCOpening)} subtitle="Contract management" />
              <KPICard variant="detailed" icon="fa-ship" iconBg="bg-warning/10" iconColor="text-warning" label="LC → Port Arrival" value={fmtDuration(data.leadtime.summary.lcToPortArrival)} subtitle="Supplier lead" />
              <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Port → Cleared" value={fmtDuration(data.leadtime.summary.portToCleared)} subtitle="Customs & clearance" />
              <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Cleared → Received" value={fmtDuration(data.leadtime.summary.clearedToReceive)} subtitle="Inbound delivery" />
            </div>
            <Table page={tp('leadtime')} setPage={sp('leadtime')}
              headers={[
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
              <SectionPanel title="Supplier Performance Tracking" subtitle="Delivery performance leaderboard based on evaluated delivery records" action={<InfoButton contentId="po-supplier-perf" />}>
                {s && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <KPICard variant="detailed" icon="fa-building" iconBg="bg-primary/10" iconColor="text-primary" label="Suppliers" value={s.supplierCount.toLocaleString()} subtitle={`${s.purchaseOrderCount.toLocaleString()} POs`} />
                    <KPICard variant="detailed" icon="fa-truck" iconBg="bg-success/10" iconColor="text-success" label="Favorable Rate" value={`${s.performanceRatesPercent.favorableRate}%`} subtitle={`${s.performanceMeasurementCounts.favorableRecordCount.toLocaleString()} of ${s.performanceMeasurementCounts.evaluatedRecordCount.toLocaleString()}`} />
                    <KPICard variant="detailed" icon="fa-exclamation-circle" iconBg="bg-warning/10" iconColor="text-warning" label="Overdue Schedule" value={s.overdueScheduleLineCount.toLocaleString()} subtitle={`${s.overdueOpenAmountPercent}% overdue amount`} />
                    <KPICard variant="detailed" icon="fa-clock" iconBg="bg-error/10" iconColor="text-error" label="Open Amount" value={`${formatAmount(s.totalOpenAmount)} ETB`} subtitle={`${formatAmount(s.totalOverdueOpenAmount)} overdue`} />
                  </div>
                )}
                <Table page={tp('supplier-perf')} setPage={sp('supplier-perf')}
                  headers={[
                    { key: 'rank', label: 'Rank', className: 'text-center w-12' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'country', label: 'Country', className: 'text-center' },
                    { key: 'pos', label: 'POs', className: 'text-right' },
                    { key: 'items', label: 'Items', className: 'text-right' },
                    { key: 'favorable', label: 'Delivery Rate', className: 'text-right' },
                    { key: 'secondary', label: 'Perf. Rate', className: 'text-right' },
                    { key: 'overdueLines', label: 'Overdue Lines', className: 'text-right' },
                    { key: 'maxOverdue', label: 'Max Overdue', className: 'text-right' },
                  ]}
                  rows={data.supplierPerformanceLeaderboard}
                  renderRow={(row) => {
                    const pctColor = row.favorableDeliveryRatePercent != null
                      ? row.favorableDeliveryRatePercent >= 80 ? 'text-success'
                        : row.favorableDeliveryRatePercent >= 50 ? 'text-warning'
                        : 'text-error'
                      : 'text-on-surface-variant';
                    return (
                      <>
                        <Td className="text-center font-bold text-on-surface-variant">#{row.rank}</Td>
                        <Td className="font-bold max-w-[220px] truncate" title={row.supplierName}>{row.supplierName}</Td>
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
              <SectionPanel title="Supplier Risk Ranking" subtitle="Risk assessment based on overdue amounts, delivery rates, and max days overdue" action={<InfoButton contentId="po-supplier-risk" />}>
                <Table page={tp('supplier-risk')} setPage={sp('supplier-risk')}
                  headers={[
                    { key: 'rank', label: 'Rank', className: 'text-center w-12' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'country', label: 'Country', className: 'text-center' },
                    { key: 'poItems', label: 'PO Items', className: 'text-right' },
                    { key: 'favorableRate', label: 'Delivery Rate', className: 'text-right' },
                    { key: 'overduePct', label: 'Overdue %', className: 'text-right' },
                    { key: 'maxOverdue', label: 'Max Overdue', className: 'text-right' },
                    { key: 'openAmount', label: 'Open Amount', className: 'text-right' },
                    { key: 'riskLevel', label: 'Risk', className: 'text-center' },
                  ]}
                  rows={risk}
                  renderRow={(row) => {
                    const levelColors = { LOW: 'bg-success/10 text-success', MODERATE: 'bg-warning/10 text-warning', HIGH: 'bg-orange-100 text-orange-700', CRITICAL: 'bg-error/10 text-error' };
                    const flag = row.supplierCountryCode;
                    return (
                      <>
                        <Td className="text-center font-bold text-on-surface-variant">#{row.rank}</Td>
                        <Td className="font-bold max-w-[240px] truncate" title={row.supplierName}>{row.supplierName}</Td>
                        <Td className="text-center">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-surface-container rounded">{flag}</span>
                        </Td>
                        <Td className="text-right">{row.purchaseOrderItemCount.toLocaleString()}</Td>
                        <Td className="text-right">{row.favorableDeliveryRatePercent != null ? `${row.favorableDeliveryRatePercent}%` : '—'}</Td>
                        <Td className="text-right">{row.overdueOpenAmountPercent}%</Td>
                        <Td className="text-right font-mono">{fmtDuration(row.maximumDaysOverdue)}</Td>
                        <Td className="text-right font-mono">{formatAmount(row.totalOpenAmount)}</Td>
                        <Td className="text-center">
                          <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${levelColors[row.riskLevel] || 'bg-surface-container text-on-surface-variant'}`}>
                            {row.riskLevel}
                          </span>
                        </Td>
                      </>
                    );
                  }}
                />
              </SectionPanel>
            );
          })()}
        </section>
      )}

      {activeSections.includes('ppc-bond') && (
        <section id="ppc-bond">
          <SectionPanel title="Performance Bond Report" subtitle="Received, Verified, Expiry, Confiscated, Extended" action={<InfoButton contentId="po-bond" />}>
            {(() => {
              const bonds = data.performanceBonds;
              const totalAmount = bonds.reduce((s, b) => s + b.amount, 0);
              const statusGroups = bonds.reduce((acc, b) => {
                if (!acc[b.status]) acc[b.status] = { count: 0, total: 0 };
                acc[b.status].count++;
                acc[b.status].total += b.amount;
                return acc;
              }, {});
              const expiredCount = (statusGroups['Expired']?.count || 0) + (statusGroups['Confiscated']?.count || 0);
              return (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <KPICard variant="detailed" icon="fa-file-contract" iconBg="bg-primary/10" iconColor="text-primary" label="Total Bonds" value={bonds.length.toLocaleString()} subtitle={`Value: $${formatAmount(totalAmount)}`} />
                    <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Verified / Active" value={((statusGroups['Verified']?.count || 0) + (statusGroups['Received']?.count || 0)).toLocaleString()} subtitle="in good standing" />
                    <KPICard variant="detailed" icon="fa-clock" iconBg="bg-warning/10" iconColor="text-warning" label="Extended" value={(statusGroups['Extended']?.count || 0).toLocaleString()} subtitle="term extended" />
                    <KPICard variant="detailed" icon="fa-exclamation-triangle" iconBg="bg-error/10" iconColor="text-error" label="Expired / Confiscated" value={expiredCount.toLocaleString()} subtitle="requires action" />
                  </div>
                  <Table page={tp('bond')} setPage={sp('bond')}
                    headers={[
                      { key: 'bondNo', label: 'Bond No' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'amount', label: 'Amount (ETB)', className: 'text-right' },
                      { key: 'received', label: 'Received Date' },
                      { key: 'verified', label: 'Verified Date' },
                      { key: 'expiry', label: 'Expiry Date' },
                      { key: 'status', label: 'Status' },
                    ]}
                    rows={data.performanceBonds}
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
