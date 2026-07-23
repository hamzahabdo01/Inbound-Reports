import { useState, useEffect, useMemo } from 'react';
import StickyHeader from '../../components/StickyHeader';
import IconButton from '../../components/IconButton';

import { PODRIDRQDPKOID_WebApi } from '../../api/fanos';
import KPICard from '../../components/KPICard';
import KpiCarousel from '../../components/KpiCarousel';
import AutoScrollKPIRow from '../../components/AutoScrollKPIRow';
import Table, { Td } from '../../components/BaseTable';
import ExportDropdown from '../../components/ExportDropdown';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function parsePercent(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val).replace('%', '').trim());
  return isNaN(n) ? null : n;
}

function classifyGRNF(pct) {
  if (pct === null) return 'unknown';
  if (pct === 0) return 'zero';
  if (pct >= 100) return 'full';
  if (pct >= 99) return 'high';
  return 'partial';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** HPR / RDF animated toggle */
function OrgToggle({ value, onChange }: any) {
  const isHPR = value === 'HPR';
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(isHPR ? 'RDF' : 'HPR')}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F54] cursor-pointer ${
          isHPR ? 'bg-[#0B4F54]' : 'bg-[#86BFC5]'
        }`}
        aria-label="Toggle HPR/RDF"
        role="switch"
        aria-checked={isHPR}
      >
        <span
          className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
            isHPR ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('HPR')}
          className={`text-xs font-bold tracking-wide transition-colors duration-200 cursor-pointer ${
            isHPR ? 'text-[#0B4F54]' : 'text-[#707979] hover:text-[#404849]'
          }`}
        >
          HPR
        </button>
        <span className="text-[#CFD8DC] text-xs font-light select-none">/</span>
        <span
          className={`text-xs font-bold tracking-wide transition-colors duration-200 ${
            !isHPR ? 'text-[#0B4F54]' : 'text-[#707979]'
          }`}
        >
          RDF
        </span>
      </div>
    </div>
  );
}

/** GRNF/GRV percent badge */
function PctBadge({ pct }: any) {
  const val = parsePercent(pct);
  const cls = classifyGRNF(val);

  const styles = {
    zero:    'bg-[#BA1A1A] text-white',
    full:    'bg-[#0B4F54] text-white',
    high:    'bg-[#059669] text-white',
    partial: 'bg-[#D97706] text-white',
    unknown: 'bg-[#DFE3E5] text-[#404849]',
  };

  const display = val !== null ? `${parseFloat(val.toFixed(2))}%` : '—';

  return (
    <span className={`inline-flex items-center justify-center min-w-[56px] px-2.5 py-1 rounded-md text-[11px] font-bold ${styles[cls]}`}>
      {display}
    </span>
  );
}

/** PO Type chip */
function POTypeBadge({ type }: any) {
  const map = {
    'FCA':             'bg-[#0B4F54]/10 text-[#0B4F54]',
    'FOB':             'bg-[#515F74]/10 text-[#515F74]',
    'Cost and Freight':'bg-[#D97706]/10 text-[#D97706]',
    'CPT':             'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    'Local Purchase':  'bg-[#059669]/10 text-[#059669]',
  };
  const cls = map[type?.trim()] || 'bg-[#DFE3E5] text-[#404849]';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${cls}`}>
      {type || '—'}
    </span>
  );
}

