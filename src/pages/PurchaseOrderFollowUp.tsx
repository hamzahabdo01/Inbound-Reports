import { useState, useEffect, useMemo, useRef } from 'react';
import { parseCSV, parseQuantity } from '../utils/csvParser';
import { purchaseOrderCSVData } from '../data/purchaseOrderData';
import KPICard from '../components/KPICard';
import KpiCarousel from '../components/KpiCarousel';
import SearchInput from '../components/SearchInput';
import SimplePagination from '../components/SimplePagination';
import EmptyState from '../components/EmptyState';
import SelectFilter from '../components/SelectFilter';
import IconButton from '../components/IconButton';
import ExportDropdown from '../components/ExportDropdown';


const COLUMNS = [
  'SN',
  'Item',
  'Unit',
  'Activity',
  'ProcurementRequestNo',
  'PurchaseOrderNumber',
  'TenderNumber',
  'RequestedQuantity',
  'POQuantity',
  'InvoicedQuantity',
  'Status'
];

const ROWS_PER_PAGE = 25;
const MAX_DISPLAY = 50; // show at most 50 records in the table (25 per page, 2 pages)

const exportHeaders: Record<string, string> = {
  Item: 'Item', Unit: 'Unit', Activity: 'Activity',
  ProcurementRequestNo: 'Procurement Request No', PurchaseOrderNumber: 'PO Number',
  TenderNumber: 'Tender Number', RequestedQuantity: 'Requested Qty',
  POQuantity: 'PO Qty', InvoicedQuantity: 'Invoiced Qty', Status: 'Status'
};

