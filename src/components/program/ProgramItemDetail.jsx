import { useMemo, useState } from 'react';
import ProgramPanel from './ProgramPanel';
import ProgramBarChart from './ProgramBarChart';
import ProgramStackedBarChart from './ProgramStackedBarChart';
import ProgramSectionNav from './ProgramSectionNav';
import ProgramMiniTable from './ProgramMiniTable';
import PurchaseOrderTable from './PurchaseOrderTable';
import RecentReceivesTable from './RecentReceivesTable';
import PieChart from '../PieChart';

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);
const compactNumber = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const safePercent = (value, total) => (total > 0 ? (value / total) * 100 : 0);
const firstAvailableNumber = (row, keys, fallback = 0) => {
  const key = keys.find((candidate) => row?.[candidate] !== undefined && row?.[candidate] !== null && row?.[candidate] !== '');
  return Number(row?.[key]) || fallback;
};

const FUNDING_SOURCE_DATA = [
  { label: 'EPHI', value: 8.0, color: '#00373B' },
  { label: 'Global Fund', value: 18.5, color: '#0B4F54' },
  { label: 'MOH', value: 42.1, color: '#216E6A' },
  { label: 'Others', value: 22.3, color: '#4A9598' },
  { label: 'UNICEF', value: 9.1, color: '#86BFC5' },
  { label: 'WHO', value: 0.0, color: '#515F74' },
];

const STOCK_UTILIZATION_DATA = [
  ['ADPH', 68, 32],
  ['AA2PH', 39, 61],
  ['AAPH', 52, 48],
  ['AMPH', 50, 50],
  ['ASPH', 36, 64],
  ['BDPH', 54, 46],
  ['DSPH', 62, 38],
  ['DDPH', 72, 28],
  ['GAPH', 11, 89],
  ['GNPH', 30, 70],
  ['HWPH', 61, 39],
  ['CNPH', 54, 46],
  ['JGPH', 61, 39],
  ['JMPH', 81, 19],
  ['KDPH', 41, 59],
  ['MKPH', 42, 58],
  ['NBPH', 28, 72],
  ['NKPH', 48, 52],
  ['SEPH', 42, 58],
  ['SYPH', 72, 28],
].map(([label, issued, soh]) => ({
  label,
  segments: [
    { label: 'Issued', value: issued },
    { label: 'Reserved', value: 0 },
    { label: 'Soh', value: soh },
    { label: 'Expired', value: 0 },
    { label: 'Damaged', value: 0 },
    { label: 'Suspended', value: 0 },
  ],
}));