/** Main Shipment Status Table */
function ShipmentTable({ rows, page, setPage }: any) {
  const [search, setSearch] = useState('');
  const [poTypeFilter, setPOTypeFilter] = useState('All');
  const [grnfFilter, setGRNFFilter] = useState('All');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const poTypes = useMemo(() => {
    const s = new Set<string>(rows.map((r: any) => r.PurchaseOrderType?.trim()).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [rows]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = [...rows];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        Object.values(r).some(v => v && v.toString().toLowerCase().includes(q))
      );
    }
    if (poTypeFilter !== 'All') {
      result = result.filter(r => r.PurchaseOrderType?.trim() === poTypeFilter);
    }
    if (grnfFilter !== 'All') {
      result = result.filter(r => {
        const pct = parsePercent(r.PAmountGRNFPrint);
        if (grnfFilter === '0%') return pct === 0;
        if (grnfFilter === '≥99%') return pct !== null && pct >= 99;
        if (grnfFilter === '100%') return pct !== null && pct >= 100;
        return true;
      });
    }
    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let av = a[sortKey] || '';
        let bv = b[sortKey] || '';
        if (sortKey === 'PAmountGRNFPrint' || sortKey === 'PAmountGRVPrint') {
          av = parsePercent(av) ?? -1;
          bv = parsePercent(bv) ?? -1;
        } else if (sortKey === '') {
          av = parseInt(a[''] || 0, 10);
          bv = parseInt(b[''] || 0, 10);
        } else {
          av = av.toString().toLowerCase();
          bv = bv.toString().toLowerCase();
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, search, poTypeFilter, grnfFilter, sortKey, sortDir]);

  useEffect(() => { if (setPage) setPage(1); }, [search, poTypeFilter, grnfFilter]);

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const headers = [
    { key: 'PurchaseOrderNumber', label: 'PO Number' },
    { key: 'PurchaseOrderType', label: 'PO Type' },
    { key: 'PurchaseOrderDate', label: 'PO Date' },
    { key: 'InvoiceNumber', label: 'Invoice Number' },
    { key: 'ReceiptInvoiceDate', label: 'Invoice Date' },
    { key: 'InvoiceGRNFGap', label: 'Invoice → GRNF Gap', className: 'text-center' },
    { key: 'PAmountGRNFPrint', label: 'GRNF%', className: 'text-center' },
    { key: 'PAmountGRVPrint', label: 'GRV%', className: 'text-center' },
  ];

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full md:w-auto md:flex-1 min-w-[200px]">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#707979] text-xs" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PO Number, Invoice..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#CFD8DC] rounded-lg bg-white text-[#181C1E] placeholder-[#707979] focus:outline-none focus:border-[#0B4F54] focus:ring-2 focus:ring-[#0B4F54]/10 transition-all"
          />
        </div>

        {/* PO Type filter */}
        <div className="relative flex-1 md:flex-none">
          <select
            value={poTypeFilter}
            onChange={e => setPOTypeFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-[#CFD8DC] rounded-lg bg-white text-[#181C1E] focus:outline-none focus:border-[#0B4F54] focus:ring-2 focus:ring-[#0B4F54]/10 transition-all cursor-pointer"
          >
            {poTypes.map(t => (
              <option key={t} value={t}>{t === 'All' ? 'PO Type: All' : t}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707979] text-[9px] pointer-events-none" />
        </div>

        {/* GRNF filter */}
        <div className="relative flex-1 md:flex-none">
          <select
            value={grnfFilter}
            onChange={e => setGRNFFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-[#CFD8DC] rounded-lg bg-white text-[#181C1E] focus:outline-none focus:border-[#0B4F54] focus:ring-2 focus:ring-[#0B4F54]/10 transition-all cursor-pointer"
          >
            {['All', '≥99%', '100%', '0%'].map(o => (
              <option key={o} value={o}>{o === 'All' ? 'GRNF: All' : `GRNF ${o}`}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707979] text-[9px] pointer-events-none" />
        </div>

      </div>

      {/* Table */}
      <Table
        columns={headers}
        rows={filtered}
        page={page}
        setPage={setPage}
        rowsPerPage={10}
        renderRow={(row, idx) => {
          const sn = idx != null ? idx + 1 : 0;
          return (
            <>
              <Td className="font-bold text-[#0B4F54]">{row.PurchaseOrderNumber}</Td>
              <Td><POTypeBadge type={row.PurchaseOrderType} /></Td>
              <Td className="whitespace-nowrap">{formatDate(row.PurchaseOrderDate)}</Td>
              <Td className="max-w-[160px]"><span className="break-all leading-tight block">{row.InvoiceNumber}</span></Td>
              <Td className="whitespace-nowrap">{formatDate(row.ReceiptInvoiceDate)}</Td>
              <Td className="text-center font-medium text-[#707979]">{row.InvoiceGRNFGap || '0'}</Td>
              <Td className="text-center"><PctBadge pct={row.PAmountGRNFPrint} /></Td>
              <Td className="text-center"><PctBadge pct={row.PAmountGRVPrint} /></Td>
            </>
          );
        }}
      />
    </div>
  );
}


const PO_DETAIL_COLUMNS = [
  { key: 'PONo', label: 'PO No' },
  { key: 'TenderNumber', label: 'Tender No' },
  { key: 'ItemName', label: 'Item' },
  { key: 'Supplier', label: 'Supplier' },
  { key: 'TenderType', label: 'Tender Type' },
  { key: 'PODate', label: 'PO Date' },
  { key: 'POType', label: 'PO Type' },
  { key: 'FundingSource', label: 'Funding Source' },
  { key: 'Unit', label: 'Unit' },
  { key: 'Quantity', label: 'Quantity' },
  { key: 'UnitPrice', label: 'Unit Price' },
  { key: 'TotalAmount', label: 'Total Amount' },
  { key: 'Currency', label: 'Currency' },
  { key: 'Manufacturer', label: 'Manufacturer' },
  { key: 'Country', label: 'Country' },
  { key: 'LocalAgent', label: 'Local Agent' },
];

function PODetailTable({ rows, poTypes, selectedPoType, onPOTypeChange, page, setPage }: any) {
  return (
    <div className="space-y-3">
      <div className="relative w-full md:w-72">
        <select
          value={selectedPoType || ''}
          onChange={e => { onPOTypeChange(e.target.value); if (setPage) setPage(1); }}
          className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-[#CFD8DC] rounded-lg bg-white text-[#181C1E] focus:outline-none focus:border-[#0B4F54] focus:ring-2 focus:ring-[#0B4F54]/10 transition-all cursor-pointer"
        >
          {poTypes.map((t: string) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707979] text-[9px] pointer-events-none" />
      </div>
      <Table
        columns={PO_DETAIL_COLUMNS}
        rows={rows}
        page={page}
        setPage={setPage}
        rowsPerPage={10}
        minWidth="2400px"
        renderRow={(row) => (
          <>
            {PO_DETAIL_COLUMNS.map(col => (
              <Td key={col.key}>{col.key === 'PODate' ? formatDate(row[col.key]) : row[col.key] || '—'}</Td>
            ))}
          </>
        )}
      />
    </div>
  );
}

/** RDF Coming Soon placeholder */
function RDFPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-[0px_4px_20px_rgba(10,50,53,0.12)]"
        style={{ background: 'linear-gradient(135deg, #0B4F54 0%, #00373B 100%)' }}
      >
        <i className="fa-solid fa-flag text-3xl text-white" />
      </div>
      <h3 className="text-xl font-bold text-[#181C1E] mb-2">RDF Data Coming Soon</h3>
      <p className="text-sm text-[#707979] max-w-sm leading-relaxed">
        RDF shipment status data will be loaded here once provided. Toggle back to HPR to view current data.
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B4F54]/8 border border-[#0B4F54]/20">
        <div className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
        <span className="text-xs font-semibold text-[#0B4F54]">Pending data provision</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ShipmentStatus() {
  const [activeOrg, setActiveOrg] = useState('HPR');
  const [shipmentLoading, setShipmentLoading] = useState(true);
  const [poLoading, setPOLoading] = useState(true);
  const [shipmentRows, setShipmentRows] = useState([]);
  const [poRows, setPORows] = useState([]);
  const [poAllRows, setPOAllRows] = useState<any[]>([]);
  const [poTypes, setPOTypes] = useState<string[]>([]);
  const [selectedPoType, setSelectedPoType] = useState('');
  const [shipmentPage, setShipmentPage] = useState(1);
  const [poDetailPage, setPODetailPage] = useState(1);

  const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
      const mq = window.matchMedia(query);
      const onChange = () => setMatches(mq.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }, [query]);
    return matches;
  };

  const isMobile = useMediaQuery('(max-width: 767px)');

  // Load data when org changes
  useEffect(() => {
    let cancelled = false;
    setShipmentLoading(true);
    setPOLoading(true);
    setShipmentPage(1);
    setPODetailPage(1);

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    // PO detail — fetch all, then filter client-side by PO Type
    PODRIDRQDPKOID_WebApi.getCenterPODetail({
      ProcurerCode: 'PFSA',
      ModeCode: activeOrg,
    }).then((res) => {
      if (!cancelled) {
        const full = ((res?.data as any)?.Data || []) as any[];
        setPOAllRows(full);
        const types = Array.from(new Set<string>(full.map((r: any) => r.POType?.trim()).filter(Boolean))).sort();
        setPOTypes(types);
        const defaultType = types.includes('Local Purchase') ? 'Local Purchase' : (types[0] || '');
        setSelectedPoType(defaultType);
        setPORows(defaultType ? full.filter((r: any) => r.POType?.trim() === defaultType) : full);
        setPOLoading(false);
      }
    }).catch(() => {
      if (!cancelled) { setPOAllRows([]); setPOTypes([]); setSelectedPoType(''); setPOLoading(false); }
    });

    // Shipment status from API
    PODRIDRQDPKOID_WebApi.getCenterInvoiceDistribution({
      ProcurerCode: 'PFSA',
      ModeCode: activeOrg,
      State: 'InProgress',
    }).then((res) => {
      if (!cancelled) {
        setShipmentRows(((res?.data as any)?.Data || []) as any[]);
        setShipmentLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setShipmentRows([]);
        setShipmentLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [activeOrg]);

  // Client-side filter when dropdown changes
  useEffect(() => {
    if (!selectedPoType || !poAllRows.length) return;
    setPORows(poAllRows.filter((r: any) => r.POType?.trim() === selectedPoType));
    setPODetailPage(1);
  }, [selectedPoType, poAllRows]);

  // Derived KPI stats
  const stats = useMemo(() => {
    const total = shipmentRows.length;
    const zeroGRNF = shipmentRows.filter(r => parsePercent(r.PAmountGRNFPrint) === 0).length;
    const highGRNF = shipmentRows.filter(r => { const p = parsePercent(r.PAmountGRNFPrint); return p !== null && p >= 99; }).length;
    const fullGRNF = shipmentRows.filter(r => { const p = parsePercent(r.PAmountGRNFPrint); return p !== null && p >= 100; }).length;
    return { total, zeroGRNF, highGRNF, fullGRNF };
  }, [shipmentRows]);

  const kpiCards = useMemo(() => [
    { icon: 'fa-truck-fast', iconBg: 'bg-[#0B4F54]/10', iconColor: 'text-[#0B4F54]', label: 'Total Shipments', value: stats.total, valueColor: 'text-[#0B4F54]', subtitle: 'HPR active shipments' },
    { icon: 'fa-circle-check', iconBg: 'bg-[#059669]/10', iconColor: 'text-[#059669]', label: '≥99% GRNF', value: stats.highGRNF, valueColor: 'text-[#059669]', subtitle: `${((stats.highGRNF / stats.total) * 100).toFixed(0)}% of total` },
    { icon: 'fa-circle-xmark', iconBg: 'bg-[#BA1A1A]/10', iconColor: 'text-[#BA1A1A]', label: '0% GRNF', value: stats.zeroGRNF, valueColor: 'text-[#BA1A1A]', subtitle: 'Requires attention' },
    { icon: 'fa-trophy', iconBg: 'bg-[#059669]/10', iconColor: 'text-[#059669]', label: '100% Complete', value: stats.fullGRNF, valueColor: 'text-[#059669]', subtitle: 'Fully received' },
  ], [stats]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header Row ────────────────────────────────────────────────── */}
      <StickyHeader className="flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0A3235] tracking-tight leading-tight">
            Shipment Status
          </h1>
          <p className="text-xs text-[#707979] mt-0.5">
          EPSS — {activeOrg === 'HPR' ? 'Health Programmes (HPR)' : 'Revolving Drug Fund (RDF)'} Shipment Tracking
        </p>
        </div>
        <div className="flex items-center gap-4">
          <OrgToggle value={activeOrg} onChange={(org) => { setActiveOrg(org); }} />
        </div>
      </StickyHeader>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      {shipmentLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white border border-outline-variant shadow-[0px_4px_20px_rgba(10,50,53,0.06)] animate-pulse flex items-end p-4">
              <div className="space-y-2 w-full">
                <div className="h-3 bg-surface-container-high rounded w-3/4" />
                <div className="h-6 bg-surface-container-high rounded w-1/2" />
                <div className="h-2 bg-surface-container-high rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isMobile ? (
        <KpiCarousel>
          {kpiCards.map((card, i) => <KPICard key={i} variant="detailed" {...card} />)}
        </KpiCarousel>
      ) : (
        <div className="mb-lg">
          <AutoScrollKPIRow cards={kpiCards} />
        </div>
      )}



          {/* Shipment Status Table Section */}
          <div className="bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F4F6]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-[#181C1E] flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-5 rounded-full bg-[#0B4F54]" />
                  Shipment Status: EPSS
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <IconButton variant="info" contentId="shipment-status-epss" />
                  <ExportDropdown
                    headers={[
                      { key: 'PurchaseOrderNumber', label: 'PO Number' },
                      { key: 'PurchaseOrderType', label: 'PO Type' },
                      { key: 'PurchaseOrderDate', label: 'PO Date' },
                      { key: 'InvoiceNumber', label: 'Invoice Number' },
                      { key: 'ReceiptInvoiceDate', label: 'Invoice Date' },
                      { key: 'InvoiceGRNFGap', label: 'Invoice→GRNF Gap' },
                      { key: 'PAmountGRNFPrint', label: 'GRNF%' },
                      { key: 'PAmountGRVPrint', label: 'GRV%' },
                    ]}
                    rows={shipmentRows}
                    filename="shipment-status"
                  />
                </div>
              </div>
              <p className="text-xs text-[#707979] mt-1">{activeOrg} — Purchase order shipment tracking with GRNF/GRV completion</p>
            </div>
            <div className="p-6">
              {shipmentLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-3.5 bg-surface-container-high rounded w-28" />
                      <div className="h-3.5 bg-surface-container-high rounded w-20" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded w-32" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded w-16" />
                      <div className="h-3.5 bg-surface-container-high rounded w-12" />
                      <div className="h-3.5 bg-surface-container-high rounded w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <ShipmentTable rows={shipmentRows} page={shipmentPage} setPage={setShipmentPage} />
              )}
            </div>
          </div>

          {/* Purchase Order Detail Report */}
          <div className="bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F4F6]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-[#181C1E] flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-5 rounded-full bg-[#515F74]" />
                  Purchase Order Detail Report
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <IconButton variant="info" contentId="po-detail-report" />
                  <ExportDropdown
                    headers={PO_DETAIL_COLUMNS}
                    rows={poRows}
                    filename="po-detail-report"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[#707979]">Detailed line-item view of purchase orders including supplier, funding, and pricing</p>
                <span className="text-xs font-medium text-[#707979] bg-[#F0F4F6] px-4 py-1.5 rounded-full hidden md:inline">
                  {poRows.length} records
                </span>
              </div>
              <span className="w-fit text-xs font-medium text-[#707979] bg-[#F0F4F6] px-2.5 py-1 rounded-full md:hidden mt-1">
                {poRows.length} records
              </span>
            </div>
            <div className="p-6">
              {poLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-3.5 bg-surface-container-high rounded w-20" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded flex-1" />
                      <div className="h-3.5 bg-surface-container-high rounded w-28" />
                      <div className="h-3.5 bg-surface-container-high rounded w-20" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded w-20" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded w-12" />
                      <div className="h-3.5 bg-surface-container-high rounded w-16" />
                      <div className="h-3.5 bg-surface-container-high rounded w-20" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded w-16" />
                      <div className="h-3.5 bg-surface-container-high rounded w-24" />
                      <div className="h-3.5 bg-surface-container-high rounded w-16" />
                      <div className="h-3.5 bg-surface-container-high rounded w-20" />
                    </div>
                  ))}
                </div>
              ) : poRows.length > 0 ? (
                <PODetailTable rows={poRows} poTypes={poTypes} selectedPoType={selectedPoType} onPOTypeChange={setSelectedPoType} page={poDetailPage} setPage={setPODetailPage} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <i className="fa-solid fa-table text-3xl text-[#CFD8DC] mb-3" />
                  <div className="text-sm text-[#707979]">No data available</div>
                </div>
              )}
            </div>
          </div>

    </div>
  );
}

export default ShipmentStatus;
