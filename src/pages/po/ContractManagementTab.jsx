import KPICard from '../../components/KPICard';
import InfoButton from '../../components/InfoButton';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';

export default function ContractManagementTab({ data, activeSections, tp, sp }) {
  return (
    <>
      {activeSections.includes('ppc-contract-vs-po') && (
        <section id="ppc-contract-vs-po">
          <SectionPanel title="Contract vs PO - Consumption & Remaining" subtitle="Per contract with summary" action={<InfoButton contentId="po-contract-vs-po" />}>
            <div className="grid grid-cols-4 gap-4 mb-5">
              {(() => {
                const totalPO = data.contractVsPO.reduce((s, c) => s + c.poAmount, 0);
                const totalConsumption = data.contractVsPO.reduce((s, c) => s + c.consumption, 0);
                const totalRemaining = data.contractVsPO.reduce((s, c) => s + c.remaining, 0);
                const avgPct = totalPO ? Math.round((totalConsumption / totalPO) * 100) : 0;
                return (
                  <>
                    <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Amount" value={formatAmount(totalPO)} subtitle="all contracts" />
                    <KPICard variant="detailed" icon="fa-cart-shopping" iconBg="bg-success/10" iconColor="text-success" label="Total Consumption" value={formatAmount(totalConsumption)} subtitle={`${avgPct}% consumed`} />
                    <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-warning/10" iconColor="text-warning" label="Total Remaining" value={formatAmount(totalRemaining)} subtitle="yet to consume" />
                    <KPICard variant="detailed" icon="fa-percent" iconBg="bg-primary/10" iconColor="text-primary" label="Avg Consumption Rate" value={`${avgPct}%`} subtitle="across all contracts" />
                  </>
                );
              })()}
            </div>
            <Table page={tp('contract-po')} setPage={sp('contract-po')}
              headers={[
                { key: 'contract', label: 'Contract' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'ctAmount', label: 'Contract Amt', className: 'text-right' },
                { key: 'poAmount', label: 'PO Amt', className: 'text-right' },
                { key: 'consumption', label: 'Consumption', className: 'text-right' },
                { key: 'remaining', label: 'Remaining', className: 'text-right' },
                { key: 'progress', label: 'Progress' },
              ]}
              rows={data.contractVsPO}
              renderRow={(row) => (
                <>
                  <Td className="font-mono">{row.contractNo}</Td>
                  <Td>{row.supplier}</Td>
                  <Td className="text-right font-mono">{formatAmount(row.contractAmount)}</Td>
                  <Td className="text-right font-mono">{formatAmount(row.poAmount)}</Td>
                  <Td className="text-right font-mono">{formatAmount(row.consumption)}</Td>
                  <Td className="text-right font-mono">{formatAmount(row.remaining)}</Td>
                  <Td className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.pctConsumed > 80 ? 'bg-success' : row.pctConsumed > 50 ? 'bg-warning' : 'bg-error'}`}
                          style={{ width: `${row.pctConsumed}%` }} />
                      </div>
                      <span className="text-xs font-bold text-on-surface shrink-0">{row.pctConsumed}%</span>
                    </div>
                  </Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-lc-cad') && (
        <section id="ppc-lc-cad">
          <SectionPanel title="LC / CAD Expiry Report" subtitle="Letter of Credit expiry tracking" action={<InfoButton contentId="po-lc-cad" />}>
            <Table page={tp('lc-cad')} setPage={sp('lc-cad')}
              headers={[
                { key: 'lcNo', label: 'LC No' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'amount', label: 'Amount', className: 'text-right' },
                { key: 'issueDate', label: 'Issue Date' },
                { key: 'expiryDate', label: 'Expiry Date' },
                { key: 'status', label: 'Status' },
                { key: 'daysLeft', label: 'Days Left', className: 'text-right' },
              ]}
              rows={data.lcCadExpiry}
              renderRow={(row) => (
                <>
                  <Td className="font-mono">{row.lcNo}</Td>
                  <Td>{row.supplier}</Td>
                  <Td className="text-right font-mono">{formatAmount(row.amount)}</Td>
                  <Td>{row.issueDate}</Td>
                  <Td>{row.expiryDate}</Td>
                  <Td><StatusBadge status={row.status} /></Td>
                  <Td className="text-right font-bold">{row.daysToExpiry}d</Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-pipeline') && (
        <section id="ppc-pipeline">
          <SectionPanel title="Contract vs PO vs Inbound Delivery vs Received" subtitle="Full procurement pipeline per contract" action={<InfoButton contentId="po-pipeline" />}>
            {(() => {
              const totalPO = data.contractPipeline.reduce((s, c) => s + c.poAmount, 0);
              const totalInbound = data.contractPipeline.reduce((s, c) => s + c.inboundDelivery, 0);
              const totalReceived = data.contractPipeline.reduce((s, c) => s + c.received, 0);
              return (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Value" value={formatAmount(totalPO)} subtitle="ordered" />
                    <KPICard variant="detailed" icon="fa-truck-loading" iconBg="bg-warning/10" iconColor="text-warning" label="Inbound Delivery" value={formatAmount(totalInbound)} subtitle={`${totalPO ? Math.round((totalInbound / totalPO) * 100) : 0}% of PO`} />
                    <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Received" value={formatAmount(totalReceived)} subtitle={`${totalInbound ? Math.round((totalReceived / totalInbound) * 100) : 0}% of inbound`} />
                  </div>
                  <Table page={tp('pipeline')} setPage={sp('pipeline')}
                    headers={[
                      { key: 'contract', label: 'Contract' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'po', label: 'PO Amount', className: 'text-right' },
                      { key: 'inbound', label: 'Inbound', className: 'text-right' },
                      { key: 'received', label: 'Received', className: 'text-right' },
                      { key: 'progress', label: 'Pipeline Fill' },
                    ]}
                    rows={data.contractPipeline}
                    renderRow={(row) => {
                      const fillPct = row.poAmount ? Math.round((row.received / row.poAmount) * 100) : 0;
                      return (
                        <>
                          <Td className="font-mono">{row.contractNo}</Td>
                          <Td>{row.supplier}</Td>
                          <Td className="text-right font-mono">{formatAmount(row.poAmount)}</Td>
                          <Td className="text-right font-mono">{formatAmount(row.inboundDelivery)}</Td>
                          <Td className="text-right font-mono">{formatAmount(row.received)}</Td>
                          <Td className="min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${fillPct >= 80 ? 'bg-success' : fillPct >= 50 ? 'bg-warning' : 'bg-error'}`}
                                  style={{ width: `${fillPct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-on-surface shrink-0">{fillPct}%</span>
                            </div>
                          </Td>
                        </>
                      );
                    }}
                  />
                </>
              );
            })()}
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-moh-wbs') && (
        <section id="ppc-moh-wbs">
          <SectionPanel title="Procurement by MOH WBS" subtitle="Work Breakdown Structure" action={<InfoButton contentId="po-moh-wbs" />}>
            <Table page={tp('moh-wbs')} setPage={sp('moh-wbs')}
              headers={[
                { key: 'wbs', label: 'WBS Code' },
                { key: 'description', label: 'Description' },
                { key: 'program', label: 'Program' },
                { key: 'amount', label: 'Amount', className: 'text-right' },
              ]}
              rows={data.mohWBS}
              renderRow={(row) => (
                <>
                  <Td className="font-mono">{row.wbs}</Td>
                  <Td>{row.description}</Td>
                  <Td>{row.program}</Td>
                  <Td className="text-right font-mono font-bold">{formatAmount(row.amount)}</Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}
    </>
  );
}