function StatusBadge({ status }: any) {
  if (!status || status.trim() === '') return null;

  const colorMap = {
    'Cleared': 'bg-success/10 text-success',
    'Declared': 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    'OnShipment': 'bg-warning/10 text-warning',
    'OnClearanceProcess': 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
    'WaitingDeclaration': 'bg-[#6366F1]/10 text-[#6366F1]',
    'Under Tender Evaluation': 'bg-warning/10 text-warning',
    'On Bid Document Preparation': 'bg-[#78716C]/10 text-[#78716C]',
    'POApprovedbyEFDA': 'bg-error/10 text-error',
    'AwaitingForeignCurrencyCashNotReserved': 'bg-error/10 text-error',
    'OnLCProcess': 'bg-warning/10 text-warning',
    'ContractSigned': 'bg-[#06B6D4]/10 text-[#06B6D4]',
    'LCOpenedorCADReserved': 'bg-warning/10 text-warning',
    'OnEFDA': 'bg-[#EC4899]/10 text-[#EC4899]',
  };

  const classes = colorMap[status] || 'bg-surface-container text-on-surface-variant';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${classes}`}>
      {status}
    </span>
  );
}

function PurchaseOrderFollowUp() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobilePageSize, setMobilePageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [activityFilter, setActivityFilter] = useState(null);

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
  const effectiveRowsPerPage = isMobile ? mobilePageSize : ROWS_PER_PAGE;

  useEffect(() => {
    const parsed = parseCSV(purchaseOrderCSVData);
    const processed = parsed.map(row => ({
      ...row,
      POQuantity: parseInt(row.POQuantity, 10) || 0,
      InvoicedQuantity: parseInt(row.InvoicedQuantity, 10) || 0,
      RequestedQuantity: parseInt((row.RequestedQuantity || '').replace(/,/g, ''), 10) || 0,
    }));
    setData(processed);
  }, []);

  // Reset page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, activityFilter]);
  useEffect(() => { setCurrentPage(1); }, [mobilePageSize]);

  // Get unique statuses for filter
  const statuses = useMemo(() => {
    const s = new Set();
    data.forEach(row => { if (row.Status && row.Status.trim()) s.add(row.Status.trim()); });
    return ['All', ...Array.from(s).sort()];
  }, [data]);

  // Get unique activities for filter
  const activities = useMemo(() => {
    const a = new Set();
    data.forEach(row => { if (row.Activity && row.Activity.trim()) a.add(row.Activity.trim()); });
    return ['All', ...Array.from(a).sort()];
  }, [data]);

  // Filtered data
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => v && v.toString().toLowerCase().includes(q))
      );
    }

    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(row => row.Status && row.Status.trim() === statusFilter);
    }

    if (activityFilter && activityFilter !== 'All') {
      result = result.filter(row => row.Activity && row.Activity.trim() === activityFilter);
    }

    return result;
  }, [data, searchQuery, statusFilter, activityFilter]);

  // Show only rows with PO data (PurchaseOrderNumber not empty)
  // Or show all rows in a unified view
  const showPreTender = true; // Show all rows including pre-tender

  const displayData = useMemo(() => {
    if (showPreTender) return filteredData;
    return filteredData.filter(row => row.PurchaseOrderNumber && row.PurchaseOrderNumber.trim() !== '');
  }, [filteredData, showPreTender]);

  // Limit the table to the first `MAX_DISPLAY` records, then paginate those.
  const limitedDisplay = useMemo(() => displayData.slice(0, MAX_DISPLAY), [displayData]);

  const totalPages = Math.ceil(limitedDisplay.length / effectiveRowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * effectiveRowsPerPage;
    return limitedDisplay.slice(start, start + effectiveRowsPerPage);
  }, [limitedDisplay, currentPage, effectiveRowsPerPage]);

  // Ensure current page is within range when totalPages changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages]);

  // Stats
  const stats = useMemo(() => {
    const withPO = data.filter(r => r.PurchaseOrderNumber && r.PurchaseOrderNumber.trim() !== '');
    const cleared = data.filter(r => r.Status === 'Cleared');
    const critical = data.filter(r => {
      const s = (r.Status || '').trim();
      return s === 'AwaitingForeignCurrencyCashNotReserved' || s === 'LCOpenedorCADReserved' || s === 'POApprovedbyEFDA';
    });
    const preTender = data.filter(r => !r.PurchaseOrderNumber || r.PurchaseOrderNumber.trim() === '');
    return {
      total: data.length,
      withPO: withPO.length,
      cleared: cleared.length,
      critical: critical.length,
      preTender: preTender.length,
    };
  }, [data]);

  const kpiCards = useMemo(() => [
    { icon: 'fa-database', iconBg: 'bg-surface-container', iconColor: 'text-primary', label: 'Total Records', value: stats.total.toLocaleString(), subtitle: 'all entries' },
    { icon: 'fa-file-lines', iconBg: 'bg-surface-container', iconColor: 'text-primary', label: 'With PO', value: stats.withPO.toLocaleString(), subtitle: 'has purchase order' },
    { icon: 'fa-circle-check', iconBg: 'bg-success/10', iconColor: 'text-success', label: 'Cleared', value: stats.cleared.toLocaleString(), valueColor: 'text-success', subtitle: 'fully processed' },
    { icon: 'fa-triangle-exclamation', iconBg: 'bg-error/10', iconColor: 'text-error', label: 'Stalled / At Risk', value: stats.critical.toLocaleString(), valueColor: 'text-error', subtitle: 'requires attention' },
  ], [stats]);

  const mainRef = useRef(null);
  useEffect(() => {
    setTimeout(() => {
      if (mainRef.current) mainRef.current.scrollTop = 0;
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
    }, 0);
  }, [currentPage]);

  const formatNum = (val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return val;
    return n.toLocaleString();
  };

  return (
    <div ref={mainRef}>
      {/* Stats cards */}
      {isMobile ? (
        <KpiCarousel>
          {kpiCards.map((card, i) => <KPICard key={i} variant="detailed" {...card} />)}
        </KpiCarousel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-md mb-lg">
          {kpiCards.map((card, i) => <KPICard key={i} variant="detailed" {...card} />)}
        </div>
      )}

      {/* Search and filter */}
      <div className="bg-surface-container-lowest border border-[#D1D5DB] rounded-lg p-4 mb-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-md">
          <div className="flex items-center gap-2 sm:hidden">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search Items, PO Number, Tender..." className="flex-1" />
            <IconButton variant="info" contentId="purchase-order-follow-up" />
            <ExportDropdown headers={exportHeaders} rows={filteredData} filename="purchase-order-follow-up" />
          </div>
          <div className="hidden sm:block flex-1">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search Items, PO Number, Tender..." />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <SelectFilter
              value={statusFilter || 'All'}
              onChange={(v) => setStatusFilter(v === 'All' ? null : v)}
              options={statuses.filter(s => s !== 'All')}
              allLabel="Status: All"
            />
            <SelectFilter
              value={activityFilter || 'All'}
              onChange={(v) => setActivityFilter(v === 'All' ? null : v)}
              options={activities.filter(a => a !== 'All')}
              allLabel="Activity: All"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <IconButton variant="info" contentId="purchase-order-follow-up" />
            <ExportDropdown headers={exportHeaders} rows={filteredData} filename="purchase-order-follow-up" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-[#D1D5DB] rounded-lg overflow-hidden mb-md">
        <div className={`${isMobile ? 'relative before:absolute before:top-0 before:right-0 before:bottom-0 before:w-8 before:bg-gradient-to-l before:from-surface-container-lowest before:to-transparent before:pointer-events-none before:z-10 after:absolute after:top-0 after:left-0 after:bottom-0 after:w-8 after:bg-gradient-to-r after:from-surface-container-lowest after:to-transparent after:pointer-events-none after:z-10 focus-within:ring-2 focus-within:ring-primary/20 rounded-lg' : ''}`}>
        <div className={`${isMobile ? 'overflow-x-auto scroll-smooth -webkit-overflow-scrolling:touch' : 'overflow-x-auto'}`}>
          <div className={isMobile ? 'min-w-[960px]' : ''}>
          <table className={isMobile ? '' : 'w-full'}>
            <thead className="bg-surface-container border-b border-[#D1D5DB]">
              <tr>
                <th className="py-3 px-4 text-center text-label-caps text-on-surface-variant uppercase w-12 border-r border-outline-variant">#</th>
                <th className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase sticky left-0 bg-surface-container z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Item</th>
                <th className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase">Activity</th>
                <th className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase">PO Number</th>
                <th className="px-4 py-3 text-right text-label-caps text-on-surface-variant uppercase">Req. Qty</th>
                <th className="px-4 py-3 text-right text-label-caps text-on-surface-variant uppercase">PO Qty</th>
                <th className="px-4 py-3 text-right text-label-caps text-on-surface-variant uppercase">Inv. Qty</th>
                <th className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <EmptyState colSpan={9} message="No purchase orders found" icon="fa-box-open" />
              ) : (
                paginatedData.map((row, i) => {
                  const hasPO = row.PurchaseOrderNumber && row.PurchaseOrderNumber.trim() !== '';
                  return (
                    <tr key={i} className="group border-b border-[#D1D5DB] hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-4 text-center border-r border-outline-variant/60 text-body-sm text-on-surface-variant">{(currentPage - 1) * effectiveRowsPerPage + i + 1}</td>
                      <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-surface-container-low z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="text-body-md font-semibold text-on-surface">{row.Item}</div>
                        {row.ProcurementRequestNo && (
                          <div className="text-body-sm text-on-surface-variant">PR: {row.ProcurementRequestNo}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-body-md text-on-surface">{row.Unit}</td>
                      <td className="px-4 py-2 text-body-sm text-on-surface whitespace-nowrap">{row.Activity}</td>
                      <td className="px-4 py-2">
                        {hasPO ? (
                          <span className="text-body-md font-medium text-primary">{row.PurchaseOrderNumber}</span>
                        ) : (
                          <span className="text-body-sm text-on-surface-variant italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-body-md text-on-surface whitespace-nowrap">{formatNum(row.RequestedQuantity)}</td>
                      <td className="px-4 py-2 text-right text-body-md text-on-surface whitespace-nowrap">{row.POQuantity > 0 ? formatNum(row.POQuantity) : '—'}</td>
                      <td className="px-4 py-2 text-right text-body-md text-on-surface whitespace-nowrap">{row.InvoicedQuantity > 0 ? formatNum(row.InvoicedQuantity) : '—'}</td>
                      <td className="px-4 py-2"><StatusBadge status={row.Status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      </div>

      {isMobile ? (
        <div className="flex items-center justify-between gap-3 py-2 px-lg bg-surface border-t border-outline-variant">
          <select value={mobilePageSize} onChange={(e) => { setMobilePageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="h-7 rounded border border-outline-variant bg-white px-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="p-2 rounded border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              className="p-2 rounded border border-outline-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={limitedDisplay.length}
          itemsPerPage={ROWS_PER_PAGE}
          onPageChange={(p) => setCurrentPage(p)}
          label="records"
        />
      )}
    </div>
  );
}

export default PurchaseOrderFollowUp;
