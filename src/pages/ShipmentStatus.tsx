import { useState, useEffect, useMemo } from 'react';
import StickyHeader from '../components/StickyHeader';
import IconButton from '../components/IconButton';

import { shipmentStatusHPRData, shipmentStatusRDFData } from '../data/shipmentStatusData';
import { purchaseOrderDetailHPRData, purchaseOrderDetailRDFData } from '../data/purchaseOrderDetailData';
import KPICard from '../components/KPICard';
import PieChart from '../components/PieChart';
import HBarChart from '../components/HBarChart';

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

const ROWS_PER_PAGE = 10;

/** Main Shipment Status Table */
function ShipmentTable({ rows }: any) {
  const [search, setSearch] = useState('');
  const [poTypeFilter, setPOTypeFilter] = useState('All');
  const [grnfFilter, setGRNFFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => { setCurrentPage(1); }, [search, poTypeFilter, grnfFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <i className="fa-solid fa-sort text-[#CFD8DC] ml-1 text-[9px]" />;
    return sortDir === 'asc'
      ? <i className="fa-solid fa-sort-up text-[#0B4F54] ml-1 text-[9px]" />
      : <i className="fa-solid fa-sort-down text-[#0B4F54] ml-1 text-[9px]" />;
  };

  const thCls = (key) =>
    `px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#707979] select-none whitespace-nowrap cursor-pointer hover:text-[#0B4F54] transition-colors duration-150 ${
      sortKey === key ? 'text-[#0B4F54]' : ''
    }`;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
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
        <div className="relative">
          <select
            value={poTypeFilter}
            onChange={e => setPOTypeFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#CFD8DC] rounded-lg bg-white text-[#181C1E] focus:outline-none focus:border-[#0B4F54] focus:ring-2 focus:ring-[#0B4F54]/10 transition-all cursor-pointer"
          >
            {poTypes.map(t => (
              <option key={t} value={t}>{t === 'All' ? 'PO Type: All' : t}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707979] text-[9px] pointer-events-none" />
        </div>

        {/* GRNF filter */}
        <div className="relative">
          <select
            value={grnfFilter}
            onChange={e => setGRNFFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#CFD8DC] rounded-lg bg-white text-[#181C1E] focus:outline-none focus:border-[#0B4F54] focus:ring-2 focus:ring-[#0B4F54]/10 transition-all cursor-pointer"
          >
            {['All', '≥99%', '100%', '0%'].map(o => (
              <option key={o} value={o}>{o === 'All' ? 'GRNF: All' : `GRNF ${o}`}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707979] text-[9px] pointer-events-none" />
        </div>

        {/* Result count */}
        <span className="text-xs text-[#707979] font-medium ml-auto">
          {filtered.length} of {rows.length} shipments
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#CFD8DC]">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#F0F4F6] border-b border-[#CFD8DC]">
            <tr>
              <th className={thCls('')} onClick={() => handleSort('')}>
                SN <SortIcon colKey="" />
              </th>
              <th className={thCls('PurchaseOrderNumber')} onClick={() => handleSort('PurchaseOrderNumber')}>
                PO Number <SortIcon colKey="PurchaseOrderNumber" />
              </th>
              <th className={thCls('PurchaseOrderType')} onClick={() => handleSort('PurchaseOrderType')}>
                PO Type <SortIcon colKey="PurchaseOrderType" />
              </th>
              <th className={thCls('PurchaseOrderDate')} onClick={() => handleSort('PurchaseOrderDate')}>
                PO Date <SortIcon colKey="PurchaseOrderDate" />
              </th>
              <th className={thCls('InvoiceNumber')} onClick={() => handleSort('InvoiceNumber')}>
                Invoice Number <SortIcon colKey="InvoiceNumber" />
              </th>
              <th className={thCls('ReceiptInvoiceDate')} onClick={() => handleSort('ReceiptInvoiceDate')}>
                Invoice Date <SortIcon colKey="ReceiptInvoiceDate" />
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.07em] text-[#707979] whitespace-nowrap">
                Invoice → GRNF Gap
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.07em] text-[#707979] whitespace-nowrap cursor-pointer hover:text-[#0B4F54] transition-colors" onClick={() => handleSort('PAmountGRNFPrint')}>
                GRNF% <SortIcon colKey="PAmountGRNFPrint" />
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.07em] text-[#707979] whitespace-nowrap cursor-pointer hover:text-[#0B4F54] transition-colors" onClick={() => handleSort('PAmountGRVPrint')}>
                GRV% <SortIcon colKey="PAmountGRVPrint" />
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F0F4F6] flex items-center justify-center">
                      <i className="fa-solid fa-box-open text-xl text-[#707979]" />
                    </div>
                    <div className="text-sm font-semibold text-[#404849]">No shipments found</div>
                    <div className="text-xs text-[#707979]">Try adjusting your search or filters</div>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const sn = parseInt(row[''] || (currentPage - 1) * ROWS_PER_PAGE + idx + 1, 10);
                const isEven = idx % 2 === 1;
                return (
                  <tr
                    key={idx}
                    className={`border-b border-[#F0F4F6] hover:bg-[#F6FAFC] transition-colors duration-100 group ${isEven ? 'bg-white' : 'bg-[#FAFCFD]'}`}
                  >
                    <td className="px-3 py-2.5 text-center text-xs font-semibold text-[#707979]">
                      {sn}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm font-bold text-[#0B4F54] group-hover:underline cursor-pointer">
                        {row.PurchaseOrderNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <POTypeBadge type={row.PurchaseOrderType} />
                    </td>
                    <td className="px-3 py-2.5 text-sm text-[#404849] whitespace-nowrap">
                      {row.PurchaseOrderDate}
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <span className="text-sm text-[#181C1E] break-all leading-tight block">
                        {row.InvoiceNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-[#404849] whitespace-nowrap">
                      {row.ReceiptInvoiceDate}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm text-[#707979] font-medium">
                      {row.InvoiceGRNFGap || '0'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <PctBadge pct={row.PAmountGRNFPrint} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <PctBadge pct={row.PAmountGRVPrint} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-[#707979]">
            Showing {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#CFD8DC] text-[#404849] hover:bg-[#F0F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
            >
              <i className="fa-solid fa-chevron-left text-[10px]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  p === currentPage
                    ? 'bg-[#0B4F54] text-white border border-[#0B4F54]'
                    : 'border border-[#CFD8DC] text-[#404849] hover:bg-[#F0F4F6]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#CFD8DC] text-[#404849] hover:bg-[#F0F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
            >
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/** Purchase Order Detail Table */
function PODetailTable({ headers, rows }: any) {
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

  return (
    <div className="overflow-x-auto rounded-xl border border-[#CFD8DC]">
      <table className="w-full min-w-[1100px]">
        <thead className="bg-[#F0F4F6] border-b border-[#CFD8DC]">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#707979] whitespace-nowrap">
                {LABEL_MAP[h] || h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F0F4F6] flex items-center justify-center">
                    <i className="fa-solid fa-file-circle-plus text-xl text-[#707979]" />
                  </div>
                  <div className="text-sm font-semibold text-[#404849]">No purchase order records</div>
                  <div className="text-xs text-[#707979]">Purchase order detail data will appear here once available</div>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-[#F0F4F6] hover:bg-[#F6FAFC] transition-colors">
                {headers.map(h => (
                  <td key={h} className="px-3 py-2.5 text-sm text-[#404849]">{row[h] || '—'}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
  const [isLoading, setIsLoading] = useState(true);
  const [shipmentRows, setShipmentRows] = useState([]);
  const [poHeaders, setPOHeaders] = useState([]);
  const [poRows, setPORows] = useState([]);

  // Load data when org changes
  useEffect(() => {
    setIsLoading(true);
    
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
    <div className="space-y-6 animate-fade-in">
      {/* ── Header Row ────────────────────────────────────────────────── */}
      <StickyHeader className="flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3235] tracking-tight leading-tight">
            Shipment Status
          </h1>
          <p className="text-sm text-[#707979] mt-0.5">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard variant="detailed" icon="fa-truck-fast" iconBg="bg-[#0B4F54]/10" iconColor="text-[#0B4F54]" label="Total Shipments" value={stats.total} valueColor="text-[#0B4F54]" subtitle="HPR active shipments" />
            <KPICard variant="detailed" icon="fa-circle-check" iconBg="bg-[#059669]/10" iconColor="text-[#059669]" label="≥99% GRNF" value={stats.highGRNF} valueColor="text-[#059669]" subtitle={`${((stats.highGRNF / stats.total) * 100).toFixed(0)}% of total`} />
            <KPICard variant="detailed" icon="fa-circle-xmark" iconBg="bg-[#BA1A1A]/10" iconColor="text-[#BA1A1A]" label="0% GRNF" value={stats.zeroGRNF} valueColor="text-[#BA1A1A]" subtitle="Requires attention" />
            <KPICard variant="detailed" icon="fa-trophy" iconBg="bg-[#059669]/10" iconColor="text-[#059669]" label="100% Complete" value={stats.fullGRNF} valueColor="text-[#059669]" subtitle="Fully received" />
          </div>

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
              <PieChart data={donutData} />
            </div>

            {/* Horizontal Bar — PO Type */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] p-6 flex flex-col">
              <div>
                <h3 className="text-sm font-bold text-[#181C1E]">Shipments by PO Type</h3>
                <p className="text-xs text-[#707979] mt-0.5">{activeOrg} — number of shipments per purchase order category</p>
              </div>
              <div className="flex-1 flex items-center">
                <HBarChart data={barData} />
              </div>
            </div>
          </div>

          {/* Shipment Status Table Section */}
          <div className="bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F4F6] flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-[#181C1E] flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#0B4F54]" />
                  Shipment Status: EPSS
                </h2>
                <p className="text-xs text-[#707979] mt-0.5 ml-3.5">{activeOrg} — Purchase order shipment tracking with GRNF/GRV completion</p>
              </div>
              <div className="flex items-center gap-2">
                <IconButton variant="info" contentId="shipment-status-epss" />
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#CFD8DC] text-xs font-semibold text-[#404849] hover:bg-[#F0F4F6] transition-colors">
                  <i className="fa-solid fa-download text-[10px]" />
                  Export
                </button>
              </div>
            </div>
            <div className="p-6">
              <ShipmentTable rows={shipmentRows} />
            </div>
          </div>

          {/* Purchase Order Detail Report */}
          <div className="bg-white rounded-xl border border-[#CFD8DC] shadow-[0px_4px_20px_rgba(10,50,53,0.06)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F4F6] flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-[#181C1E] flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#515F74]" />
                  Purchase Order Detail Report
                </h2>
                <p className="text-xs text-[#707979] mt-0.5 ml-3.5">Detailed line-item view of purchase orders including supplier, funding, and pricing</p>
              </div>
              <div className="flex items-center gap-2">
                <IconButton variant="info" contentId="po-detail-report" />
                <span className="text-xs font-medium text-[#707979] bg-[#F0F4F6] px-2.5 py-1 rounded-full">
                  {poRows.length} records
                </span>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#CFD8DC] text-xs font-semibold text-[#404849] hover:bg-[#F0F4F6] transition-colors">
                  <i className="fa-solid fa-download text-[10px]" />
                  Export
                </button>
              </div>
            </div>
            <div className="p-6">
              {poHeaders.length > 0 ? (
                <PODetailTable headers={poHeaders} rows={poRows} />
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
