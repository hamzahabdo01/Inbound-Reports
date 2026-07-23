import { useState, useEffect } from 'react';
import KPICard from '../../../components/KPICard';
import KpiCarousel from '../../../components/KpiCarousel';
import IconButton from '../../../components/IconButton';
import ExportDropdown from '../../../components/ExportDropdown';
import LandscapeToggle from '../../../components/LandscapeToggle';

import Table, { Td } from '../../../components/BaseTable';
import { StatusBadge, SectionPanel, formatAmount } from './poShared';

const PROCUREMENT_STATUS_DATA = [
  { stage: "Not Started / Not Captured", count: 1244, value: 79914528178.64, pct: 51.13, color: "#00373B" },
  { stage: "Awaiting Foreign Shipment",     count: 836,  value: 47634445578.04, pct: 34.36, color: "#0B4F54" },
  { stage: "Performance Guarantee Received", count: 199,  value: 9429786448.05,  pct: 8.18,  color: "#216E6A" },
  { stage: "Signed Contract Received",       count: 53,   value: 1660858440.60,  pct: 2.18,  color: "#4A9598" },
  { stage: "Contracting In Progress",        count: 49,   value: 3083284424.86,  pct: 2.01,  color: "#86BFC5" },
  { stage: "Order Closed",                   count: 19,   value: 776233492.23,   pct: 0.78,  color: "#515F74" },
  { stage: "PO Approved",                    count: 12,   value: 745494199.11,   pct: 0.49,  color: "#D97706" },
  { stage: "LC / CAD Opened",                count: 10,   value: 159342157.70,   pct: 0.41,  color: "#BA1A1A" },
  { stage: "LC / CAD Application In Progress", count: 5,  value: 1116199513.96,  pct: 0.21,  color: "#E53E3E" },
  { stage: "Budget Confirmed",               count: 3,    value: 1814683953.94,  pct: 0.12,  color: "#F6AD55" },
  { stage: "Proforma Received",              count: 2,    value: 28079009.79,    pct: 0.08,  color: "#48BB78" },
  { stage: "PO Approval In Progress",        count: 1,    value: 282907.80,      pct: 0.04,  color: "#A0AEC0" }
];

const formatPoValue = (value: number): string => {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(0) + 'K';
  return value.toLocaleString();
};

const fmtDuration = (days) => {
  if (days == null || days < 0) return null;
  return `${days}d`;
};

