import { useState, useRef, useEffect } from 'react';
import KPICard from '../../components/KPICard';
import KpiCarousel from '../../components/KpiCarousel';
import IconButton from '../../components/IconButton';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';
import ExportDropdown from '../../components/ExportDropdown';

const FUNNEL_COLORS = ['#00373B', '#0B4F54', '#D97706', '#86BFC5'];
const FUNNEL_LABELS = ['Contract', 'PO', 'Inbound', 'Received'];
const FIELDS = ['contractAmount', 'purchaseOrderAmount', 'inboundAmount', 'receivedAmount'];

function FunnelChart({ data }: any) {
  const rows = [...data.data].reverse();
  const maxVal = Math.max(...rows.flatMap(r => FIELDS.map(f => r[f] || 0)));
  const padL = 50, padR = 16, padT = 8, padB = 52;
  const w = 720, h = 300;
  const chartW = w - padL - padR;
  const groupW = chartW / rows.length;
  const barW = Math.max(6, groupW * 0.1);
  const gap = (groupW - barW * 4) / 5;
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(w);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width || w));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function fmt(v) {
    if (!v) return '—';
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
    return `${(v / 1e3).toFixed(0)}K`;
  }

  return (
    <div ref={containerRef} className="relative w-full">
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
              <g key={`fi-${fi}`}>
                <rect x={x} y={y} width={barW} height={barH} rx={3} fill={FUNNEL_COLORS[fi]} opacity={tooltip?.fi === fi && tooltip?.year === r.year ? 1 : 0.85}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease-in-out' }}
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
          <div className="absolute pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs z-50" style={{ left: Math.min(tooltip.x + 12, containerW - 220), top: Math.max(tooltip.y - 100, 0) }}>
            <div className="font-bold text-on-surface mb-1.5">{tooltip.year} — {tooltip.stageLabel}</div>
            <div className="space-y-1 text-on-surface-variant">
              <div className="flex justify-between gap-6"><span>Amount</span><span className="font-semibold text-on-surface">{fmt(tooltip.v)} ETB</span></div>
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

function FunnelPercentRow({ data }: any) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3">
      {FUNNEL_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant whitespace-nowrap">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: FUNNEL_COLORS[i] }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// Ordered pipeline groups — each status belongs to exactly one step.
// The step whose group contains currentProcessStatus is the ACTIVE step.
// All steps before it are DONE; all after are FUTURE.
const PIPELINE_STEPS = [
  {
    label: 'Contract & PO',
    icon: 'fa-file-signature',
    statuses: new Set([
      'MILESTONE_NOT_STARTED_OR_NOT_CAPTURED',
      'CONTRACTING_IN_PROGRESS',
      'SIGNED_CONTRACT_RECEIVED',
      'BUDGET_CONFIRMED',
      'PO_APPROVAL_IN_PROGRESS',
      'PO_APPROVED',
      'PROFORMA_RECEIVED',
    ]),
  },
  {
    label: 'LC / Payment',
    icon: 'fa-coins',
    statuses: new Set([
      'LC_CAD_APPLICATION_IN_PROGRESS',
      'LC_CAD_OPENED',
      'PERFORMANCE_GUARANTEE_RECEIVED',
    ]),
  },
  {
    label: 'Awaiting Shipment',
    icon: 'fa-ship',
    statuses: new Set(['AWAITING_FOREIGN_SHIPMENT']),
  },
  {
    label: 'Partially Received',
    icon: 'fa-box-open',
    statuses: new Set(['PARTIALLY_RECEIVED']),
  },
  {
    label: 'Delivery Complete',
    icon: 'fa-warehouse',
    statuses: new Set(['DELIVERY_COMPLETE', 'ORDER_CLOSED']),
  },
];


function MilestoneTracker({ row }: any) {
  const status = row.currentProcessStatus || '';

  const currentStepIdx = (() => {
    const idx = PIPELINE_STEPS.findIndex(s => s.statuses.has(status));
    return idx === -1 ? PIPELINE_STEPS.length - 1 : idx;
  })();

  const isFullyComplete = status === 'DELIVERY_COMPLETE' || status === 'ORDER_CLOSED';

  return (
    <div className="bg-[#F8FAFC] border border-outline-variant/60 rounded-xl px-6 pt-5 pb-6 my-4 shadow-sm">
      {/* Title */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-on-surface">
          <span className="font-mono text-primary">{row.purchaseOrderNumber}</span>
          <span className="mx-2 text-outline">·</span>
          <span className="font-normal text-on-surface-variant">{row.supplierName}</span>
        </h4>
        <p className="text-[11px] text-on-surface-variant mt-1">
          Status: <span className="font-semibold text-on-surface">{status.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* Stepper */}
      <div className="relative flex items-start justify-between w-full">
        {/* Background rail */}
        <div className="absolute left-[10%] right-[10%] h-1 bg-[#E2E8F0] z-0 top-[22px] rounded-full" />

        {/* Progress rail */}
        <div
          className="absolute left-[10%] h-1 bg-[#0B4F54] z-0 top-[22px] rounded-full transition-all duration-500"
          style={{ width: isFullyComplete ? '80%' : `${(currentStepIdx / (PIPELINE_STEPS.length - 1)) * 80}%` }}
        />

        {PIPELINE_STEPS.map((step, idx) => {
          const isDone   = idx < currentStepIdx || isFullyComplete;
          const isActive = idx === currentStepIdx && !isFullyComplete;
          const isFuture = !isDone && !isActive;

          const dotClass = isDone
            ? 'bg-[#0B4F54] text-white border-[#0B4F54]'
            : isActive
            ? 'bg-white text-[#0B4F54] border-[#0B4F54] ring-4 ring-[#0B4F54]/10'
            : 'bg-[#E2E8F0] text-slate-400 border-[#CBD5E1]';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center flex-1">
              <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${dotClass}`}>
                {isDone
                  ? <i className="fa-solid fa-check text-sm" />
                  : <i className={`fa-solid ${step.icon} text-xs`} />
                }
              </div>
              <div className="text-center mt-3 max-w-[110px] px-1">
                <span className={`text-[11px] font-bold block leading-tight ${
                  isActive ? 'text-[#0B4F54]' : isFuture ? 'text-slate-400' : 'text-on-surface'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5 block text-[#0B4F54]/60">Current</span>
                )}
                {isFuture && (
                  <span className="text-[9px] text-slate-400 italic mt-0.5 block">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineExpandedContent({ row }: any) {
  const bars = [
    { label: 'Contract Amount', amount: row.contractAmount, color: '#00373B' },
    { label: 'PO Amount', amount: row.poAmount, color: '#0B4F54' },
    { label: 'Invoiced', amount: row.inboundDelivery, color: '#D97706' },
    { label: 'Received', amount: row.received, color: '#86BFC5' },
  ];
  const maxAmount = Math.max(...bars.map(b => b.amount), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-semibold mb-2">
        <span className="w-32" />
        <span className="flex-1">Amount (ETB)</span>
        <span className="w-20 text-right">% of Contract</span>
      </div>
      {bars.map((b) => {
        const pctOfContract = row.contractAmount > 0 ? Math.round((b.amount / row.contractAmount) * 100) : 0;
        const barPct = Math.max(4, (b.amount / maxAmount) * 100);
        return (
          <div key={b.label} className="flex items-center gap-2">
            <span className="w-32 text-xs font-semibold text-on-surface truncate shrink-0">{b.label}</span>
            <div className="flex-1 h-7 bg-surface-container-low rounded-md overflow-hidden relative">
              <div className="h-full rounded-md transition-all" style={{ width: `${barPct}%`, backgroundColor: b.color }} />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-sm">{formatAmount(b.amount)}</span>
            </div>
            <span className="w-20 text-right text-xs font-bold text-on-surface-variant shrink-0">{pctOfContract}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ContractManagementTab({ data, activeSections, tp, sp }: any) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [modalRow, setModalRow] = useState(null);
  const allYears = data.yearlyContractToReceipt?.data?.map(r => r.year).sort() || [];
  const [funnelYear, setFunnelYear] = useState(allYears.length ? String(allYears[allYears.length - 1]) : '2026');
  const funnelFiltered = { ...data.yearlyContractToReceipt, data: data.yearlyContractToReceipt.data.filter(r => r.year === Number(funnelYear)) };
  const [pipelineExpanded, setPipelineExpanded] = useState(null);
  const [ctrExpanded, setCtrExpanded] = useState(null);
  const [showCtrDaysPast, setShowCtrDaysPast] = useState(false);
  const [showCtrMilestone, setShowCtrMilestone] = useState(false);
  const [showCtrPhase, setShowCtrPhase] = useState(false);
  const [ctrSearch, setCtrSearch] = useState('');
  const [ctrProcessFilter, setCtrProcessFilter] = useState('');
  const [ctrRouteFilter, setCtrRouteFilter] = useState('');
  const filteredCtr = (data.contractToReceiveTracking || [])
    .filter((row) => {
      const q = ctrSearch.toLowerCase();
      const matchSearch = !ctrSearch || row.purchaseOrderNumber?.toLowerCase().includes(q) ||
        row.supplierName?.toLowerCase().includes(q) ||
        row.currentProcessStatus?.toLowerCase().includes(q) ||
        row.routeStatus?.toLowerCase().includes(q) ||
        row.currentMilestoneName?.toLowerCase().includes(q) ||
        row.processPhase?.toLowerCase().includes(q);
      const matchProcess = !ctrProcessFilter || row.currentProcessStatus === ctrProcessFilter;
      const matchRoute = !ctrRouteFilter || row.routeStatus === ctrRouteFilter;
      return matchSearch && matchProcess && matchRoute;
    })
    .sort((a, b) => (a.purchaseOrderNumber || '').localeCompare(b.purchaseOrderNumber || '', undefined, { numeric: true, sensitivity: 'base' }));
  return (
    <>
      {activeSections.includes('ppc-pipeline') && (
        <section id="ppc-pipeline">
          <SectionPanel title="Contract vs PO vs Inbound Delivery vs Received" subtitle="Full procurement pipeline per contract" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-pipeline" /><ExportDropdown headers={[{ key: 'contractNo', label: 'Contract' }, { key: 'supplier', label: 'Supplier' }, { key: 'contractAmount', label: 'Contract Amount (ETB)' }, { key: 'poAmount', label: 'PO Amount (ETB)' }, { key: 'inboundDelivery', label: 'Invoiced (ETB)' }, { key: 'received', label: 'Received (ETB)' }]} rows={data.contractPipeline} filename="pipeline" /></div>}>
            {(() => {
              const totalPO = data.contractPipeline.reduce((s, c) => s + c.poAmount, 0);
              const totalInbound = data.contractPipeline.reduce((s, c) => s + c.inboundDelivery, 0);
              const totalReceived = data.contractPipeline.reduce((s, c) => s + c.received, 0);
              return (
                <>
                  <KpiCarousel>
                    <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Value" value={formatAmount(totalPO)} subtitle="ordered" />
                    <KPICard variant="detailed" icon="fa-truck-loading" iconBg="bg-warning/10" iconColor="text-warning" label="Inbound Delivery" value={formatAmount(totalInbound)} subtitle={`${totalPO ? Math.round((totalInbound / totalPO) * 100) : 0}% of PO`} />
                    <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Received" value={formatAmount(totalReceived)} subtitle={`${totalInbound ? Math.round((totalReceived / totalInbound) * 100) : 0}% of inbound`} />
                  </KpiCarousel>
                  <Table page={tp('pipeline')} setPage={sp('pipeline')}
                    expandedRow={isMobile ? undefined : pipelineExpanded} rowKey="contractNo"
                    onRowClick={(id) => {
                      if (isMobile) {
                        setModalRow(data.contractPipeline.find(r => r.contractNo === id) || null);
                      } else {
                        setPipelineExpanded(pipelineExpanded === id ? null : id);
                      }
                    }}
                    rowClassName={isMobile ? '' : 'group hover:bg-primary'} expandedRowClassName="bg-primary"
                    headers={[
                      { key: 'contract', label: 'Contract' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'ctAmount', label: 'Contract Amount (ETB)', className: 'text-right' },
                      { key: 'po', label: 'PO Amount (ETB)', className: 'text-right' },
                      { key: 'inbound', label: 'Invoiced (ETB)', className: 'text-right' },
                      { key: 'received', label: 'Received (ETB)', className: 'text-right' },
                      { key: 'progress', label: 'Pipeline Fill' },
                    ]}
                    rows={data.contractPipeline}
                    renderRow={(row, i, isExpanded) => {
                      const fillPct = row.poAmount ? Math.round((row.received / row.poAmount) * 100) : 0;
                      const tx = isMobile ? '' : `group-hover:text-white transition-colors ${isExpanded ? 'text-white' : ''}`;
                      return (
                        <>
                          <Td className={`font-mono ${tx}`}>{row.contractNo}</Td>
                          <Td className={tx}>{row.supplier}</Td>
                          <Td className={`text-right font-mono ${tx}`}>{formatAmount(row.contractAmount)}</Td>
                          <Td className={`text-right font-mono ${tx}`}>{formatAmount(row.poAmount)}</Td>
                          <Td className={`text-right font-mono ${tx}`}>{formatAmount(row.inboundDelivery)}</Td>
                          <Td className={`text-right font-mono ${tx}`}>{formatAmount(row.received)}</Td>
                          <Td className={`min-w-[140px] ${tx}`}>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${fillPct >= 80 ? 'bg-success' : fillPct >= 50 ? 'bg-warning' : 'bg-error'}`}
                                  style={{ width: `${fillPct}%` }} />
                              </div>
                              <span className={`text-xs font-bold shrink-0 ${isExpanded ? 'text-white' : 'text-on-surface'}`}>{fillPct}%</span>
                            </div>
                          </Td>
                        </>
                      );
                    }}
                    renderExpanded={(row) => <PipelineExpandedContent row={row} />}
                  />
                  {isMobile && modalRow && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setModalRow(null)}>
                      <div className="bg-white w-full max-w-xl rounded-2xl shadow-level-2 border border-outline-variant overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-low flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-on-surface">{modalRow.contractNo}</span>
                            <span className="text-outline">·</span>
                            <span className="text-body-sm text-on-surface-variant">{modalRow.supplier}</span>
                          </div>
                          <button onClick={() => setModalRow(null)} className="p-1.5 rounded-lg hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" aria-label="Close">
                            <i className="fa-solid fa-xmark text-lg" />
                          </button>
                        </div>
                        <div className="px-5 py-4">
                          <PipelineExpandedContent row={modalRow} />
                        </div>
                        <div className="px-5 py-3 border-t border-outline-variant bg-surface-low flex justify-end">
                          <button onClick={() => setModalRow(null)}
                            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-contract-vs-po') && (
        <section id="ppc-contract-vs-po">
          <SectionPanel title="Contract vs PO - Consumption & Remaining" subtitle="Per contract with summary" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-contract-vs-po" /><ExportDropdown headers={[{ key: 'contractNo', label: 'Contract' }, { key: 'supplier', label: 'Supplier' }, { key: 'contractAmount', label: 'Contract Amt (ETB)' }, { key: 'poAmount', label: 'PO Amt (ETB)' }, { key: 'pctConsumed', label: 'PO Rate' }, { key: 'remaining', label: 'Remaining (ETB)' }]} rows={data.contractVsPO} filename="contract-vs-po" /></div>}>
            <KpiCarousel>
              <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Amount" value={formatAmount(data.contractVsPO.reduce((s, c) => s + c.poAmount, 0))} subtitle="all contracts" />
              <KPICard variant="detailed" icon="fa-cart-shopping" iconBg="bg-success/10" iconColor="text-success" label="Total Consumption" value={formatAmount(data.contractVsPO.reduce((s, c) => s + c.consumption, 0))} subtitle={`${data.contractVsPO.reduce((s, c) => s + c.poAmount, 0) ? Math.round((data.contractVsPO.reduce((s, c) => s + c.consumption, 0) / data.contractVsPO.reduce((s, c) => s + c.poAmount, 0)) * 100) : 0}% consumed`} />
              <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-warning/10" iconColor="text-warning" label="Total Remaining" value={formatAmount(data.contractVsPO.reduce((s, c) => s + c.remaining, 0))} subtitle="yet to consume" />
              <KPICard variant="detailed" icon="fa-file-contract" iconBg="bg-primary/10" iconColor="text-primary" label="Contracts" value={data.contractVsPO.length.toLocaleString()} subtitle={`avg ${data.contractVsPO.length ? Math.round(data.contractVsPO.reduce((s, c) => s + c.pctConsumed, 0) / data.contractVsPO.length) : 0}% consumed`} />
            </KpiCarousel>
            <Table page={tp('contract-po')} setPage={sp('contract-po')}
              headers={[
                { key: 'contract', label: 'Contract' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'ctAmount', label: 'Contract Amt (ETB)', className: 'text-right' },
                { key: 'poAmount', label: 'PO Amt (ETB)', className: 'text-right' },
                { key: 'consumption', label: 'PO Rate', className: 'text-right' },
                { key: 'remaining', label: 'Remaining (ETB)', className: 'text-right' },
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
            const routeColors = { DELAYED_BEYOND_DELIVERY_DEADLINE: 'bg-error/10 text-error', CLOSED: 'bg-success/10 text-success', PARTIALLY_RECEIVED_BUT_OVERDUE: 'bg-warning/10 text-warning', NO_ROUTE_DEADLINE_BREACH_DETECTED: 'bg-success/10 text-success', ROUTE_DATA_QUALITY_ISSUE: 'bg-warning/10 text-warning', ROUTE_NOT_CLASSIFIED: 'bg-surface-container text-on-surface-variant' };
            const phaseColors = { PLANNING: 'bg-[#4A8EA5]/10 text-[#4A8EA5]', EXECUTION: 'bg-primary/10 text-primary', COMPLETED: 'bg-success/10 text-success' };
            return (
              <SectionPanel title="Contract-to-Receipt Status Tracking" subtitle={`${filteredCtr.length} of ${(data.contractToReceiveTracking || []).length} PO-level milestones`}
                action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-contract-to-receive" /><ExportDropdown headers={[{ key: 'purchaseOrderNumber', label: 'PO No' }, { key: 'supplierName', label: 'Supplier' }, { key: 'purchaseOrderAmount', label: 'Amount (ETB)' }, { key: 'currentProcessStatus', label: 'Process Status' }, { key: 'routeStatus', label: 'Route Status' }, { key: 'deliveryDeadline', label: 'Deadline' }, { key: 'daysToOrPastDeadline', label: 'Days ±' }, { key: 'milestoneCompletionPercent', label: 'Milestone %' }, { key: 'currentMilestoneName', label: 'Current Milestone' }, { key: 'processPhase', label: 'Phase' }]} rows={filteredCtr} filename="contract-to-receive" /></div>}
                searchBar={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="relative">
                      <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-on-surface-variant/60 text-[11px]"></i>
                      <input type="text" placeholder="Search..." value={ctrSearch}
                        onChange={(e) => setCtrSearch(e.target.value)}
                        className="pl-7 pr-2 py-1 h-8 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-44 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select value={ctrProcessFilter} onChange={(e) => setCtrProcessFilter(e.target.value)}
                        className="h-8 shrink-0 rounded-md border border-outline-variant bg-white px-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[160px]"
                      >
                        <option value="">All Process Status</option>
                        {(() => {
                          const present = new Set((data.contractToReceiveTracking || []).map(r => r.currentProcessStatus));
                          return PIPELINE_STEPS.map(step => {
                            const opts = [...step.statuses].filter(s => present.has(s));
                            if (!opts.length) return null;
                            return (
                              <optgroup key={step.label} label={`— ${step.label} —`}>
                                {opts.map(s => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </optgroup>
                            );
                          });
                        })()}
                      </select>
                      <select value={ctrRouteFilter} onChange={(e) => setCtrRouteFilter(e.target.value)}
                        className="h-8 shrink-0 rounded-md border border-outline-variant bg-white px-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[130px]"
                      >
                        <option value="">All Route Status</option>
                        {[...new Set<string>((data.contractToReceiveTracking || []).map((r: any) => String(r.routeStatus)))].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      {(ctrSearch || ctrProcessFilter || ctrRouteFilter) && (
                        <button
                          type="button"
                          onClick={() => { setCtrSearch(''); setCtrProcessFilter(''); setCtrRouteFilter(''); }}
                          className="h-8 shrink-0 px-3 flex items-center gap-1.5 rounded-md border border-error/40 bg-error/5 text-error text-xs font-semibold hover:bg-error/10 transition-colors"
                        >
                          <i className="fa-solid fa-xmark text-[10px]" /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                }>
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60">
                    <span className="text-xs font-bold text-on-surface-variant mr-2 flex items-center gap-1.5"><i className="fa-solid fa-table-columns text-primary"></i> Toggle Columns:</span>
                    {[
                      { id: 'daysPast', label: 'Days ±', state: showCtrDaysPast, setState: setShowCtrDaysPast },
                      { id: 'milestone', label: 'Milestone %', state: showCtrMilestone, setState: setShowCtrMilestone },
                      { id: 'phase', label: 'Phase', state: showCtrPhase, setState: setShowCtrPhase },
                    ].map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => col.setState(!col.state)}
                        className={`px-2.5 py-1 text-xs border rounded-md font-semibold flex items-center gap-1.5 transition-all duration-150 ${col.state ? 'bg-[#0B4F54]/10 border-[#0B4F54] text-[#0B4F54]' : 'bg-white border-outline-variant text-on-surface-variant/80 hover:bg-slate-50'}`}
                      >
                        <i className={col.state ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}></i>
                        {col.label}
                      </button>
                    ))}
                  </div>
                  <Table page={tp('contract-to-receive')} setPage={sp('contract-to-receive')}
                    expandedRow={ctrExpanded} rowKey="purchaseOrderNumber"
                    onRowClick={(id) => setCtrExpanded(ctrExpanded === id ? null : id)}
                    rowClassName="group hover:bg-primary"
                    expandedRowClassName="bg-primary"
                    headers={[
                      { key: 'poNo', label: 'PO No' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'amount', label: 'Amount (ETB)', className: 'text-right' },
                      { key: 'processStatus', label: 'Process Status' },
                      { key: 'routeStatus', label: 'Route Status' },
                      { key: 'deadline', label: 'Deadline' },
                      showCtrDaysPast && { key: 'daysPast', label: 'Days ±', className: 'text-right' },
                      showCtrMilestone && { key: 'milestone', label: 'Milestone %', className: 'text-right' },
                      { key: 'currentMile', label: 'Current Milestone' },
                      showCtrPhase && { key: 'phase', label: 'Phase', className: 'text-center' },
                    ].filter(Boolean)}
                    rows={filteredCtr}
                    renderRow={(row, i, isExpanded) => {
                      const tx = `group-hover:text-white transition-colors ${isExpanded ? 'text-white' : ''}`;
                      return (
                        <>
                          <Td className={`font-mono ${tx}`}>{row.purchaseOrderNumber}</Td>
                          <Td className={`whitespace-nowrap font-bold ${tx}`} title={row.supplierName}>{row.supplierName}</Td>
                          <Td className={`text-right font-mono ${tx}`}>{formatAmount(row.purchaseOrderAmount)}</Td>
                          <Td>
                            <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap group-hover:bg-white/20 group-hover:text-white transition-colors ${isExpanded ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`} title={row.currentProcessStatus}>{row.currentProcessStatus.replace(/_/g, ' ')}</span>
                          </Td>
                          <Td>
                            <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap group-hover:bg-white/20 group-hover:text-white transition-colors ${isExpanded ? 'bg-white/20 text-white' : routeColors[row.routeStatus] || 'bg-surface-container text-on-surface-variant'}`} title={row.routeStatus}>{row.routeStatus.replace(/_/g, ' ')}</span>
                          </Td>
                          <Td className={tx}>{row.deliveryDeadline}</Td>
                          {showCtrDaysPast && (
                            <Td className={`text-right font-bold ${isExpanded ? 'text-white' : row.daysToOrPastDeadline > 0 ? 'text-error' : 'text-success'}`}>{row.daysToOrPastDeadline > 0 ? `+${row.daysToOrPastDeadline}` : row.daysToOrPastDeadline}</Td>
                          )}
                          {showCtrMilestone && (
                            <Td className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className={`text-xs font-bold ${isExpanded ? 'text-white' : 'text-on-surface'}`}>{row.milestoneCompletionPercent}%</span>
                                <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isExpanded ? 'bg-white/30' : 'bg-surface-container-low'}`}>
                                  <div className={`h-full rounded-full ${isExpanded ? 'bg-white' : row.milestoneCompletionPercent >= 80 ? 'bg-success' : row.milestoneCompletionPercent >= 40 ? 'bg-warning' : 'bg-error'}`}
                                    style={{ width: `${row.milestoneCompletionPercent}%` }} />
                                </div>
                              </div>
                            </Td>
                          )}
                          <Td className={`whitespace-nowrap ${tx}`} title={row.currentMilestoneName}>{row.currentMilestoneName}</Td>
                          {showCtrPhase && (
                            <Td className="text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md group-hover:bg-white/20 group-hover:text-white transition-colors ${isExpanded ? 'bg-white/20 text-white' : phaseColors[row.processPhase] || 'bg-surface-container text-on-surface-variant'}`}>{row.processPhase}</span>
                            </Td>
                          )}
                        </>
                      );
                    }}
                    renderExpanded={(row) => <MilestoneTracker row={row} />}
                  />
                </>
              </SectionPanel>
            );
          })()}
        </section>
      )}

      {activeSections.includes('ppc-yearly-contract-receipt') && (
          <section id="ppc-yearly-contract-receipt">
            <SectionPanel title="Yearly Contract-to-Receipt Funnel" subtitle="Year-over-year pipeline summary from contract to delivery" action={
              <div className="relative">
                <select value={funnelYear} onChange={e => setFunnelYear(e.target.value)}
                  className="appearance-none h-8 min-w-[100px] rounded-md border border-outline-variant bg-white pl-2.5 pr-7 text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary pointer-events-none" />
              </div>
            }>
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="w-full lg:flex-1 lg:min-w-0">
                  <FunnelChart data={funnelFiltered} />
                  <div className="mt-4 flex justify-center">
                    <FunnelPercentRow />
                  </div>
                </div>
                <div className="w-full xl:w-[480px] shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {funnelFiltered.data.map(row => {
                        const poVsContract = row.contractAmount && row.contractAmount > 0 ? Math.round((row.purchaseOrderAmount / row.contractAmount) * 100) : null;
                        const inboundVsPO = row.purchaseOrderAmount > 0 ? Math.round((row.inboundAmount / row.purchaseOrderAmount) * 100) : 0;
                        const receivedVsInbound = row.inboundAmount > 0 ? Math.round((row.receivedAmount / row.inboundAmount) * 100) : 0;
                        return (
                          <div key={row.year} className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
                            <div className="mb-5">
                              <span className="text-title-sm font-bold text-on-surface">Summary</span>
                            </div>
                            <div className="space-y-4 text-[13px]">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-on-surface-variant font-medium"><span>PO → Contract</span><span className={`font-bold ${poVsContract >= 100 ? 'text-error' : 'text-on-surface'}`}>{poVsContract !== null ? `${poVsContract}%` : '—'}</span></div>
                                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${poVsContract >= 100 ? 'bg-error' : 'bg-[#00373B]'}`} style={{ width: `${Math.min(poVsContract || 0, 100)}%` }} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-on-surface-variant font-medium"><span>Inbound → PO</span><span className="font-bold text-on-surface">{inboundVsPO}%</span></div>
                                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-[#00373B]" style={{ width: `${Math.min(inboundVsPO, 100)}%` }} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-on-surface-variant font-medium"><span>Received → Inbound</span><span className="font-bold text-on-surface">{receivedVsInbound}%</span></div>
                                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-[#4A9598]" style={{ width: `${Math.min(receivedVsInbound, 100)}%` }} />
                                </div>
                              </div>
                              <div className="border-t border-outline-variant pt-3 mt-2 flex justify-between items-center text-on-surface font-semibold text-[14px]">
                                <span>Overall</span>
                                <span className="font-extrabold">{row.purchaseOrderAmount > 0 ? `${Math.round((row.receivedAmount / row.purchaseOrderAmount) * 100)}%` : '—'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(() => {
                        const row = funnelFiltered.data[0];
                        if (!row) return null;
                        return (
                          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
                            <div className="mb-5"><span className="text-title-sm font-bold text-on-surface">Counts</span></div>
                            <div className="space-y-6 text-[13px] text-on-surface-variant">
                              <div className="flex justify-between"><span className="font-medium">Contracts</span><span className="font-bold text-on-surface">{row.contractCount?.toLocaleString() || '—'}</span></div>
                              <div className="flex justify-between"><span className="font-medium">POs</span><span className="font-bold text-on-surface">{row.purchaseOrderCount?.toLocaleString()}</span></div>
                              <div className="flex justify-between"><span className="font-medium">Suppliers</span><span className="font-bold text-on-surface">{row.supplierCount?.toLocaleString() || '—'}</span></div>
                              <div className="flex justify-between"><span className="font-medium">Lines</span><span className="font-bold text-on-surface">{row.purchaseOrderLineCount?.toLocaleString()}</span></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
              </div>
            </SectionPanel>
          </section>
      )}

      {activeSections.includes('ppc-lc-cad') && (
        <section id="ppc-lc-cad">
          <SectionPanel title="LC / CAD Expiry Report" subtitle="Letter of Credit expiry tracking" action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-lc-cad" /><ExportDropdown headers={[{ key: 'lcNo', label: 'LC No' }, { key: 'supplier', label: 'Supplier' }, { key: 'amount', label: 'Amount (ETB)' }, { key: 'issueDate', label: 'Issue Date' }, { key: 'expiryDate', label: 'Expiry Date' }, { key: 'status', label: 'Status' }, { key: 'daysToExpiry', label: 'Days Left' }]} rows={data.lcCadExpiry} filename="lc-cad-expiry" /></div>}>
            {data.lcCadExpirySummary && (() => {
              const s = data.lcCadExpirySummary;
              const expired = s.expiryBreakdownMetrics?.[0];
              const critical = s.expiryBreakdownMetrics?.[1];
              const warning = s.expiryBreakdownMetrics?.[2];
              const active = s.expiryBreakdownMetrics?.[3];
              return (
                <KpiCarousel>
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-primary/10" iconColor="text-primary" label="Total POs" value={s.purchaseOrderCount?.toLocaleString() || '—'} subtitle={`${s.purchaseOrderLineCount?.toLocaleString() || '—'} lines`} />
                  <KPICard variant="detailed" icon="fa-building" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Suppliers" value={s.supplierCount?.toLocaleString() || '—'} subtitle="active suppliers" />
                  <KPICard variant="detailed" icon="fa-coins" iconBg="bg-warning/10" iconColor="text-warning" label="Total Amount" value={formatAmount(s.totalAmount)} subtitle={`${s.currency || 'ETB'}`} />
                  <KPICard variant="detailed" icon="fa-clock" iconBg="bg-error/10" iconColor="text-error" label="Expired" value={expired?.count?.toLocaleString() || '—'} subtitle={expired ? `${formatAmount(expired.amount)}` : '—'} />
                </KpiCarousel>
              );
            })()}
            <Table page={tp('lc-cad')} setPage={sp('lc-cad')}
              headers={[
                { key: 'lcNo', label: 'LC No' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'amount', label: 'Amount (ETB)', className: 'text-right' },
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
