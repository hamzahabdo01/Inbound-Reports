import { useState } from 'react';
import KPICard from '../../components/KPICard';
import InfoButton from '../../components/InfoButton';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';

const FUNNEL_COLORS = ['#00373B', '#0B4F54', '#4A9598', '#86BFC5'];
const FUNNEL_LABELS = ['Contract', 'PO', 'Inbound', 'Received'];
const FIELDS = ['contractAmount', 'purchaseOrderAmount', 'inboundAmount', 'receivedAmount'];

function FunnelChart({ data }) {
  const rows = [...data.data].reverse();
  const maxVal = Math.max(...rows.flatMap(r => FIELDS.map(f => r[f] || 0)));
  const padL = 50, padR = 16, padT = 8, padB = 52;
  const w = 720, h = 300;
  const chartW = w - padL - padR;
  const groupW = chartW / rows.length;
  const barW = Math.max(8, groupW * 0.15);
  const gap = (groupW - barW * 4) / 5;
  const [tooltip, setTooltip] = useState(null);

  function fmt(v) {
    if (!v) return '—';
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    return `${(v / 1e3).toFixed(0)}K`;
  }
  function fmtFull(v) {
    if (!v) return '—';
    return v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="relative w-full max-w-[720px]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {rows.map((r, gi) => {
          const gx = padL + gi * groupW;
          return FIELDS.map((f, fi) => {
            const v = r[f] || 0;
            const rawBarH = maxVal ? (v / maxVal) * (h - padT - padB) : 0;
            const barH = Math.max(rawBarH, 4);
            const x = gx + gap + fi * (barW + gap);
            const y = h - padB - barH;
            const stageLabel = FUNNEL_LABELS[fi];
            const priorLabels = FUNNEL_LABELS.slice(0, fi).join(' → ');
            return (
              <g key={`${r.year}-${fi}`}>
                <rect x={x} y={y} width={barW} height={barH} rx={3} fill={FUNNEL_COLORS[fi]} opacity={tooltip?.fi === fi && tooltip?.year === r.year ? 1 : 0.85}
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => setTooltip({ year: r.year, fi, v, stageLabel, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, row: r })}
                  onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null)}
                  onMouseLeave={() => setTooltip(null)}
                />
                {fi === 0 && (
                  <text x={gx + groupW / 2} y={h - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="#404849">{r.year}</text>
                )}
                {barH > 40 ? (
                  <text x={x + barW / 2} y={y + 16} textAnchor="middle" fontSize={10} fontWeight={600} fill="white">{fmt(v)}</text>
                ) : (
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill="#404849">{fmt(v)}</text>
                )}
              </g>
            );
          });
        })}
      </svg>
      {tooltip && (() => {
        const r = tooltip.row;
        const poVsC = r.contractAmount && r.contractAmount > 0 ? Math.round((r.purchaseOrderAmount / r.contractAmount) * 100) : null;
        const inbVsPO = r.purchaseOrderAmount > 0 ? Math.round((r.inboundAmount / r.purchaseOrderAmount) * 100) : 0;
        const recVsInb = r.inboundAmount > 0 ? Math.round((r.receivedAmount / r.inboundAmount) * 100) : 0;
        return (
          <div className="absolute pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs z-50" style={{ left: Math.min(tooltip.x + 12, w - 220), top: Math.max(tooltip.y - 100, 0) }}>
            <div className="font-bold text-on-surface mb-1.5">{tooltip.year} — {tooltip.stageLabel}</div>
            <div className="space-y-1 text-on-surface-variant">
              <div className="flex justify-between gap-6"><span>Amount</span><span className="font-semibold text-on-surface">{fmtFull(tooltip.v)} ETB</span></div>
              {r.contractAmount > 0 && tooltip.fi === 0 && <div className="flex justify-between gap-6"><span>Contracts</span><span className="font-semibold text-on-surface">{r.contractCount.toLocaleString()}</span></div>}
              {r.purchaseOrderCount > 0 && tooltip.fi === 1 && <div className="flex justify-between gap-6"><span>POs</span><span className="font-semibold text-on-surface">{r.purchaseOrderCount.toLocaleString()}</span></div>}
              {tooltip.fi < 3 && <div className="border-t border-outline-variant my-1" />}
              {poVsC !== null && tooltip.fi === 1 && <div className="flex justify-between gap-6"><span>PO/Contract</span><span className="font-semibold text-on-surface">{poVsC}%</span></div>}
              {tooltip.fi === 2 && <div className="flex justify-between gap-6"><span>Inbound/PO</span><span className="font-semibold text-on-surface">{inbVsPO}%</span></div>}
              {tooltip.fi === 3 && <div className="flex justify-between gap-6"><span>Received/Inbound</span><span className="font-semibold text-on-surface">{recVsInb}%</span></div>}
              {tooltip.fi > 0 && tooltip.fi < 4 && tooltip.stageLabel && <div className="flex justify-between gap-6 text-[10px] text-on-surface-variant/60"><span>Drop from prior</span><span className="font-semibold">{(() => { const prior = FIELDS[tooltip.fi - 1]; const pv = r[prior] || 0; return pv > 0 ? `${Math.round((tooltip.v / pv) * 100)}%` : '—'; })()}</span></div>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function FunnelPercentRow({ data }) {
  return (
    <div className="flex items-center gap-6">
      {FUNNEL_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: FUNNEL_COLORS[i] }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ContractManagementTab({ data, activeSections, tp, sp }) {
  return (
    <>
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
                      { key: 'ctAmount', label: 'Contract Amount', className: 'text-right' },
                      { key: 'po', label: 'PO Amount', className: 'text-right' },
                      { key: 'inbound', label: 'Invoiced', className: 'text-right' },
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
                          <Td className="text-right font-mono">{formatAmount(row.contractAmount)}</Td>
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

      {activeSections.includes('ppc-contract-vs-po') && (
        <section id="ppc-contract-vs-po">
          <SectionPanel title="Contract vs PO - Consumption & Remaining" subtitle="Per contract with summary" action={<InfoButton contentId="po-contract-vs-po" />}>
            <div className="grid grid-cols-4 gap-4 mb-5">
              {(() => {
                const totalPO = data.contractVsPO.reduce((s, c) => s + c.poAmount, 0);
                const totalConsumption = data.contractVsPO.reduce((s, c) => s + c.consumption, 0);
                const totalRemaining = data.contractVsPO.reduce((s, c) => s + c.remaining, 0);
                return (
                  <>
                    <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Amount" value={formatAmount(totalPO)} subtitle="all contracts" />
                    <KPICard variant="detailed" icon="fa-cart-shopping" iconBg="bg-success/10" iconColor="text-success" label="Total Consumption" value={formatAmount(totalConsumption)} subtitle={`${totalPO ? Math.round((totalConsumption / totalPO) * 100) : 0}% consumed`} />
                    <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-warning/10" iconColor="text-warning" label="Total Remaining" value={formatAmount(totalRemaining)} subtitle="yet to consume" />
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
                { key: 'consumption', label: 'PO Rate', className: 'text-right' },
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
                  <Td className="text-right font-mono">{row.pctConsumed}%</Td>
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

      {activeSections.includes('ppc-contract-to-receive') && (
        <section id="ppc-contract-to-receive">
          {(() => {
            const tracking = data.contractToReceiveTracking || [];
            const routeColors = { DELAYED_BEYOND_DELIVERY_DEADLINE: 'bg-error/10 text-error', CLOSED: 'bg-surface-container text-on-surface-variant', PARTIALLY_RECEIVED_BUT_OVERDUE: 'bg-warning/10 text-warning', NO_ROUTE_DEADLINE_BREACH_DETECTED: 'bg-success/10 text-success', ROUTE_DATA_QUALITY_ISSUE: 'bg-warning/10 text-warning', ROUTE_NOT_CLASSIFIED: 'bg-surface-container text-on-surface-variant' };
            const phaseColors = { PLANNING: 'bg-[#4A8EA5]/10 text-[#4A8EA5]', EXECUTION: 'bg-primary/10 text-primary', COMPLETED: 'bg-success/10 text-success' };
            return (
              <SectionPanel title="Contract-to-Receipt Status Tracking" subtitle="PO-level milestone tracking from contract to delivery" action={<InfoButton contentId="po-contract-to-receive" />}>
                <Table page={tp('contract-to-receive')} setPage={sp('contract-to-receive')}
                  headers={[
                    { key: 'poNo', label: 'PO No' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'amount', label: 'Amount', className: 'text-right' },
                    { key: 'processStatus', label: 'Process Status' },
                    { key: 'routeStatus', label: 'Route Status' },
                    { key: 'deadline', label: 'Deadline' },
                    { key: 'daysPast', label: 'Days ±', className: 'text-right' },
                    { key: 'milestone', label: 'Milestone %', className: 'text-right' },
                    { key: 'currentMile', label: 'Current Milestone' },
                    { key: 'phase', label: 'Phase', className: 'text-center' },
                  ]}
                  rows={tracking}
                  renderRow={(row) => (
                    <>
                      <Td className="font-mono">{row.purchaseOrderNumber}</Td>
                      <Td className="max-w-[180px] truncate font-bold" title={row.supplierName}>{row.supplierName}</Td>
                      <Td className="text-right font-mono">{formatAmount(row.purchaseOrderAmount)}</Td>
                      <Td>
                        <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-md max-w-[150px] truncate bg-primary/10 text-primary" title={row.currentProcessStatus}>{row.currentProcessStatus.replace(/_/g, ' ')}</span>
                      </Td>
                      <Td>
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md max-w-[160px] truncate ${routeColors[row.routeStatus] || 'bg-surface-container text-on-surface-variant'}`} title={row.routeStatus}>{row.routeStatus.replace(/_/g, ' ')}</span>
                      </Td>
                      <Td>{row.deliveryDeadline}</Td>
                      <Td className={`text-right font-bold ${row.daysToOrPastDeadline > 0 ? 'text-error' : 'text-success'}`}>{row.daysToOrPastDeadline > 0 ? `+${row.daysToOrPastDeadline}` : row.daysToOrPastDeadline}</Td>
                      <Td className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-bold">{row.milestoneCompletionPercent}%</span>
                          <div className="w-12 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${row.milestoneCompletionPercent >= 80 ? 'bg-success' : row.milestoneCompletionPercent >= 40 ? 'bg-warning' : 'bg-error'}`}
                              style={{ width: `${row.milestoneCompletionPercent}%` }} />
                          </div>
                        </div>
                      </Td>
                      <Td className="max-w-[170px] truncate" title={row.currentMilestoneName}>{row.currentMilestoneName}</Td>
                      <Td className="text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${phaseColors[row.processPhase] || 'bg-surface-container text-on-surface-variant'}`}>{row.processPhase}</span>
                      </Td>
                    </>
                  )}
                />
              </SectionPanel>
            );
          })()}
        </section>
      )}

      {activeSections.includes('ppc-yearly-contract-receipt') && (
        <section id="ppc-yearly-contract-receipt">
          <SectionPanel title="Yearly Contract-to-Receipt Funnel" subtitle="Year-over-year pipeline summary from contract to delivery" action={<InfoButton contentId="po-yearly-funnel" />}>
            <div className="flex flex-col items-center gap-4">
              <FunnelPercentRow />
              <FunnelChart data={data.yearlyContractToReceipt} />
              <div className="w-full grid grid-cols-4 gap-4">
                {data.yearlyContractToReceipt.data.map(row => {
                  const poVsContract = row.contractAmount && row.contractAmount > 0 ? Math.round((row.purchaseOrderAmount / row.contractAmount) * 100) : null;
                  const inboundVsPO = row.purchaseOrderAmount > 0 ? Math.round((row.inboundAmount / row.purchaseOrderAmount) * 100) : 0;
                  const receivedVsInbound = row.inboundAmount > 0 ? Math.round((row.receivedAmount / row.inboundAmount) * 100) : 0;
                  return (
                    <div key={row.year} className="bg-surface-container-low rounded-xl p-4 text-center">
                      <div className="text-sm font-bold text-on-surface mb-2">{row.year}</div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span className="text-on-surface-variant">PO/Contract</span><span className={poVsContract >= 100 ? 'font-bold text-error' : 'font-semibold'}>{poVsContract !== null ? `${poVsContract}%` : '—'}</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Inbound/PO</span><span className="font-semibold">{inboundVsPO}%</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Received/Inbound</span><span className="font-semibold">{receivedVsInbound}%</span></div>
                        <div className="flex justify-between"><span className="text-on-surface-variant">Overall</span><span className="font-bold">{row.purchaseOrderAmount > 0 ? `${Math.round((row.receivedAmount / row.purchaseOrderAmount) * 100)}%` : '—'}</span></div>
                      </div>
                    </div>
                  );
                })}
                <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/20">
                  <div className="text-sm font-bold text-primary mb-2">Totals</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-on-surface-variant">Contracts</span><span className="font-semibold">{data.yearlyContractToReceipt.meta.totals.contractCount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">POs</span><span className="font-semibold">{data.yearlyContractToReceipt.meta.totals.purchaseOrderCount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Suppliers</span><span className="font-semibold">{data.yearlyContractToReceipt.meta.totals.supplierCount?.toLocaleString() || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Lines</span><span className="font-semibold">{data.yearlyContractToReceipt.meta.totals.purchaseOrderLineCount.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-lc-cad') && (
        <section id="ppc-lc-cad">
          <SectionPanel title="LC / CAD Expiry Report" subtitle="Letter of Credit expiry tracking" action={<InfoButton contentId="po-lc-cad" />}>
            {data.lcCadExpirySummary && (() => {
              const s = data.lcCadExpirySummary;
              const expired = s.expiryBreakdownMetrics?.[0];
              const critical = s.expiryBreakdownMetrics?.[1];
              const warning = s.expiryBreakdownMetrics?.[2];
              const active = s.expiryBreakdownMetrics?.[3];
              return (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-primary/10" iconColor="text-primary" label="Total POs" value={s.purchaseOrderCount?.toLocaleString() || '—'} subtitle={`${s.purchaseOrderLineCount?.toLocaleString() || '—'} lines`} />
                  <KPICard variant="detailed" icon="fa-building" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Suppliers" value={s.supplierCount?.toLocaleString() || '—'} subtitle={`${s.currency || 'ETB'}`} />
                  <KPICard variant="detailed" icon="fa-coins" iconBg="bg-warning/10" iconColor="text-warning" label="Total Amount" value={formatAmount(s.totalAmount)} subtitle={`${s.currency || 'ETB'}`} />
                  <KPICard variant="detailed" icon="fa-clock" iconBg="bg-error/10" iconColor="text-error" label="Expired" value={expired?.count?.toLocaleString() || '—'} subtitle={expired ? `${formatAmount(expired.amount)}` : '—'} />
                </div>
              );
            })()}
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
    </>
  );
}