export default function ProcurementBreakdownTab({ data, activeSections, filteredOpenOverduePOs, overviewSearch, setOverviewSearch, overviewStatus, setOverviewStatus, procurementStatusFilter, setProcurementStatusFilter, filteredStatusDetails, tp, sp }: any) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [procStatusLandscape, setProcStatusLandscape] = useState(false);
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
      {activeSections.includes('ppc-open-pos') && (
        <section id="ppc-open-pos">
          <SectionPanel
            title="Open & Overdue Purchase Orders"
            subtitle={`${filteredOpenOverduePOs.filter(p => p.status === 'OPEN_OVERDUE').length} overdue schedule lines`}
            action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-overdue" /><ExportDropdown headers={[{ key: 'poNo', label: 'PO No' }, { key: 'item', label: 'Item' }, { key: 'supplierName', label: 'Supplier' }, { key: 'materialDescription', label: 'Material' }, { key: 'poDate', label: 'PO Date' }, { key: 'deliveryDate', label: 'Delivery Date' }, { key: 'itemNetValue', label: 'Net Value (ETB)' }, { key: 'openQty', label: 'Open Qty' }, { key: 'openValue', label: 'Open Value (ETB)' }, { key: 'status', label: 'Status' }]} rows={filteredOpenOverduePOs} filename="open-overdue-pos" /></div>}
            searchBar={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                  <input type="text" placeholder="Search PO, supplier, material..." value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 transition-all"
                  />
                </div>
                <select value={overviewStatus} onChange={(e) => setOverviewStatus(e.target.value)}
                  className="h-9 rounded-md border border-outline-variant bg-white px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Statuses</option>
                  <option value="OPEN_OVERDUE">Open Overdue</option>
                  <option value="DELIVERY_COMPLETED">Delivery Completed</option>
                  <option value="FULLY_RECEIVED_OR_REDUCED">Fully Received</option>
                </select>
              </div>
            }
          >
            {(() => {
              const overdue = filteredOpenOverduePOs.filter(p => p.status === 'OPEN_OVERDUE');
              const totalNet = overdue.reduce((s, p) => s + p.itemNetValue, 0);
              const totalOpenVal = overdue.reduce((s, p) => s + p.openValue, 0);
              const suppliers = new Set(overdue.map(p => p.supplierName)).size;
              return (
                <>
                <KpiCarousel>
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-primary/10" iconColor="text-primary" label="Overdue Schedule Lines" value={overdue.length.toLocaleString()} subtitle={`${suppliers} suppliers`} />
                  <KPICard variant="detailed" icon="fa-coins" iconBg="bg-warning/10" iconColor="text-warning" label="Total Net Value" value={`${totalNet >= 1e9 ? (totalNet / 1e9).toFixed(1) + 'B' : totalNet >= 1e6 ? (totalNet / 1e6).toFixed(1) + 'M' : totalNet >= 1e3 ? (totalNet / 1e3).toFixed(1) + 'K' : totalNet.toLocaleString()} ETB`} subtitle="item net value" />
                  <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-error/10" iconColor="text-error" label="Total Open Value" value={`${totalOpenVal >= 1e9 ? (totalOpenVal / 1e9).toFixed(1) + 'B' : totalOpenVal >= 1e6 ? (totalOpenVal / 1e6).toFixed(1) + 'M' : totalOpenVal >= 1e3 ? (totalOpenVal / 1e3).toFixed(1) + 'K' : totalOpenVal.toLocaleString()} ETB`} subtitle="outstanding balance" />
                  <KPICard variant="detailed" icon="fa-list" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total Open Qty" value={(() => { const v = overdue.reduce((s, p) => s + p.openQty, 0); return v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toLocaleString(); })()} subtitle="units overdue" />
                </KpiCarousel>
                  <Table page={tp('open-pos')} setPage={sp('open-pos')}
                    columns={[
                      { key: 'poNo', label: 'PO No' },
                      { key: 'item', label: 'Item', className: 'text-center' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'material', label: 'Material' },
                      { key: 'poDate', label: 'PO Date' },
                      { key: 'deliveryDate', label: 'Delivery Date' },
                      { key: 'netValue', label: 'Net Value (ETB)', className: 'text-right' },
                      { key: 'openQty', label: 'Open Qty', className: 'text-right' },
                      { key: 'openValue', label: 'Open Value (ETB)', className: 'text-right' },
                      { key: 'status', label: 'Status' },
                    ]}
                    rows={filteredOpenOverduePOs}
                    renderRow={(row) => {
                      const statusColor = row.status === 'OPEN_OVERDUE' ? 'bg-error/10 text-error' :
                        row.status === 'DELIVERY_COMPLETED' ? 'bg-success/10 text-success' :
                        'bg-warning/10 text-warning';
                      const fmt = (v: number) => {
                        const abs = Math.abs(v);
                        return abs >= 1e9 ? `${(abs / 1e9).toFixed(1)}B` : abs >= 1e6 ? `${(abs / 1e6).toFixed(1)}M` : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)}K` : abs.toLocaleString();
                      };
                      return (
                      <>
                        <Td className="font-mono font-semibold">{row.poNo}</Td>
                        <Td className="text-center font-mono text-on-surface-variant">{row.item}</Td>
                        <Td className="whitespace-nowrap" title={row.supplierName}>{row.supplierName}</Td>
                        <Td className="max-w-[200px] truncate" title={row.materialDescription}>{row.materialDescription}</Td>
                        <Td>{row.poDate}</Td>
                        <Td>{row.deliveryDate}</Td>
                        <Td className="text-right font-mono font-medium">{fmt(row.itemNetValue)}</Td>
                        <Td className="text-right font-mono">{fmt(row.openQty)}</Td>
                        <Td className="text-right font-mono">{fmt(row.openValue)}</Td>
                        <Td><span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap ${statusColor}`}>{row.status.replace(/_/g, ' ')}</span></Td>
                      </>
                    )}}
                  />
                </>
              );
            })()}
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-open-po-items') && (
        <section id="ppc-open-po-items">
          <SectionPanel title="Open PO Item Details" subtitle={`${filteredOpenItems.length} of ${data.openPOItemDetail?.data?.length || 0} open line items`} action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-open-items" /><ExportDropdown headers={[{ key: 'purchaseOrderNumber', label: 'PO No' }, { key: 'purchaseOrderItemNumber', label: 'Item' }, { key: 'supplierName', label: 'Supplier' }, { key: 'materialDescription', label: 'Material' }, { key: 'orderedQuantity', label: 'Ordered' }, { key: 'receivedQuantity', label: 'Received' }, { key: 'openQuantity', label: 'Open Qty' }, { key: 'openAmountReportingCurrency', label: 'Open Amount (ETB)' }, { key: 'plannedDeliveryDate', label: 'Planned Delivery' }]} rows={filteredOpenItems} filename="open-po-items" /></div>}
            searchBar={
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                  <input type="text" placeholder="Search PO, supplier, material..." value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 transition-all"
                  />
                </div>
              </div>
            }>
            <Table page={tp('open-po-items')} setPage={sp('open-po-items')} rowsPerPage={10}
              columns={[
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
          <SectionPanel title="Overdue PO Schedule Lines" subtitle={`${filteredOverdueLines.length} of ${data.overduePOScheduleLine?.data?.length || 0} overdue schedule lines`} action={<div className="flex items-center gap-1"><IconButton variant="info" contentId="po-overdue-schedule" /><ExportDropdown headers={[{ key: 'purchaseOrderNumber', label: 'PO No' }, { key: 'purchaseOrderItemNumber', label: 'Item' }, { key: 'supplierName', label: 'Supplier' }, { key: 'materialDescription', label: 'Material' }, { key: 'purchaseOrderDate', label: 'PO Date' }, { key: 'scheduledDeliveryDate', label: 'Due Date' }, { key: 'daysOverdue', label: 'Days Overdue' }, { key: 'overdueBucket', label: 'Bucket' }, { key: 'openQuantity', label: 'Open Qty' }, { key: 'openAmountReportingCurrency', label: 'Open Amt (ETB)' }]} rows={filteredOverdueLines} filename="overdue-pos" /></div>}
            searchBar={
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                  <input type="text" placeholder="Search PO, supplier, material..." value={overdueSearch}
                    onChange={(e) => setOverdueSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 transition-all"
                  />
                </div>
              </div>
            }>
            {(() => {
              const s = data.overduePOSummary.data;
              const fmtAmt = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toLocaleString();
              return (
                <KpiCarousel>
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-error/10" iconColor="text-error" label="Overdue POs" value={s.overduePurchaseOrderCount.toLocaleString()} subtitle={`${s.supplierCount} suppliers`} />
                  <KPICard variant="detailed" icon="fa-list" iconBg="bg-warning/10" iconColor="text-warning" label="Schedule Lines" value={s.overdueScheduleLineCount.toLocaleString()} subtitle="overdue items" />
                  <KPICard variant="detailed" icon="fa-building" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Suppliers" value={s.supplierCount.toLocaleString()} subtitle="with overdue POs" />
                  <KPICard variant="detailed" icon="fa-coins" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total Overdue Amount" value={`${fmtAmt(s.totalOverdueOpenAmount)} ETB`} subtitle="open balance" />
                </KpiCarousel>
              );
            })()}
            <Table page={tp('overdue-pos')} setPage={sp('overdue-pos')} rowsPerPage={10}
              columns={[
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
          <SectionPanel title="Procurement Status" subtitle="Contract → PO → LC Opened → Port Arrival → Received" action={<IconButton variant="info" contentId="po-proc-status" />}>
            {isMobile && (
              <div className="flex justify-end px-5 pb-2 -mt-1">
                <LandscapeToggle value={procStatusLandscape} onChange={setProcStatusLandscape} />
              </div>
            )}
            <div className="overflow-x-auto" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' } as any}>
            <div style={{ minWidth: isMobile ? (procStatusLandscape ? '800px' : 'auto') : 'auto', transition: 'min-width 180ms ease' }}>
              <Table page={undefined} setPage={() => {}}
                columns={[
                  { key: 'status', label: 'Status' },
                  { key: 'count', label: 'PO Count', className: 'text-right' },
                  { key: 'value', label: 'Value (ETB)', className: 'text-right' },
                  { key: 'share', label: 'Share', className: 'text-right' },
                ]}
                rows={PROCUREMENT_STATUS_DATA}
                mobileMinWidth="auto"
                renderRow={(row) => (
                  <>
                    <Td>
                      <span className={`font-medium ${isMobile && !procStatusLandscape ? 'block truncate max-w-[120px]' : ''}`}>{row.stage}</span>
                    </Td>
                    <Td className="text-right font-mono font-semibold">{row.count.toLocaleString()}</Td>
                    <Td className="text-right font-mono font-semibold">{formatPoValue(row.value)}</Td>
                    <Td className="text-right">
                      <span className="inline-flex items-center gap-2 justify-end">
                        <span className="w-16 h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <span className="block h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                        </span>
                        <span className="text-xs font-bold text-on-surface-variant w-10 text-right">{row.pct.toFixed(1)}%</span>
                      </span>
                    </Td>
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
