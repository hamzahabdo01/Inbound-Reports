import KPICard from '../../components/KPICard';
import InfoButton from '../../components/InfoButton';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';

export default function PerformanceComplianceTab({ data, activeSections, tp, sp }) {
  return (
    <>
      {activeSections.includes('ppc-leadtime') && (
        <section id="ppc-leadtime">
          <SectionPanel title="Leadtime Analysis" subtitle="Average processing times across procurement stages" action={<InfoButton contentId="po-leadtime" />}>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <KPICard variant="detailed" icon="fa-file-signature" iconBg="bg-primary/10" iconColor="text-primary" label="Contract → PO" value={`${data.leadtime.summary.contractToPO}d`} subtitle="Tender process" />
              <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="PO → LC Opening" value={`${data.leadtime.summary.poToLCOpening}d`} subtitle="Contract management" />
              <KPICard variant="detailed" icon="fa-ship" iconBg="bg-warning/10" iconColor="text-warning" label="LC → Port Arrival" value={`${data.leadtime.summary.lcToPortArrival}d`} subtitle="Supplier lead" />
              <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Port → Cleared" value={`${data.leadtime.summary.portToCleared}d`} subtitle="Customs & clearance" />
              <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Cleared → Received" value={`${data.leadtime.summary.clearedToReceive}d`} subtitle="Inbound delivery" />
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
                  <Td className="text-right">{row.contractToPO}d</Td>
                  <Td className="text-right">{row.poToLCOpening}d</Td>
                  <Td className="text-right">{row.lcToPortArrival}d</Td>
                  <Td className="text-right">{row.portToCleared}d</Td>
                  <Td className="text-right">{row.clearedToReceive}d</Td>
                  <Td className="text-right font-bold">{row.totalLeadtime}d</Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-supplier-perf') && (
        <section id="ppc-supplier-perf">
          <SectionPanel title="Supplier Performance Tracking" subtitle="Average lead time and on-time delivery percentage" action={<InfoButton contentId="po-supplier-perf" />}>
            <Table page={tp('supplier-perf')} setPage={sp('supplier-perf')}
              headers={[
                { key: 'supplier', label: 'Supplier' },
                { key: 'totalPO', label: 'Total POs', className: 'text-right' },
                { key: 'avgLeadtime', label: 'Avg Lead Time', className: 'text-right' },
                { key: 'onTimePct', label: 'On-Time %', className: 'text-right' },
                { key: 'totalAmount', label: 'Total Amount', className: 'text-right' },
              ]}
              rows={data.supplierPerformance}
              renderRow={(row) => (
                <>
                  <Td className="font-bold">{row.supplier}</Td>
                  <Td className="text-right">{row.totalPOs}</Td>
                  <Td className="text-right">{row.avgLeadtime}d</Td>
                  <Td className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${row.onTimePct >= 80 ? 'bg-success/10 text-success' : row.onTimePct >= 60 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}>
                      {row.onTimePct}%
                    </span>
                  </Td>
                  <Td className="text-right font-mono">{formatAmount(row.totalAmount)}</Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-supplier-risk') && (
        <section id="ppc-supplier-risk">
          {(() => {
            const ranked = data.supplierPerformance.map((s) => {
              const leadtimeScore = Math.min((s.avgLeadtime / 180) * 40, 40);
              const onTimeScore = (100 - s.onTimePct) * 0.6;
              const riskScore = Math.round(Math.min(leadtimeScore + onTimeScore, 100));
              const level = riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Medium' : riskScore <= 80 ? 'High' : 'Critical';
              return { ...s, riskScore, level };
            }).sort((a, b) => b.riskScore - a.riskScore).map((s, i) => ({ ...s, rank: i + 1 }));

            return (
              <SectionPanel title="Supplier Risk Ranking" subtitle="Risk assessment based on delivery performance and lead times" action={<InfoButton contentId="po-supplier-risk" />}>
                <Table page={tp('supplier-risk')} setPage={sp('supplier-risk')}
                  headers={[
                    { key: 'rank', label: 'Rank', className: 'text-center w-12' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'riskScore', label: 'Risk Score', className: 'text-right' },
                    { key: 'level', label: 'Risk Level', className: 'text-center' },
                    { key: 'onTimePct', label: 'On-Time %', className: 'text-right' },
                    { key: 'avgLeadtime', label: 'Avg Lead Time', className: 'text-right' },
                    { key: 'totalPOs', label: 'Total POs', className: 'text-right' },
                  ]}
                  rows={ranked}
                  renderRow={(row) => {
                    const levelColors = {
                      Low: 'bg-success/10 text-success',
                      Medium: 'bg-warning/10 text-warning',
                      High: 'bg-orange-100 text-orange-700',
                      Critical: 'bg-error/10 text-error',
                    };
                    return (
                      <>
                        <Td className="text-center font-bold text-on-surface-variant">#{row.rank}</Td>
                        <Td className="font-bold">{row.supplier}</Td>
                        <Td className="text-right font-mono font-bold">{row.riskScore}</Td>
                        <Td className="text-center">
                          <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${levelColors[row.level]}`}>
                            {row.level}
                          </span>
                        </Td>
                        <Td className="text-right">{row.onTimePct}%</Td>
                        <Td className="text-right">{row.avgLeadtime}d</Td>
                        <Td className="text-right">{row.totalPOs}</Td>
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
                      { key: 'amount', label: 'Amount', className: 'text-right' },
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
