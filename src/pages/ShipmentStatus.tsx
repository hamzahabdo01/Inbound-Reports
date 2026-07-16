import { useState, useEffect, useMemo } from 'react';
import StickyHeader from '../components/StickyHeader';
import IconButton from '../components/IconButton';

import { shipmentStatusHPRData, shipmentStatusRDFData } from '../data/shipmentStatusData';
import { purchaseOrderDetailHPRData, purchaseOrderDetailRDFData } from '../data/purchaseOrderDetailData';
import AutoScrollKPIRow from '../components/AutoScrollKPIRow';
import PieChart from '../components/PieChart';
import HBarChart from '../components/HBarChart';
import { Table, Td } from './po/poShared';
import ExportDropdown from '../components/ExportDropdown';

// ─── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSVLocal(raw) {
  if (!raw || !raw.trim()) return [];
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, '');
    if (!line.trim()) continue;
    const values = [];
    let cur = '';
    let inQ = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function parseCSVHeaders(raw) {
  if (!raw || !raw.trim()) return [];
  const first = raw.trim().split('\n')[0];
  return first.split(',').map(h => h.trim().replace(/\r/g, ''));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parsePercent(str) {
  if (!str) return null;
  const n = parseFloat(str.replace('%', '').trim());
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
    full:    'bg-[#059669] text-white',
    high:    'bg-[#0B4F54] text-white',
    partial: 'bg-[#D97706] text-white',
    unknown: 'bg-[#DFE3E5] text-[#404849]',
  };

  return (
    <span className={`inline-flex items-center justify-center min-w-[56px] px-2.5 py-1 rounded-md text-[11px] font-bold ${styles[cls]}`}>
      {pct || '—'}
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
        headers={headers}
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
              <Td className="whitespace-nowrap">{row.PurchaseOrderDate}</Td>
              <Td className="max-w-[160px]"><span className="break-all leading-tight block">{row.InvoiceNumber}</span></Td>
              <Td className="whitespace-nowrap">{row.ReceiptInvoiceDate}</Td>
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


/** Purchase Order Detail Table */
const LABEL_MAP = {
  PONo: 'PO No',
  TenderNumber: 'Tender No',
  ItemName: 'Item',
  Supplier: 'Supplier',
  TenderType: 'Tender Type',
  PODate: 'PO Date',
  POType: 'PO Type',
  FundingSource: 'Funding Source',
  Unit: 'Unit',
  Quantity: 'Quantity',
  UnitPrice: 'Unit Price',
  TotalAmount: 'Total Amount',
  Currency: 'Currency',
  Manufacturer: 'Manufacturer',
  Country: 'Country',
  LocalAgent: 'Local Agent',
};

function PODetailTable({ headers, rows, page, setPage }: any) {
  const tableHeaders = headers.map(h => ({ key: h, label: LABEL_MAP[h] || h }));

  return (
    <Table
      headers={tableHeaders}
      rows={rows}
      page={page}
      setPage={setPage}
      rowsPerPage={10}
      renderRow={(row) => (
        <>
          {headers.map(h => (
            <Td key={h}>{row[h] || '—'}</Td>
          ))}
        </>
      )}
    />
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
  const [isLoading, setIsLoading] = useState(true);
  const [shipmentRows, setShipmentRows] = useState([]);
  const [poHeaders, setPOHeaders] = useState([]);
  const [poRows, setPORows] = useState([]);
  const [barOpenIdx, setBarOpenIdx] = useState(-1);
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
    setIsLoading(true);
    setShipmentPage(1);
    setPODetailPage(1);
    
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }

    const timer = setTimeout(() => {
      const rawShipment = activeOrg === 'HPR' ? shipmentStatusHPRData : shipmentStatusRDFData;
      const rawPO = activeOrg === 'HPR' ? purchaseOrderDetailHPRData : purchaseOrderDetailRDFData;

      const parsed = parseCSVLocal(rawShipment);
      setShipmentRows(parsed);

      const headers = parseCSVHeaders(rawPO);
      setPOHeaders(headers);
      const poData = parseCSVLocal(rawPO);
      setPORows(poData);
      setIsLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [activeOrg]);

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

  // Donut chart data — GRNF distribution
  const donutData = useMemo(() => {
    const full = shipmentRows.filter(r => { const p = parsePercent(r.PAmountGRNFPrint); return p !== null && p >= 100; }).length;
    const high = shipmentRows.filter(r => { const p = parsePercent(r.PAmountGRNFPrint); return p !== null && p >= 99 && p < 100; }).length;
    const zero = shipmentRows.filter(r => parsePercent(r.PAmountGRNFPrint) === 0).length;
    const partial = shipmentRows.filter(r => { const p = parsePercent(r.PAmountGRNFPrint); return p !== null && p > 0 && p < 99; }).length;
    return [
      { label: '100% Complete', value: full, color: '#059669' },
      { label: '≥99% GRNF', value: high, color: '#0B4F54' },
      { label: '0% GRNF', value: zero, color: '#BA1A1A' },
      { label: 'Partial (1–98%)', value: partial, color: '#D97706' },
    ].filter(d => d.value > 0);
  }, [shipmentRows]);

  // Bar chart data — PO Type breakdown
  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    shipmentRows.forEach(r => {
      const t = r.PurchaseOrderType?.trim() || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: '#0B4F54' }));
  }, [shipmentRows]);

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

      {/* ── Loading Skeleton ──────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-[#F0F4F6] animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-[#F0F4F6] animate-pulse" />
          <div className="h-96 rounded-xl bg-[#F0F4F6] animate-pulse" />
        </div>
      )}

      {/* ── Content (HPR or RDF) ──────────────────────────────────────── */}
      {!isLoading && (
        <>
          {/* KPI Cards */}
          <AutoScrollKPIRow cards={kpiCards} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Donut — GRNF Distribution */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#181C1E]">GRNF Status Distribution</h3>
                  <p className="text-xs text-[#707979] mt-0.5">{activeOrg} — breakdown of receipt completion levels</p>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton variant="expand" data={donutData} title="GRNF Status Distribution" />
                  <IconButton variant="info" contentId="shipment-grnf-distribution" />
                </div>
              </div>
              <div className="w-full h-[240px] flex items-center justify-center">
                <PieChart data={donutData} />
              </div>
            </div>

            {/* Horizontal Bar — PO Type */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] p-6 flex flex-col">
              <div>
                <h3 className="text-sm font-bold text-[#181C1E]">Shipments by PO Type</h3>
                <p className="text-xs text-[#707979] mt-0.5">{activeOrg} — number of shipments per purchase order category</p>
              </div>
              {isMobile ? (
                <div className="space-y-1 mt-2">
                  {barData.map((d, i) => {
                    const isOpen = barOpenIdx === i;
                    return (
                      <div key={d.label} className="rounded-xl border border-[#CFD8DC] bg-white overflow-hidden">
                        <button onClick={() => setBarOpenIdx(prev => prev === i ? -1 : i)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F6FAFC]"
                        >
                          <span className="flex-1 text-sm font-semibold text-[#181C1E] truncate">{d.label}</span>
                          <span className="text-xs font-bold text-[#707979] tabular-nums">{d.value}</span>
                          <i className={`fa-solid fa-chevron-down text-[10px] text-[#707979] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0">
                            <div className="h-px bg-[#CFD8DC]/50 mb-3" />
                            <div className="bg-[#F6FAFC] rounded-lg p-4 space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-[#707979]">Type</span><span className="font-bold text-[#181C1E]">{d.label}</span></div>
                              <div className="flex justify-between"><span className="text-[#707979]">Count</span><span className="font-bold text-[#181C1E]">{d.value}</span></div>
                              <div className="flex justify-between"><span className="text-[#707979]">Percentage</span><span className="font-bold text-[#181C1E]">{stats.total > 0 ? ((d.value / stats.total) * 100).toFixed(1) : 0}%</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center">
                  <HBarChart data={barData} />
                </div>
              )}
            </div>
          </div>

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
              <ShipmentTable rows={shipmentRows} page={shipmentPage} setPage={setShipmentPage} />
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
                    headers={poHeaders.map(h => ({ key: h, label: LABEL_MAP[h] || h }))}
                    rows={poRows}
                    filename="po-detail-report"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-[#707979]">Detailed line-item view of purchase orders including supplier, funding, and pricing</p>
                <span className="text-xs font-medium text-[#707979] bg-[#F0F4F6] px-2.5 py-1 rounded-full hidden md:inline">
                  {poRows.length} records
                </span>
              </div>
              <span className="w-fit text-xs font-medium text-[#707979] bg-[#F0F4F6] px-2.5 py-1 rounded-full md:hidden mt-1">
                {poRows.length} records
              </span>
            </div>
            <div className="p-6">
              {poHeaders.length > 0 ? (
                <PODetailTable headers={poHeaders} rows={poRows} page={poDetailPage} setPage={setPODetailPage} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <i className="fa-solid fa-table text-3xl text-[#CFD8DC] mb-3" />
                  <div className="text-sm text-[#707979]">No data available</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ShipmentStatus;
