import { useState } from 'react';
import KPICard from '../../components/KPICard';
import PieChart from '../../components/PieChart';
import InfoButton from '../../components/InfoButton';
import ExpandButton from '../../components/ExpandButton';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';

export default function OverviewTab({ data, activeSections, kpiPage, setKpiPage, kpiCards = [], kpiTotalPages, filteredOpenOverduePOs, overviewSearch, setOverviewSearch, overviewStatus, setOverviewStatus, procurementStatusFilter, setProcurementStatusFilter, filteredStatusDetails, tp, sp }: any) {
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
  const [itemSearch, setItemSearch] = useState('');
  const filteredOpenItems = data.openPOItemDetail?.data?.filter((row) => {
    if (!itemSearch) return true;
    const q = itemSearch.toLowerCase();
    return (row.purchaseOrderNumber?.toLowerCase().includes(q) ||
      row.supplierName?.toLowerCase().includes(q) ||
      row.materialDescription?.toLowerCase().includes(q) ||
      String(row.purchaseOrderItemNumber).includes(q));
  }) || [];
  const [overdueSearch, setOverdueSearch] = useState('');
  const filteredOverdueLines = data.overduePOScheduleLine?.data?.filter((row) => {
    if (!overdueSearch) return true;
    const q = overdueSearch.toLowerCase();
    return (row.purchaseOrderNumber?.toLowerCase().includes(q) ||
      row.supplierName?.toLowerCase().includes(q) ||
      row.materialDescription?.toLowerCase().includes(q) ||
      String(row.purchaseOrderItemNumber).includes(q) ||
      row.overdueBucket?.toLowerCase().includes(q));
  }) || [];

  return (
    <>
      {activeSections.includes('ppc-overview') && (
        <section id="ppc-overview">
          <div className="space-y-3">
            <div className="relative pl-12 pr-12">
              <div className="overflow-hidden w-full">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${kpiPage * 100}%)` }}
                >
                  {Array.from({ length: kpiTotalPages }).map((_, pageIdx) => (
                    <div key={pageIdx} className="grid grid-cols-4 gap-3 w-full shrink-0">
                      {kpiCards.slice(pageIdx * 4, pageIdx * 4 + 4).map((c, cardIdx) => (
                        <KPICard key={c.label || cardIdx} variant="detailed" {...c} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {kpiTotalPages > 1 && (
                <>
                  <button type="button" onClick={() => setKpiPage((p) => Math.max(p - 1, 0))} disabled={kpiPage === 0}
                    className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-l-xl bg-primary text-white hover:bg-primary-dark disabled:bg-[#0B4F54]/10 disabled:text-[#0B4F54]/30 disabled:cursor-not-allowed transition-all duration-200 z-10"
                    aria-label="Previous KPI page"
                  ><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
                  <button type="button" onClick={() => setKpiPage((p) => Math.min(p + 1, kpiTotalPages - 1))} disabled={kpiPage === kpiTotalPages - 1}
                    className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-r-xl bg-primary text-white hover:bg-primary-dark disabled:bg-[#0B4F54]/10 disabled:text-[#0B4F54]/30 disabled:cursor-not-allowed transition-all duration-200 z-10"
                    aria-label="Next KPI page"
                  ><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
                </>
              )}
            </div>
            {kpiTotalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: kpiTotalPages }, (_, i) => (
                  <button key={i} type="button" onClick={() => setKpiPage(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === kpiPage ? 'bg-primary w-5' : 'bg-outline-variant hover:bg-outline'}`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeSections.includes('ppc-open-pos') && (
        <section id="ppc-open-pos">
          <SectionPanel
            title="Open & Overdue Purchase Orders"
            subtitle={`${filteredOpenOverduePOs.length} records requiring attention`}
            action={
              <div className="flex items-center gap-3">
                <InfoButton contentId="po-overdue" />
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                  <input type="text" placeholder="Search PO, supplier, program..." value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                  />
                </div>
                <select value={overviewStatus} onChange={(e) => setOverviewStatus(e.target.value)}
                  className="h-9 rounded-md border border-outline-variant bg-white px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            }
          >
            {(() => {
              const openCount = filteredOpenOverduePOs.filter((p) => p.status === 'Open').length;
              const overdueCount = filteredOpenOverduePOs.filter((p) => p.status === 'Overdue').length;
              const totalAmt = filteredOpenOverduePOs.reduce((s, p) => s + p.amount, 0);
              const overduePOs = filteredOpenOverduePOs.filter((p) => p.status === 'Overdue' && p.daysOverdue);
              const avgDays = overduePOs.length ? Math.round(overduePOs.reduce((s, p) => s + p.daysOverdue, 0) / overduePOs.length) : 0;
              return (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-primary/10" iconColor="text-primary" label="Total Open POs" value={openCount.toLocaleString()} subtitle="awaiting action" />
                    <KPICard variant="detailed" icon="fa-exclamation-triangle" iconBg="bg-error/10" iconColor="text-error" label="Total Overdue POs" value={overdueCount.toLocaleString()} subtitle="past due date" />
                    <KPICard variant="detailed" icon="fa-coins" iconBg="bg-warning/10" iconColor="text-warning" label="Total Amount" value={`${totalAmt >= 1e9 ? (totalAmt / 1e9).toFixed(1) + 'B' : totalAmt >= 1e6 ? (totalAmt / 1e6).toFixed(1) + 'M' : totalAmt >= 1e3 ? (totalAmt / 1e3).toFixed(1) + 'K' : totalAmt.toLocaleString()} ETB`} subtitle="combined value" />
                    <KPICard variant="detailed" icon="fa-clock" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Avg Overdue Duration" value={avgDays ? fmtDuration(avgDays) : '0d'} subtitle="overdue POs only" />
                  </div>
                  <Table page={tp('open-pos')} setPage={sp('open-pos')}
                    headers={[
                      { key: 'poNo', label: 'PO No' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'program', label: 'Program' },
                      { key: 'amount', label: 'Amount (ETB)', className: 'text-right' },
                      { key: 'issueDate', label: 'Issue Date' },
                      { key: 'dueDate', label: 'Due Date' },
                      { key: 'status', label: 'Status' },
                      { key: 'overdue', label: 'Days Overdue', className: 'text-right' },
                    ]}
                    rows={filteredOpenOverduePOs}
                    renderRow={(row) => (
                      <>
                        <Td className="font-mono font-semibold">{row.poNo}</Td>
                        <Td>{row.supplier}</Td>
                        <Td>{row.program}</Td>
                        <Td className="text-right font-mono font-medium">{formatAmount(row.amount)}</Td>
                        <Td>{row.issueDate}</Td>
                        <Td>{row.dueDate}</Td>
                        <Td><StatusBadge status={row.status} /></Td>
                        <Td className="text-right font-bold text-error">{row.status === 'Overdue' ? fmtDuration(row.daysOverdue) : '—'}</Td>
                      </>
                    )}
                  />
                </>
              );
            })()}
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-open-po-items') && (
        <section id="ppc-open-po-items">
          <SectionPanel title="Open PO Item Details" subtitle={`${filteredOpenItems.length} of ${data.openPOItemDetail?.data?.length || 0} open line items`} action={
            <div className="flex items-center gap-3">
              <InfoButton contentId="po-open-items" />
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                <input type="text" placeholder="Search PO, supplier, material..." value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                />
              </div>
            </div>
          }>
            <Table page={tp('open-po-items')} setPage={sp('open-po-items')} rowsPerPage={10}
              headers={[
                { key: 'po', label: 'PO No' },
                { key: 'item', label: 'Item', className: 'text-center' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'material', label: 'Material' },
                { key: 'ordered', label: 'Ordered', className: 'text-right' },
                { key: 'received', label: 'Received', className: 'text-right' },
                { key: 'open', label: 'Open Qty', className: 'text-right' },
                { key: 'openAmt', label: 'Open Amount (ETB)', className: 'text-right' },
                { key: 'delivery', label: 'Planned Delivery' },
              ]}
              rows={filteredOpenItems}
              renderRow={(row) => (
                <>
                  <Td className="font-mono">{row.purchaseOrderNumber}</Td>
                  <Td className="text-center font-mono text-on-surface-variant">{row.purchaseOrderItemNumber}</Td>
                  <Td className="whitespace-nowrap">{row.supplierName}</Td>
                  <Td className="whitespace-nowrap">{row.materialDescription}</Td>
                  <Td className="text-right font-mono">{row.orderedQuantity?.toLocaleString()}</Td>
                  <Td className="text-right font-mono">{row.receivedQuantity?.toLocaleString()}</Td>
                  <Td className="text-right font-mono font-bold">{row.openQuantity?.toLocaleString()}</Td>
                  <Td className="text-right font-mono">{row.openAmountReportingCurrency ? (() => { const v = row.openAmountReportingCurrency; return `${v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : Math.round(v).toLocaleString()}`; })() : '—'}</Td>
                  <Td>{row.plannedDeliveryDate || '—'}</Td>
                </>
              )}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-overdue-pos') && (
        <section id="ppc-overdue-pos">
          <SectionPanel title="Overdue PO Schedule Lines" subtitle={`${filteredOverdueLines.length} of ${data.overduePOScheduleLine?.data?.length || 0} overdue schedule lines`} action={
            <div className="flex items-center gap-3">
              <InfoButton contentId="po-overdue-schedule" />
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                <input type="text" placeholder="Search PO, supplier, material..." value={overdueSearch}
                  onChange={(e) => setOverdueSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                />
              </div>
            </div>
          }>
            {(() => {
              const s = data.overduePOSummary.data;
              const fmtAmt = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toLocaleString();
              return (
                <div className="grid grid-cols-4 gap-3 mb-5">
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-error/10" iconColor="text-error" label="Overdue POs" value={s.overduePurchaseOrderCount.toLocaleString()} subtitle={`${s.supplierCount} suppliers`} />
                  <KPICard variant="detailed" icon="fa-list" iconBg="bg-warning/10" iconColor="text-warning" label="Schedule Lines" value={s.overdueScheduleLineCount.toLocaleString()} subtitle="overdue items" />
                  <KPICard variant="detailed" icon="fa-building" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Suppliers" value={s.supplierCount.toLocaleString()} subtitle="with overdue POs" />
                  <KPICard variant="detailed" icon="fa-coins" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total Overdue Amount" value={`${fmtAmt(s.totalOverdueOpenAmount)} ETB`} subtitle="open balance" />
                </div>
              );
            })()}
            <Table page={tp('overdue-pos')} setPage={sp('overdue-pos')} rowsPerPage={10}
              headers={[
                { key: 'po', label: 'PO No' },
                { key: 'item', label: 'Item', className: 'text-center' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'material', label: 'Material' },
                { key: 'poDate', label: 'PO Date' },
                { key: 'dueDate', label: 'Due Date' },
                { key: 'daysOverdue', label: 'Days Overdue', className: 'text-right' },
                { key: 'bucket', label: 'Bucket' },
                { key: 'openQty', label: 'Open Qty', className: 'text-right' },
                { key: 'openAmt', label: 'Open Amt (ETB)', className: 'text-right' },
              ]}
              rows={filteredOverdueLines}
              renderRow={(row) => {
                const days = row.daysOverdue;
                const colorCls = days > 730 ? 'bg-error/15 text-error font-bold' :
                  days > 365 ? 'bg-error/10 text-error font-bold' :
                  days > 180 ? 'text-orange-600 font-bold' :
                  days > 90 ? 'text-warning font-bold' :
                  days > 60 ? 'text-warning font-semibold' :
                  days > 30 ? 'text-yellow-600 font-semibold' :
                  'text-success font-semibold';
                const fmtBucket = (b) => {
                  if (b === 'OVERDUE_OVER_730_DAYS') return '2y+';
                  const parts = b.match(/(\d+)_(\d+)_DAYS/);
                  if (parts) {
                    const lo = fmtDuration(parseInt(parts[1]));
                    const hi = fmtDuration(parseInt(parts[2]));
                    return `${lo}-${hi}`;
                  }
                  return b;
                };
                return (
                  <>
                    <Td className="font-mono">{row.purchaseOrderNumber}</Td>
                    <Td className="text-center font-mono text-on-surface-variant">{row.purchaseOrderItemNumber}</Td>
                    <Td className="max-w-[160px] truncate" title={row.supplierName}>{row.supplierName}</Td>
                    <Td className="max-w-[200px] truncate" title={row.materialDescription}>{row.materialDescription}</Td>
                    <Td>{row.purchaseOrderDate}</Td>
                    <Td>{row.scheduledDeliveryDate}</Td>
                    <Td className={`text-right font-mono ${colorCls}`}>{fmtDuration(days)}</Td>
                    <Td><span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${days > 90 ? 'bg-error/10 text-error' : days > 60 ? 'bg-warning/10 text-warning' : days > 30 ? 'bg-yellow-50 text-yellow-700' : 'bg-success/10 text-success'}`}>{fmtBucket(row.overdueBucket)}</span></Td>
                    <Td className="text-right font-mono">{row.openQuantity?.toLocaleString()}</Td>
                  <Td className="text-right font-mono">{row.openAmountReportingCurrency ? (() => { const v = row.openAmountReportingCurrency; return `${v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : Math.round(v).toLocaleString()}`; })() : '—'}</Td>
                  </>
                );
              }}
            />
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-status') && (
        <section id="ppc-status">
          <SectionPanel title="Procurement Status" subtitle="Contract → PO → LC Opened → Port Arrival → Received" action={<div className="flex items-center gap-1"><ExpandButton data={data.procurementStatus.stages.map((s) => ({ label: s.stage, value: s.count, color: s.color }))} title="Procurement Status" /><InfoButton contentId="po-proc-status" /></div>}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <PieChart data={data.procurementStatus.stages.map((s) => ({ label: s.stage, value: s.count, color: s.color }))} totalLabel="Procurement stages" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-bold text-on-surface">Filter by stage:</span>
                  <select value={procurementStatusFilter} onChange={(e) => setProcurementStatusFilter(e.target.value)}
                    className="h-8 rounded-md border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="All">All Stages</option>
                    {data.procurementStatus.stages.map((s) => (
                      <option key={s.stage} value={s.stage}>{s.stage} ({s.count})</option>
                    ))}
                  </select>
                </div>
                <Table page={tp('proc-status')} setPage={sp('proc-status')} rowsPerPage={5}
                  headers={[
                    { key: 'ref', label: 'Reference' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'date', label: 'Status Date' },
                  ]}
                  rows={filteredStatusDetails}
                  renderRow={(row) => (
                    <>
                      <Td className="font-mono">{row.refNo}</Td>
                      <Td>{row.supplier}</Td>
                      <Td><StatusBadge status={row.stage} /></Td>
                      <Td>{row.statusDate}</Td>
                    </>
                  )}
                />
              </div>
            </div>
          </SectionPanel>
        </section>
      )}
    </>
  );
}