const groupByCount = (rows, key) => {
  const grouped = rows.reduce((acc, row) => {
    const label = row[key] || 'Unknown';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(grouped).map(([label, value]) => ({ label, value }));
};

const groupBySum = (rows, key, valueKey) => {
  const grouped = rows.reduce((acc, row) => {
    const label = row[key] || 'Unknown';
    acc[label] = (acc[label] || 0) + (Number(row[valueKey]) || 0);
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

function TinySelect({ label = '2016' }) {
  return (
    <select
      value={label}
      aria-label="Report year"
      readOnly
      className="h-8 rounded-md border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:outline-none"
    >
      <option>{label}</option>
    </select>
  );
}

function DetailChartPanel({ title, icon = 'fa-circle-info', action, children }) {
  return (
    <ProgramPanel
      title={title}
      action={(
        <div className="flex items-center gap-2">
          {action}
          <i className={`fa-solid ${icon} text-[13px] text-primary/80`} />
        </div>
      )}
    >
      {children}
    </ProgramPanel>
  );
}

function DetailMetricTile({ icon, label, value, helper, tone = 'neutral' }) {
  const toneMap = {
    neutral: 'bg-surface-container text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  };

  return (
    <div className="flex min-w-0 rounded-lg border border-outline-variant bg-white px-4 py-3 shadow-[0px_2px_10px_rgba(10,50,53,0.04)]">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.04em] text-on-surface-variant">
            {label}
          </p>
          <p className="mt-1.5 text-[30px] font-extrabold leading-9 text-on-surface">
            {value}
          </p>
          {helper && (
            <p className="mt-0.5 truncate text-[13px] font-semibold leading-5 text-on-surface-variant" title={helper}>
              {helper}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <i className={`fa-solid ${icon} text-sm`} />
        </div>
      </div>
    </div>
  );
}

function EmptyDataTable({ title, columns, subtitle = '', rows = [] }) {
  return (
    <ProgramPanel title={title} subtitle={subtitle}>
      <ProgramMiniTable columns={columns} rows={rows} emptyMessage="No rows" />
      <div className="flex items-center justify-end gap-5 border-t border-surface-container-low px-4 py-3 text-[11px] font-semibold text-on-surface-variant">
        <span>Rows per page: 10</span>
        <span>0-0 of 0</span>
        <span className="inline-flex gap-3 text-outline">
          <i className="fa-solid fa-chevron-left" />
          <i className="fa-solid fa-chevron-right" />
        </span>
      </div>
    </ProgramPanel>
  );
}

function NationalMosBelowEop({ stockRow }) {
  const [hoveredGauge, setHoveredGauge] = useState(null);
  const current = firstAvailableNumber(stockRow, ['NationalMosBelowEop', 'CurrentMosBelowEop'], 2);
  const offTarget = firstAvailableNumber(stockRow, ['OffTarget', 'OffTargetMos'], 100);
  const unit = stockRow?.Unit || '50x2';
  const soh = firstAvailableNumber(stockRow, ['NationalMosSoh', 'MosSoh'], 70735);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const currentPct = Math.min(current / Math.max(offTarget, 1), 1);
  const currentLength = Math.max(circumference * currentPct, 4);

  return (
    <ProgramPanel title="National MOS Below EOP">
      <div className="px-3 pt-4">
        <div className="relative mx-auto h-28 w-28">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label="National MOS below EOP chart">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#DFE3E5"
              strokeWidth="18"
              onMouseEnter={() => setHoveredGauge('offTarget')}
              onMouseLeave={() => setHoveredGauge(null)}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#0B4F54"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${currentLength} ${circumference - currentLength}`}
              onMouseEnter={() => setHoveredGauge('current')}
              onMouseLeave={() => setHoveredGauge(null)}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full text-center">
            <span className="text-[9px] font-extrabold uppercase text-on-surface-variant">Current</span>
            <span className="text-[24px] font-extrabold leading-7 text-on-surface">{current}</span>
          </div>
          {hoveredGauge && (
            <div
              className="absolute rounded-md bg-[#2F3337] px-2 py-1 text-[12px] font-semibold text-white shadow-lg"
              style={{
                left: hoveredGauge === 'current' ? '62px' : '78px',
                top: hoveredGauge === 'current' ? '10px' : '38px',
              }}
            >
              {hoveredGauge === 'current' ? `Current: ${current}` : `Off target: ${offTarget}`}
            </div>
          )}
        </div>

        <div className="-mx-3 mt-1 grid grid-cols-2 border-t border-outline-variant text-body-sm">
          <div className="border-r border-outline-variant px-3 py-2">
            <p className="font-bold text-on-surface">Unit</p>
            <p className="mt-2 text-on-surface">{unit}</p>
          </div>
          <div className="px-3 py-2 text-right">
            <p className="font-bold text-on-surface">SOH</p>
            <p className="mt-2 text-on-surface">{formatNumber(soh)}</p>
          </div>
        </div>
      </div>
    </ProgramPanel>
  );
}

function ProgramItemSwitcher({ items = [], selectedItem, onSelectItem }) {
  if (!items.length || !onSelectItem) return null;

  return (
    <div className="sticky top-[72px] z-[9] -mx-lg border-b border-outline-variant bg-[#F6FAFC]/95 px-lg py-3 backdrop-blur">
      <div className="program-item-switcher-scroll flex items-center gap-2 overflow-x-auto pb-2">
        {items.map((item) => {
          const label = typeof item === 'string' ? item : item.label;
          const status = typeof item === 'string' ? '' : item.status;
          const active = label === selectedItem;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectItem(label)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-body-sm font-bold ${
                active
                  ? 'border-primary bg-primary text-white shadow-[0px_4px_14px_rgba(10,50,53,0.16)]'
                  : 'border-outline-variant bg-white text-on-surface-variant hover:border-primary/40 hover:text-primary'
              }`}
            >
              <span>{label}</span>
              {status && (
                <span className={`h-2 w-2 rounded-full ${status === 'Stocked Out' ? 'bg-error' : status === 'Below EOP' ? 'bg-warning' : 'bg-success'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StockStatusTable({ stockRow }) {
  const rows = stockRow ? [stockRow] : [];
  return (
    <ProgramPanel
      title="Stock Status"
      action={<TinySelect label="06/18/2026" />}
    >
      <ProgramMiniTable
        columns={[
          { key: 'site', label: 'Site' },
          { key: 'SOH', label: 'SOH', render: (row) => formatNumber(row.SOH) },
          { key: 'MOS', label: 'MOS', render: (row) => row.MOS.toFixed(1) },
          { key: 'QuantityPurchaseOrder', label: 'Ordered', render: (row) => formatNumber(row.QuantityPurchaseOrder) },
          { key: 'GIT', label: 'GIT', render: (row) => formatNumber(row.GIT) },
          { key: 'Min', label: 'Min', render: (row) => formatNumber(row.Min) },
          { key: 'Max', label: 'Max', render: (row) => formatNumber(row.Max) },
          { key: 'need', label: 'Need', render: (row) => formatNumber(Math.max(row.Max - row.SOH - row.GIT - row.QuantityPurchaseOrder, 0)) },
        ]}
        rows={rows.map((row) => ({ ...row, site: 'National' }))}
      />
    </ProgramPanel>
  );
}

function OrgToggle({ value, onChange }) {
  const isHPR = value === 'HPR';
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(isHPR ? 'RDF' : 'HPR')}
        className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F54] cursor-pointer ${
          isHPR ? 'bg-[#0B4F54]' : 'bg-[#86BFC5]'
        }`}
        aria-label="Toggle HPR/RDF"
        role="switch"
        aria-checked={isHPR}
      >
        <span
          className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
            isHPR ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('HPR')}
          className={`text-sm font-bold tracking-wide transition-colors duration-200 cursor-pointer ${
            isHPR ? 'text-[#0B4F54]' : 'text-[#707979] hover:text-[#404849]'
          }`}
        >
          HPR
        </button>
        <span className="text-[#CFD8DC] text-sm font-light select-none">/</span>
        <span
          className={`text-sm font-bold tracking-wide transition-colors duration-200 ${
            !isHPR ? 'text-[#0B4F54]' : 'text-[#707979]'
          }`}
        >
          RDF
        </span>
      </div>
    </div>
  );
}

function ProgramItemDetail({
  programName = 'Program',
  productName,
  itemOptions = [],
  stockRow,
  purchaseOrders,
  recentReceives,
  hubRows,
  onBack,
  onSelectItem,
}) {
  const productPOs = useMemo(
    () => purchaseOrders.filter((row) => row.ProductCN === productName),
    [purchaseOrders, productName],
  );

  const productReceives = useMemo(
    () => recentReceives.filter((row) => row.ProductCN === productName),
    [recentReceives, productName],
  );

  const hubStockRows = useMemo(
    () => hubRows
      .map((row) => ({ label: row.Site, value: Number(row[productName]) || 0 }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value),
    [hubRows, productName],
  );

  const totalPO = productPOs.reduce((sum, row) => sum + row.OrderQuantity, 0);
  const totalReceived = productReceives.reduce((sum, row) => sum + row.QuantityReceived, 0);
  const totalValue = productReceives.reduce((sum, row) => sum + row.AmountReceivedBirr, 0);
  const soh = stockRow?.SOH || 0;
  const amc = stockRow?.AMC || 0;
  const max = stockRow?.Max || 0;
  const min = stockRow?.Min || 0;
  const gap = Math.max(max - soh, 0);
  const wastage = firstAvailableNumber(stockRow, ['Wastage', 'WastageQuantity', 'Waste']);
  const nearExpiry = firstAvailableNumber(stockRow, ['nExpiry', 'NearExpiry', 'NearExpiryQuantity', 'ReExpiry']);
  const overage = Math.max(soh - max, 0);

  const pipelineChart = productPOs.map((row) => ({
    label: row.PurchaseOrderNumber,
    value: row.NextDeliveryQuantity,
    color: row.DeliveredQuantity > 0 ? '#0B4F54' : '#86BFC5',
  }));

  const expiryChart = productReceives.slice(0, 12).map((row) => ({
    label: row.FullDate,
    segments: [
      { label: 'Issued', value: row.QuantityReceived },
      { label: 'Available', value: Math.max(row.QuantityReceived - Math.round(row.QuantityReceived * 0.12), 0) },
    ],
  }));

  const daysOutChart = hubStockRows.slice(0, 18).map((row) => ({
    label: row.label,
    value: row.value > 0 ? 0 : 1,
    color: '#0B4F54',
  }));

  const pipelineHubData = useMemo(
    () => hubRows
      .filter((row) => row.Site && Number(row[productName]) > 0)
      .map((row) => {
        const total = Number(row[productName]) || 1;
        return {
          label: row.Site,
          segments: [
            { label: 'PO', value: Math.round(total * 0.35) },
            { label: 'GIT', value: Math.round(total * 0.20) },
            { label: 'Below Max', value: Math.round(total * 0.18) },
            { label: 'Above Max', value: Math.round(total * 0.15) },
            { label: 'pDOS', value: Math.round(total * 0.12) },
          ],
        };
      }),
    [hubRows, productName],
  );

  const manufacturerRows = groupBySum(productReceives, 'Manufacturer', 'AmountReceivedBirr').map((row) => ({
    ...row,
    share: `${safePercent(row.value, totalValue).toFixed(1)}%`,
  }));

  const countryRows = groupBySum(productReceives, 'Country', 'AmountReceivedBirr').map((row) => ({
    ...row,
    share: `${safePercent(row.value, totalValue).toFixed(1)}%`,
  }));

  const supplierRows = groupBySum(productPOs, 'Donor', 'OrderQuantity').map((row) => ({
    ...row,
    share: `${safePercent(row.value, totalPO).toFixed(1)}%`,
  }));

  const [activeOrg, setActiveOrg] = useState('HPR');

  const DETAIL_SECTIONS = [
    { id: 'pd-overview',     label: 'Overview' },
    { id: 'pd-stock-status', label: 'Stock Status' },
    { id: 'pd-charts',       label: 'Charts' },
    { id: 'pd-po',           label: 'Purchase Orders' },
    { id: 'pd-bin-card',     label: 'Bin Card' },
    { id: 'pd-manufacturers',label: 'Manufacturers' },
    { id: 'pd-supplier',     label: 'Supplier' },
    { id: 'pd-country',      label: 'Country' },
    { id: 'pd-received',     label: 'Received' },
    { id: 'pd-issued',       label: 'Issued' },
  ];

  return (
    <div className="space-y-5">
      <ProgramSectionNav sections={DETAIL_SECTIONS} scrollOffset={250} />
      <ProgramItemSwitcher
        items={itemOptions}
        selectedItem={productName}
        onSelectItem={onSelectItem}
      />

      <div className="sticky top-[140px] z-[8] -mx-lg bg-[#F6FAFC]/95 px-lg py-2 backdrop-blur border-b border-outline-variant">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-body-md font-bold text-primary hover:text-primary-hover"
            >
              <i className="fa-solid fa-arrow-left" />
              Back to {programName}
            </button>
          </div>
          <OrgToggle value={activeOrg} onChange={setActiveOrg} />
        </div>
      </div>

      <section id="pd-overview">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] items-stretch gap-4">
          <NationalMosBelowEop stockRow={stockRow} />
          <div className="grid h-full grid-cols-4 grid-rows-2 items-stretch gap-2">
          <DetailMetricTile icon="fa-boxes-stacked" label="AMC" value={compactNumber(amc)} helper="Avg monthly" tone="neutral" />
          <DetailMetricTile icon="fa-warehouse" label="SOH" value={compactNumber(soh)} helper="Stock on hand" tone="success" />
          <DetailMetricTile icon="fa-cart-shopping" label="Ordered" value={compactNumber(totalPO || stockRow?.QuantityPurchaseOrder)} helper={`${productPOs.length} PO lines`} tone="neutral" />
          <DetailMetricTile icon="fa-route" label="GIT" value={compactNumber(stockRow?.GIT)} helper="In transit" tone="success" />
          <DetailMetricTile icon="fa-box-open" label="Wastage" value={compactNumber(wastage)} helper="Reported waste" tone={wastage > 0 ? 'warning' : 'neutral'} />
          <DetailMetricTile icon="fa-clock" label="nExpiry" value={compactNumber(nearExpiry)} helper="Near expiry" tone={nearExpiry > 0 ? 'warning' : 'neutral'} />
          <DetailMetricTile icon="fa-triangle-exclamation" label="Gap" value={compactNumber(gap)} helper="Gap to max" tone={gap > 0 ? 'warning' : 'success'} />
          <DetailMetricTile icon="fa-circle-plus" label="Overage" value={compactNumber(overage)} helper="Above max" tone={overage > 0 ? 'error' : 'neutral'} />
        </div>
          </div>
        </section>

      <section id="pd-stock-status">
        <StockStatusTable stockRow={stockRow} />
      </section>

      <section id="pd-charts">
        <div className="grid grid-cols-[minmax(0,1fr)_330px] gap-x-5 gap-y-5">
        <DetailChartPanel title="Months Of Stock">
          <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">
            No data
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Funding Source" action={<TinySelect />}>
          <div className="flex h-64 items-center">
            <PieChart data={FUNDING_SOURCE_DATA} totalLabel="Funding source" />
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Stock Utilization">
          <ProgramStackedBarChart data={STOCK_UTILIZATION_DATA} normalized yLabel="%" height={220} />
        </DetailChartPanel>

        <DetailChartPanel title="Procurement Agents" action={<TinySelect />}>
          <div className="flex items-center justify-center py-6">
            <div className="w-[380px]">
              <PieChart data={[
                { label: 'EPSS', value: 65, color: '#0B4F54' },
                { label: 'WHO', value: 35, color: '#86BFC5' },
              ]} totalLabel="Procurement agents" />
            </div>
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Pipeline">
          <ProgramStackedBarChart data={pipelineHubData} normalized yLabel="%" height={220} yTicks={[0, 10, 20, 30, 40, 50, 60, 70, 80]} />
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Facility Type" action={<TinySelect />}>
          <div className="flex items-center justify-center py-4">
            <div className="w-[380px]">
              <PieChart data={hubStockRows.slice(0, 4)} totalLabel="Facility distribution" />
            </div>
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Expiry Breakdown in Qty">
          <ProgramStackedBarChart data={expiryChart} height={240} />
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Ownership Type" action={<TinySelect />}>
          <div className="flex items-center justify-center py-4">
            <div className="w-[380px]">
              <PieChart
                data={[
                  { label: 'Public', value: 68, color: '#0B4F54' },
                  { label: 'Private', value: 22, color: '#86BFC5' },
                  { label: 'Others', value: 10, color: '#D97706' },
                ]}
                totalLabel="Ownership distribution"
              />
            </div>
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Days Out of Stock in %" action={<TinySelect label="HUB" />}>
          <ProgramBarChart data={[
            { label: 'Adama', value: 12, color: '#0B4F54' },
            { label: 'Bahir Dar', value: 8, color: '#216E6A' },
            { label: 'Dessie', value: 25, color: '#D97706' },
            { label: 'Dire Dawa', value: 5, color: '#0B4F54' },
            { label: 'Gondar', value: 18, color: '#D97706' },
            { label: 'Hawassa', value: 3, color: '#0B4F54' },
            { label: 'Jimma', value: 30, color: '#BA1A1A' },
            { label: 'Mekele', value: 15, color: '#D97706' },
            { label: 'Addis Ababa', value: 7, color: '#0B4F54' },
            { label: 'Nekemte', value: 22, color: '#D97706' },
          ]} valueFormatter={(value) => `${value.toFixed(0)}%`} />
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Region" action={<TinySelect />}>
          <PieChart data={hubStockRows.slice(0, 8)} totalLabel="Region distribution" />
        </DetailChartPanel>
      </div>
      </section>

      <section id="pd-po">
        <ProgramPanel title="Purchase Order/Incoming Shipments" subtitle={`${productPOs.length} purchase order records`}>
          <PurchaseOrderTable rows={productPOs} />
        </ProgramPanel>
      </section>

      <section id="pd-bin-card">
        <EmptyDataTable
          title="Bin Card"
          subtitle="Stock movement history"
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'invoice', label: 'Invoice' },
          { key: 'transaction', label: 'Transaction' },
          { key: 'document', label: 'Document' },
          { key: 'type', label: 'Type' },
          { key: 'from', label: 'From' },
          { key: 'to', label: 'To' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'balance', label: 'Balance' },
        ]}
      />
      </section>

      <section id="pd-manufacturers">
        <EmptyDataTable
          title="Manufacturers"
          subtitle={`${manufacturerRows.length} source records`}
          rows={manufacturerRows}
          columns={[
            { key: 'label', label: 'Manufacturer' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>

      <section id="pd-supplier">
        <EmptyDataTable
          title="Supplier"
          rows={supplierRows}
          columns={[
            { key: 'label', label: 'Supplier' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>

      <section id="pd-country">
        <EmptyDataTable
          title="Country"
          rows={countryRows}
          columns={[
            { key: 'label', label: 'Country' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>

      <section id="pd-received">
        <ProgramPanel title="Received" subtitle={`${productReceives.length} months of data`}>
          <RecentReceivesTable rows={productReceives} />
        </ProgramPanel>
      </section>

      <section id="pd-issued">
        <EmptyDataTable
          title="Issued Data: Hub to Facility"
          subtitle="No issue records available for this product yet"
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'region', label: 'Region-Zone-Woreda' },
            { key: 'facility', label: 'Facility' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'invoice', label: 'Invoice' },
            { key: 'distributor', label: 'Distributor' },
          ]}
        />
      </section>
    </div>
  );
}

export default ProgramItemDetail;
