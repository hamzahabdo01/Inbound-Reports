import { useState, useMemo, Fragment, useEffect, useRef } from 'react';
import stockData from '../data/NationalStockStatus.json';
import { parseCSV } from '../utils/csvParser';
import { nationalAMCCSVData } from '../data/nationalAMCData';
import KPICard from '../components/KPICard';
import SearchInput from '../components/SearchInput';
import SimplePagination from '../components/SimplePagination';
import EmptyState from '../components/EmptyState';
import SelectFilter from '../components/SelectFilter';
import ExportButton from '../components/ExportButton';
import StickyHeader from '../components/StickyHeader';
import InfoButton from '../components/InfoButton';


// Status styling & logic helper
const getStockStatus = (mos) => {
  if (mos === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-700 border-red-200' };
  if (mos > 0 && mos < 3) return { label: 'Understocked', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (mos >= 3 && mos <= 6) return { label: 'Adequate', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { label: 'Overstocked', color: 'bg-[#4A8EA5]/10 text-[#4A8EA5] border-[#4A8EA5]/20' };
};

const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return '0';
  const val = Number(num);
  if (isNaN(val)) return num;
  return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

// Hub names list for headers and keys mapping
const HUB_KEYS = [
  { key: 'center', label: 'Center SOH' },
  { key: 'git', label: 'GIT' },
  { key: 'adama', label: 'Adama' },
  { key: 'addis_ababa', label: 'Addis Ababa' },
  { key: 'addis_ababa_2', label: 'Addis Ababa 2' },
  { key: 'arba_minch', label: 'Arba Minch' },
  { key: 'assosa', label: 'Assosa' },
  { key: 'bahir_dar', label: 'Bahir Dar' },
  { key: 'dessie', label: 'Dessie' },
  { key: 'dire_dawa', label: 'Dire Dawa' },
  { key: 'gambella', label: 'Gambella' },
  { key: 'gondar', label: 'Gondar' },
  { key: 'hawassa', label: 'Hawassa' },
  { key: 'jigjiga', label: 'Jigjiga' },
  { key: 'jimma', label: 'Jimma' },
  { key: 'kebri_dehar', label: 'Kebri Dehar' },
  { key: 'mekele', label: 'Mekele' },
  { key: 'negele_borena', label: 'Negele Borena' },
  { key: 'nekemte', label: 'Nekemte' },
  { key: 'semera', label: 'Semera' },
  { key: 'shire', label: 'Shire' }
];

function MiscellaneousStockReport({ sidebarVisible, toggleSidebar }: any) {
  const [activeTab, setActiveTab] = useState('stock-report');

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeTab]);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [venFilter, setVenFilter] = useState('All');
  
  // Column Group Toggles to avoid cognitive overload
  const [showContract, setShowContract] = useState(false);
  const [showOrdered, setShowOrdered] = useState(false);
  const [showShipped, setShowShipped] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);
  const [showQtyLeft, setShowQtyLeft] = useState(false);
  const [showExpiries, setShowExpiries] = useState(false);
  const [showHubColumns, setShowHubColumns] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Row Expansion (for dashboard summary view)
  const [expandedRow, setExpandedRow] = useState(null);

  // Track the scroll container's visible width so the expanded row never stretches beyond the viewport
  const scrollRef = useRef(null);
  const [visibleWidth, setVisibleWidth] = useState(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setVisibleWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [activeTabs, setActiveTabs] = useState({}); // { [itemSn]: 'pipeline' | 'hubs' | 'expiries' }

  // National AMC tab state
  const [amcData, setAmcData] = useState([]);
  const [amcSearchQuery, setAmcSearchQuery] = useState('');
  const [amcPage, setAmcPage] = useState(1);
  const [amcEditing, setAmcEditing] = useState({}); // { rowIndex: true }
  const [amcDirtyValues, setAmcDirtyValues] = useState({}); // { rowIndex: 'newValue' }
  const amcRowsPerPage = 20;

  useEffect(() => {
    const parsed = parseCSV(nationalAMCCSVData);
    setAmcData(parsed.map(row => ({
      ...row,
      NationalAMC: row.NationalAMC || '0'
    })));
  }, []);

  const filteredAmcData = useMemo(() => {
    if (!amcSearchQuery.trim()) return amcData;
    const q = amcSearchQuery.toLowerCase();
    return amcData.filter(row =>
      (row.ItemSN && row.ItemSN.toLowerCase().includes(q)) ||
      (row.ItemName && row.ItemName.toLowerCase().includes(q)) ||
      (row.Unit && row.Unit.toLowerCase().includes(q))
    );
  }, [amcData, amcSearchQuery]);

  const paginatedAmcData = useMemo(() => {
    const start = (amcPage - 1) * amcRowsPerPage;
    return filteredAmcData.slice(start, start + amcRowsPerPage);
  }, [filteredAmcData, amcPage]);

  const amcTotalPages = Math.ceil(filteredAmcData.length / amcRowsPerPage);

  // High-level statistics
  const stats = useMemo(() => {
    let outOfStock = 0;
    let understocked = 0;
    let adequate = 0;
    let overstocked = 0;

    stockData.forEach(item => {
      const mos = item.national.mos;
      if (mos === 0) outOfStock++;
      else if (mos > 0 && mos < 3) understocked++;
      else if (mos >= 3 && mos <= 6) adequate++;
      else overstocked++;
    });

    return {
      total: stockData.length,
      outOfStock,
      understocked,
      adequate,
      overstocked
    };
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return stockData.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.item.toLowerCase().includes(query) || 
        (item.sn && item.sn.toString().includes(query));

      const matchesVen = venFilter === 'All' || item.ven === venFilter;

      let matchesStatus = true;
      if (statusFilter !== 'All') {
        const mos = item.national.mos;
        const statusObj = getStockStatus(mos);
        matchesStatus = statusObj.label === statusFilter;
      }

      return matchesSearch && matchesVen && matchesStatus;
    });
  }, [searchQuery, venFilter, statusFilter]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (sn, e) => {
    // Avoid expanding if user clicks on scrollable cells or input fields
    if (e.target.closest('.no-row-expand')) return;
    
    if (expandedRow === sn) {
      setExpandedRow(null);
    } else {
      setExpandedRow(sn);
      if (!activeTabs[sn]) {
        setActiveTabs(prev => ({ ...prev, [sn]: 'pipeline' }));
      }
    }
  };

  const setTab = (sn, tab) => {
    setActiveTabs(prev => ({ ...prev, [sn]: tab }));
  };

  // Dynamic Colspan counts for parent headers
  const getColspans = useMemo(() => {
    return {
      desc: 4,
      national: 6,
      contract: showContract ? 2 : 0,
      ordered: showOrdered ? 3 : 0,
      shipped: showShipped ? 3 : 0,
      delivered: showDelivered ? 3 : 0,
      qtyLeft: showQtyLeft ? 2 : 0,
      expiries: showExpiries ? 1 : 0,
      hubs: showHubColumns ? HUB_KEYS.length : 0
    };
  }, [showContract, showOrdered, showShipped, showDelivered, showQtyLeft, showExpiries, showHubColumns]);

  const totalVisibleCols = useMemo(() => {
    return Object.values(getColspans).reduce((sum, count) => sum + count, 0) + 2; // +2 for status badge & actions
  }, [getColspans]);

  const maxTotalCols = 4 + 6 + 2 + 3 + 3 + 3 + 2 + 1 + HUB_KEYS.length + 2; // all columns always counted

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'SN', 'Item Description', 'Unit', 'VEN',
      'National SOH', 'National DOS', 'National AMC', 'National Adjusted AMC', 'National MOS', 'National Adjusted MOS',
      'Contract Qty', 'Contract MOS',
      'Ordered PO', 'Ordered Qty', 'Ordered MOS',
      'Shipped PO', 'Shipped Qty', 'Shipped MOS',
      'Delivered PO', 'Delivered Qty', 'Delivered MOS',
      'Quantity Left', 'Quantity Left MOS',
      'Expiry Batches'
    ];

    const rows = filteredData.map(item => [
      item.sn,
      `"${item.item.replace(/"/g, '""')}"`,
      `"${item.unit}"`,
      item.ven,
      item.national.soh,
      item.national.dos,
      item.national.amc,
      item.national.adjusted_amc,
      item.national.mos,
      item.national.adjusted_mos,
      item.contract.quantity,
      item.contract.mos,
      `"${item.ordered.po}"`,
      item.ordered.quantity,
      item.ordered.mos,
      `"${item.shipped.po}"`,
      item.shipped.quantity,
      item.shipped.mos,
      `"${item.delivered.po}"`,
      item.delivered.quantity,
      item.delivered.mos,
      item.quantity_left.quantity,
      item.quantity_left.mos,
      `"${item.expiry_raw.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Miscellaneous_Stock_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-lg animate-fade-in">
      {/* Tab Navigation */}
      <StickyHeader className="gap-md border-b border-outline-variant">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant md:hidden"
            aria-label="Toggle Sidebar"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
          <button
            onClick={() => setActiveTab('stock-report')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'stock-report'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <i className="fa-solid fa-chart-simple mr-2"></i>
            Stock Report
          </button>
          <button
            onClick={() => setActiveTab('national-amc')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'national-amc'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <i className="fa-solid fa-calculator mr-2"></i>
            National AMC
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <InfoButton contentId={activeTab === 'stock-report' ? 'main-stock-report' : 'national-amc-report'} />
          <ExportButton onClick={handleExportCSV} label="Export Excel Data" icon="fa-file-excel" className="border-outline bg-white hover:bg-surface-low font-semibold text-body-sm shadow-sm" />
        </div>
      </StickyHeader>

      {activeTab === 'stock-report' && <>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-md">
        <KPICard variant="detailed" icon="fa-boxes-stacked" iconBg="bg-slate-50" iconColor="text-slate-500" label="Total Items" value={formatNumber(stats.total)} valueColor="text-slate-900" subtitle="Monitored commodities" />
        <KPICard variant="detailed" icon="fa-circle-exclamation" iconBg="bg-red-50" iconColor="text-red-500" label="Out of Stock" value={formatNumber(stats.outOfStock)} valueColor="text-red-600" subtitle="MOS = 0 Months" trendIcon="text-red-500 font-semibold" />
        <KPICard variant="detailed" icon="fa-triangle-exclamation" iconBg="bg-amber-50" iconColor="text-amber-500" label="Understocked" value={formatNumber(stats.understocked)} valueColor="text-amber-600" subtitle="MOS < 3 Months" trendIcon="text-amber-600 font-semibold" />
        <KPICard variant="detailed" icon="fa-check-double" iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Adequate" value={formatNumber(stats.adequate)} valueColor="text-emerald-600" subtitle="MOS 3 - 6 Months" trendIcon="text-emerald-600 font-semibold" />
        <KPICard variant="detailed" icon="fa-circle-arrow-up" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Overstocked" value={formatNumber(stats.overstocked)} valueColor="text-[#4A8EA5]" subtitle="MOS > 6 Months" trendIcon="text-[#4A8EA5] font-semibold" className="col-span-2 lg:col-span-1" />
      </div>

      {/* Control panel (Filters and search) */}
      <div className="bg-white p-md rounded-xl border border-outline-variant shadow-level-1 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="w-full lg:w-96">
            <SearchInput value={searchQuery} onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }} placeholder="Search by SN or Item Description..." />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-md w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-body-sm font-semibold text-on-surface-variant">Status:</label>
              <SelectFilter
                value={statusFilter || 'All'}
                onChange={(v) => { setStatusFilter(v || 'All'); setCurrentPage(1); }}
                options={[
                  { value: 'Out of Stock', label: 'Out of Stock' },
                  { value: 'Understocked', label: 'Understocked' },
                  { value: 'Adequate', label: 'Adequate' },
                  { value: 'Overstocked', label: 'Overstocked' }
                ]}
                allLabel="All Statuses"
                className="px-3 py-1.5"
              />
            </div>

            {/* VEN Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-semibold text-on-surface-variant">VEN:</span>
              <div className="inline-flex rounded-lg border border-outline p-0.5 bg-surface-low">
                {['All', 'V', 'E', 'N'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setVenFilter(type);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      venFilter === type
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filter Result Counter */}
            <div className="text-xs text-on-surface-variant font-medium ml-auto lg:ml-0">
              Showing {filteredData.length} of {stockData.length} items
            </div>
          </div>
        </div>

        {/* Column Group Selector - Hierarchical View Toggle */}
        <div className="border-t border-outline-variant/60 pt-3">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
            <span className="text-xs font-bold text-primary-dark uppercase tracking-wider">
              <i className="fa-solid fa-table-columns mr-1"></i> Column Visibility Selector:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button 
                onClick={() => setShowContract(!showContract)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showContract ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showContract ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Contract
              </button>
              <button 
                onClick={() => setShowOrdered(!showOrdered)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showOrdered ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showOrdered ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Ordered (Pipeline)
              </button>
              <button 
                onClick={() => setShowShipped(!showShipped)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showShipped ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showShipped ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Shipped
              </button>
              <button 
                onClick={() => setShowDelivered(!showDelivered)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showDelivered ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showDelivered ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Delivered
              </button>
              <button 
                onClick={() => setShowQtyLeft(!showQtyLeft)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showQtyLeft ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showQtyLeft ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Quantity Left
              </button>
              <button 
                onClick={() => setShowExpiries(!showExpiries)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showExpiries ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showExpiries ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Expiry Dates
              </button>
              <button 
                onClick={() => setShowHubColumns(!showHubColumns)}
                className={`px-3 py-1.5 border rounded-lg font-semibold flex items-center gap-1.5 ${showHubColumns ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-white border-outline text-on-surface-variant'}`}
              >
                <i className={`${showHubColumns ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}`}></i> Regional Hubs (21 Cols)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-level-1 overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse border border-outline-variant">
            <thead>
              {/* Grouped Headers (Row 1) */}
              <tr className="bg-surface border-b border-outline-variant text-[11px] font-bold text-primary-dark uppercase tracking-wider text-center">
                <th colSpan={4} className="py-2.5 px-4 border-r border-outline-variant sticky left-0 bg-surface z-10">Item Description</th>
                <th colSpan={6} className="py-2.5 px-4 border-r border-outline-variant bg-surface-low">National SOH & Consumption</th>
                {showContract && <th colSpan={2} className="py-2.5 px-4 border-r border-outline-variant bg-slate-50">Contract</th>}
                {showOrdered && <th colSpan={3} className="py-2.5 px-4 border-r border-outline-variant bg-sky-50/50">Ordered</th>}
                {showShipped && <th colSpan={3} className="py-2.5 px-4 border-r border-outline-variant bg-teal-50/50">Shipped</th>}
                {showDelivered && <th colSpan={3} className="py-2.5 px-4 border-r border-outline-variant bg-emerald-50/30">Delivered</th>}
                {showQtyLeft && <th colSpan={2} className="py-2.5 px-4 border-r border-outline-variant bg-indigo-50/40">Quantity Left</th>}
                {showExpiries && <th colSpan={1} className="py-2.5 px-4 border-r border-outline-variant bg-purple-50/40">Expiries</th>}
                {showHubColumns && <th colSpan={HUB_KEYS.length} className="py-2.5 px-4 border-r border-outline-variant bg-amber-50/30">Hub Stock Distribution</th>}
                <th colSpan={2} className="py-2.5 px-4 bg-surface">Summary</th>
              </tr>

              {/* Sub Columns (Row 2) */}
              <tr className="bg-surface border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                {/* Item Description Sub Headers */}
                <th className="py-3 px-4 border-r border-outline-variant w-12 sticky left-0 bg-surface z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">SN</th>
                <th className="py-3 px-4 border-r border-outline-variant min-w-[240px] sticky left-12 bg-surface z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Item</th>
                <th className="py-3 px-4 border-r border-outline-variant w-24 sticky left-[285px] bg-surface z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unit</th>
                <th className="py-3 px-4 border-r border-outline-variant w-16 text-center sticky left-[354px] bg-surface z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">VEN</th>
                
                {/* National Sub Headers */}
                <th className="py-3 px-4 border-r border-outline-variant w-24 text-right">SOH</th>
                <th className="py-3 px-4 border-r border-outline-variant w-20 text-center">DOS</th>
                <th className="py-3 px-4 border-r border-outline-variant w-24 text-right">AMC</th>
                <th className="py-3 px-4 border-r border-outline-variant w-24 text-right">Adj AMC</th>
                <th className="py-3 px-4 border-r border-outline-variant w-20 text-center">MOS</th>
                <th className="py-3 px-4 border-r border-outline-variant w-20 text-center">Adj MOS</th>

                {/* Contract Sub Headers */}
                {showContract && (
                  <>
                    <th className="py-3 px-4 border-r border-outline-variant w-28 text-right bg-slate-50/30">Quantity</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-20 text-center bg-slate-50/30">MOS</th>
                  </>
                )}

                {/* Ordered Sub Headers */}
                {showOrdered && (
                  <>
                    <th className="py-3 px-4 border-r border-outline-variant w-24 bg-sky-50/20">PO</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-28 text-right bg-sky-50/20">Quantity</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-20 text-center bg-sky-50/20">MOS</th>
                  </>
                )}

                {/* Shipped Sub Headers */}
                {showShipped && (
                  <>
                    <th className="py-3 px-4 border-r border-outline-variant w-24 bg-teal-50/20">PO</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-28 text-right bg-teal-50/20">Quantity</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-20 text-center bg-teal-50/20">MOS</th>
                  </>
                )}

                {/* Delivered Sub Headers */}
                {showDelivered && (
                  <>
                    <th className="py-3 px-4 border-r border-outline-variant w-24 bg-emerald-50/10">PO</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-28 text-right bg-emerald-50/10">Quantity</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-20 text-center bg-emerald-50/10">MOS</th>
                  </>
                )}

                {/* Quantity Left Sub Headers */}
                {showQtyLeft && (
                  <>
                    <th className="py-3 px-4 border-r border-outline-variant w-28 text-right bg-indigo-50/20">Quantity</th>
                    <th className="py-3 px-4 border-r border-outline-variant w-20 text-center bg-indigo-50/20">MOS</th>
                  </>
                )}

                {/* Expiries Sub Header */}
                {showExpiries && (
                  <th className="py-3 px-4 border-r border-outline-variant min-w-[280px] bg-purple-50/20">Expiry log</th>
                )}

                {/* Hub Sub Headers */}
                {showHubColumns && HUB_KEYS.map((hub) => (
                  <th key={hub.key} className="py-3 px-4 border-r border-outline-variant w-24 text-right bg-amber-50/20 font-medium">
                    {hub.label}
                  </th>
                ))}

                {/* Summary Badges Headers */}
                <th className="py-3 px-4 border-r border-outline-variant w-32 text-center">Stock Status</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  const isExpanded = expandedRow === item.sn;
                  const activeTab = activeTabs[item.sn] || 'pipeline';
                  const status = getStockStatus(item.national.mos);
                  
                  return (
                    <Fragment key={item.sn}>
                      {/* Master Row */}
                      <tr 
                        onClick={(e) => handleRowClick(item.sn, e)}
                        className={`cursor-pointer group hover:bg-surface-container-low transition-colors ${
                          isExpanded ? 'bg-surface-low/30' : ''
                        }`}
                      >
                        {/* Item Description Values */}
                        <td className="py-4 px-4 border-r border-outline-variant/60 font-mono text-xs text-on-surface-variant sticky left-0 bg-white group-hover:bg-surface-container-low z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {item.sn}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 font-semibold text-primary-dark group-hover:text-primary transition-colors text-body-sm sticky left-12 bg-white group-hover:bg-surface-container-low z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {item.item}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 font-semibold text-primary-dark group-hover:text-primary transition-colors text-body-sm sticky left-[285px] bg-white group-hover:bg-surface-container-low z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {item.unit}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 font-semibold text-primary-dark group-hover:text-primary transition-colors text-body-sm sticky left-[354px] bg-white group-hover:bg-surface-container-low z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded ${
                            item.ven === 'V' ? 'bg-purple-100 text-purple-700' :
                            item.ven === 'E' ? 'bg-sky-100 text-sky-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.ven || '—'}
                          </span>
                        </td>

                        {/* National Values */}
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-body-sm font-semibold text-slate-800">
                          {formatNumber(item.national.soh)}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs text-on-surface-variant">
                          {formatNumber(item.national.dos)}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs text-on-surface-variant">
                          {formatNumber(item.national.amc)}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs text-on-surface-variant">
                          {formatNumber(item.national.adjusted_amc)}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono font-bold text-body-sm">
                          {formatNumber(item.national.mos)}
                        </td>
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs text-on-surface-variant">
                          {formatNumber(item.national.adjusted_mos)}
                        </td>

                        {/* Contract Values */}
                        {showContract && (
                          <>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs bg-slate-50/20 text-slate-700">
                              {formatNumber(item.contract.quantity)}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs bg-slate-50/20 text-slate-600">
                              {formatNumber(item.contract.mos)}
                            </td>
                          </>
                        )}

                        {/* Ordered Values */}
                        {showOrdered && (
                          <>
                            <td className="py-4 px-4 border-r border-outline-variant/60 font-mono text-xs text-on-surface-variant bg-sky-50/10 max-w-[120px] truncate" title={item.ordered.po}>
                              {item.ordered.po || '—'}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs bg-sky-50/10 text-slate-700">
                              {formatNumber(item.ordered.quantity)}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs bg-sky-50/10 text-slate-600">
                              {formatNumber(item.ordered.mos)}
                            </td>
                          </>
                        )}

                        {/* Shipped Values */}
                        {showShipped && (
                          <>
                            <td className="py-4 px-4 border-r border-outline-variant/60 font-mono text-xs text-on-surface-variant bg-teal-50/10 max-w-[120px] truncate" title={item.shipped.po}>
                              {item.shipped.po || '—'}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs bg-teal-50/10 text-slate-700">
                              {formatNumber(item.shipped.quantity)}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs bg-teal-50/10 text-slate-600">
                              {formatNumber(item.shipped.mos)}
                            </td>
                          </>
                        )}

                        {/* Delivered Values */}
                        {showDelivered && (
                          <>
                            <td className="py-4 px-4 border-r border-outline-variant/60 font-mono text-xs text-on-surface-variant bg-emerald-50/5 max-w-[120px] truncate" title={item.delivered.po}>
                              {item.delivered.po || '—'}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs bg-emerald-50/5 text-slate-700">
                              {formatNumber(item.delivered.quantity)}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs bg-emerald-50/5 text-slate-600">
                              {formatNumber(item.delivered.mos)}
                            </td>
                          </>
                        )}

                        {/* Quantity Left Values */}
                        {showQtyLeft && (
                          <>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs bg-indigo-50/10 text-slate-700">
                              {formatNumber(item.quantity_left.quantity)}
                            </td>
                            <td className="py-4 px-4 border-r border-outline-variant/60 text-center font-mono text-xs bg-indigo-50/10 text-slate-600">
                              {formatNumber(item.quantity_left.mos)}
                            </td>
                          </>
                        )}

                        {/* Expiries Value */}
                        {showExpiries && (
                          <td className="py-4 px-4 border-r border-outline-variant/60 text-xs text-on-surface-variant bg-purple-50/10" title={item.expiry_raw}>
                            {item.expiry_raw || '—'}
                          </td>
                        )}

                        {/* Hub Distribution SOH values */}
                        {showHubColumns && HUB_KEYS.map((hub) => (
                          <td key={hub.key} className="py-4 px-4 border-r border-outline-variant/60 text-right font-mono text-xs bg-amber-50/10 text-slate-700">
                            {formatNumber(item.hubs[hub.key])}
                          </td>
                        ))}

                        {/* Summary Badges & Collapse chevron */}
                        <td className="py-4 px-4 border-r border-outline-variant/60 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-on-surface-variant">
                          <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-primary' : ''
                          }`}></i>
                        </td>
                      </tr>

                      {/* Detail Accordion Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={maxTotalCols} className="py-0 px-0 bg-surface-container-lowest border-y border-outline-variant no-row-expand">
                            <div
                              className="p-lg space-y-md animate-slide-up"
                              style={visibleWidth ? { position: 'sticky', left: 0, width: visibleWidth, overflow: 'hidden' } : {}}
                            >
                              {/* Detail Tabs */}
                              <div className="flex border-b border-outline-variant">
                                <button
                                  onClick={() => setTab(item.sn, 'pipeline')}
                                  className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 -mb-[2px] ${
                                    activeTab === 'pipeline'
                                      ? 'border-primary text-primary'
                                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                                  }`}
                                >
                                  <i className="fa-solid fa-route mr-2"></i>
                                  Pipeline Summary Card View
                                </button>
                                <button
                                  onClick={() => setTab(item.sn, 'hubs')}
                                  className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 -mb-[2px] ${
                                    activeTab === 'hubs'
                                      ? 'border-primary text-primary'
                                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                                  }`}
                                >
                                  <i className="fa-solid fa-hospital-user mr-2"></i>
                                  Hub Inventory Distribution Chart
                                </button>
                                <button
                                  onClick={() => setTab(item.sn, 'expiries')}
                                  className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 -mb-[2px] ${
                                    activeTab === 'expiries'
                                      ? 'border-primary text-primary'
                                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                                  }`}
                                >
                                  <i className="fa-solid fa-hourglass-half mr-2"></i>
                                  Expiry Batches Timeline
                                </button>
                              </div>

                              {/* Tab Content 1: Pipeline Summary */}
                              {activeTab === 'pipeline' && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-md pt-2">
                                  {/* Contract */}
                                  <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/60">
                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-xs">1. Contracted</div>
                                    <div className="text-body-md font-extrabold text-slate-800 font-mono">
                                      {formatNumber(item.contract.quantity)}
                                    </div>
                                    <div className="text-xs text-on-surface-variant font-medium mt-1">
                                      {formatNumber(item.contract.mos)} MOS
                                    </div>
                                  </div>

                                  {/* Ordered */}
                                  <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/60">
                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-xs">2. Ordered</div>
                                    <div className="text-body-md font-extrabold text-slate-800 font-mono">
                                      {formatNumber(item.ordered.quantity)}
                                    </div>
                                    <div className="text-xs text-on-surface-variant font-medium mt-1">
                                      {formatNumber(item.ordered.mos)} MOS
                                    </div>
                                    {item.ordered.po && (
                                      <div className="text-[10px] bg-white border border-outline-variant px-1.5 py-0.5 rounded text-on-surface-variant font-mono mt-2 truncate" title={item.ordered.po}>
                                        PO: {item.ordered.po}
                                      </div>
                                    )}
                                  </div>

                                  {/* Shipped */}
                                  <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/60">
                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-xs">3. Shipped</div>
                                    <div className="text-body-md font-extrabold text-slate-800 font-mono">
                                      {formatNumber(item.shipped.quantity)}
                                    </div>
                                    <div className="text-xs text-on-surface-variant font-medium mt-1">
                                      {formatNumber(item.shipped.mos)} MOS
                                    </div>
                                    {item.shipped.po && (
                                      <div className="text-[10px] bg-white border border-outline-variant px-1.5 py-0.5 rounded text-on-surface-variant font-mono mt-2 truncate" title={item.shipped.po}>
                                        PO: {item.shipped.po}
                                      </div>
                                    )}
                                  </div>

                                  {/* Delivered */}
                                  <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/60">
                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-xs">4. Delivered</div>
                                    <div className="text-body-md font-extrabold text-slate-800 font-mono">
                                      {formatNumber(item.delivered.quantity)}
                                    </div>
                                    <div className="text-xs text-on-surface-variant font-medium mt-1">
                                      {formatNumber(item.delivered.mos)} MOS
                                    </div>
                                    {item.delivered.po && (
                                      <div className="text-[10px] bg-white border border-outline-variant px-1.5 py-0.5 rounded text-on-surface-variant font-mono mt-2 truncate" title={item.delivered.po}>
                                        PO: {item.delivered.po}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quantity Left */}
                                  <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/60">
                                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-xs">5. Remaining Left</div>
                                    <div className="text-body-md font-extrabold text-slate-800 font-mono">
                                      {formatNumber(item.quantity_left.quantity)}
                                    </div>
                                    <div className="text-xs text-on-surface-variant font-medium mt-1">
                                      {formatNumber(item.quantity_left.mos)} MOS
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Tab Content 2: Hub Inventory Breakdown */}
                              {activeTab === 'hubs' && (
                                <div className="space-y-4 pt-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Central Stock */}
                                    <div className="bg-slate-50 p-lg rounded-lg border border-outline-variant flex justify-between items-center">
                                      <div>
                                        <div className="text-xs font-bold text-on-surface-variant uppercase">Central Warehouse (SOH)</div>
                                        <div className="text-headline-md font-extrabold font-mono text-primary-dark mt-1">
                                          {formatNumber(item.hubs.center)}
                                        </div>
                                      </div>
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                                        <i className="fa-solid fa-warehouse"></i>
                                      </div>
                                    </div>

                                    {/* GIT */}
                                    <div className="bg-slate-50 p-lg rounded-lg border border-outline-variant flex justify-between items-center">
                                      <div>
                                        <div className="text-xs font-bold text-on-surface-variant uppercase">In Transit (GIT - Center to Hub)</div>
                                        <div className="text-headline-md font-extrabold font-mono text-sky-700 mt-1">
                                          {formatNumber(item.hubs.git)}
                                        </div>
                                      </div>
                                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-lg">
                                        <i className="fa-solid fa-truck-ramp-box"></i>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Hub distribution list */}
                                  <div>
                                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-sm">Hub Distribution</h4>
                                    
                                    {(() => {
                                      const hubList = Object.entries(item.hubs)
                                        .filter(([key]) => key !== 'center' && key !== 'git')
                                        .map(([key, val]) => ({
                                          name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                                          value: val
                                        }))
                                        .filter(h => h.value > 0)
                                        .sort((a, b) => b.value - a.value);

                                      if (hubList.length === 0) {
                                        return (
                                          <div className="text-center py-6 text-xs text-on-surface-variant/70 border border-dashed border-outline-variant rounded-lg">
                                            No SOH recorded across any regional hubs.
                                          </div>
                                        );
                                      }

                                      const maxVal = Math.max(...hubList.map(h => h.value), 1);

                                      return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-lg gap-y-sm">
                                          {hubList.map((h, i) => {
                                            const pct = (h.value / maxVal) * 100;
                                            return (
                                              <div key={i} className="flex items-center gap-4 text-xs">
                                                <div className="w-28 font-bold text-on-surface-variant truncate" title={h.name}>
                                                  {h.name}
                                                </div>
                                                <div className="flex-1 h-5 bg-surface-low rounded overflow-hidden relative border border-outline-variant/30">
                                                  <div 
                                                    className="h-full bg-primary/20 hover:bg-primary/30 border-r-2 border-primary transition-all"
                                                    style={{ width: `${pct}%` }}
                                                  ></div>
                                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono font-bold text-[10px] text-slate-800">
                                                    {formatNumber(h.value)}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* Tab Content 3: Expiries */}
                              {activeTab === 'expiries' && (
                                <div className="space-y-4 pt-2">
                                  {item.expiry_list && item.expiry_list.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
                                      {item.expiry_list.map((batch, index) => {
                                        let batchStyle = "border-emerald-200 bg-emerald-50 text-emerald-800";
                                        
                                        if (batch.date) {
                                          const isExpired = batch.date.includes('2024') || batch.date.includes('2025');
                                          const isNear = batch.date.includes('2026');
                                          if (isExpired) {
                                            batchStyle = "border-red-200 bg-red-50/70 text-red-800";
                                          } else if (isNear) {
                                            batchStyle = "border-amber-200 bg-amber-50 text-amber-800";
                                          }
                                        }

                                        return (
                                          <div key={index} className={`p-md rounded-lg border flex flex-col justify-between ${batchStyle}`}>
                                            <div>
                                              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Batch Expiry</div>
                                              <div className="text-header-sm font-extrabold mt-1">{batch.date || 'Unknown Date'}</div>
                                            </div>
                                            <div className="mt-4 flex justify-between items-baseline">
                                              <span className="text-[10px] opacity-80">Quantity:</span>
                                              <span className="font-mono font-extrabold text-body-md">{formatNumber(batch.quantity)}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-xs text-on-surface-variant/70 border border-dashed border-outline-variant rounded-lg">
                                      <i className="fa-regular fa-calendar-xmark text-lg mb-2 block"></i>
                                      No specific expiry dates/batches logged in dataset.
                                      {item.expiry_raw && (
                                        <div className="mt-2 text-[11px] font-mono bg-surface p-2 rounded max-w-lg mx-auto text-left">
                                          Raw Log: {item.expiry_raw}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <EmptyState colSpan={totalVisibleCols} message="No items found matching the selected filters." icon="fa-box-open" />
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          label="items"
        />
      </div>
      </>}

      {activeTab === 'national-amc' && <>
      <div className="space-y-lg animate-fade-in">
        {/* AMC Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h2 className="text-headline-md text-primary-dark tracking-tight">National AMC Update</h2>
            <p className="text-body-sm text-on-surface-variant">
              {filteredAmcData.length} items · Editable monthly consumption figures
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-96">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm"></i>
              <input
                type="text"
                placeholder="Search by SN or Item Name..."
                value={amcSearchQuery}
                onChange={(e) => { setAmcSearchQuery(e.target.value); setAmcPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-outline rounded-lg text-body-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
              Page {amcPage} of {amcTotalPages || 1}
            </div>
          </div>
        </div>

        {/* AMC Table */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-level-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-4 py-3 w-16 text-center">#</th>
                  <th className="px-4 py-3 w-20 text-center">SN</th>
                  <th className="px-4 py-3 min-w-[300px]">Item Name</th>
                  <th className="px-4 py-3 w-24">Unit</th>
                  <th className="px-4 py-3 w-40 text-right">National AMC</th>
                  <th className="px-4 py-3 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {paginatedAmcData.length > 0 ? (
                  paginatedAmcData.map((row, idx) => {
                    const globalIdx = (amcPage - 1) * amcRowsPerPage + idx;
                    const isEditing = amcEditing[globalIdx] === true;
                    return (
                      <tr key={globalIdx} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3 text-center text-xs text-on-surface-variant font-mono">
                          {row.RowNumber}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-on-surface-variant">
                          {row.ItemSN}
                        </td>
                        <td className="px-4 py-3 text-body-sm font-semibold text-primary-dark">
                          {row.ItemName}
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                          {row.Unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="text"
                              value={amcDirtyValues[globalIdx] !== undefined ? amcDirtyValues[globalIdx] : row.NationalAMC}
                              onChange={(e) => setAmcDirtyValues(prev => ({ ...prev, [globalIdx]: e.target.value }))}
                              className="w-32 text-right px-3 py-1.5 border border-primary rounded-lg text-body-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newVal = amcDirtyValues[globalIdx] !== undefined ? amcDirtyValues[globalIdx] : row.NationalAMC;
                                  setAmcData(prev => {
                                    const next = [...prev];
                                    next[globalIdx] = { ...next[globalIdx], NationalAMC: newVal };
                                    return next;
                                  });
                                  setAmcEditing(prev => ({ ...prev, [globalIdx]: false }));
                                  setAmcDirtyValues(prev => ({ ...prev, [globalIdx]: undefined }));
                                }
                                if (e.key === 'Escape') {
                                  setAmcEditing(prev => ({ ...prev, [globalIdx]: false }));
                                  setAmcDirtyValues(prev => ({ ...prev, [globalIdx]: undefined }));
                                }
                              }}
                            />
                          ) : (
                            <span className="font-mono font-semibold text-body-sm text-on-surface">
                              {formatNumber(row.NationalAMC)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => {
                                  const newVal = amcDirtyValues[globalIdx] !== undefined ? amcDirtyValues[globalIdx] : row.NationalAMC;
                                  setAmcData(prev => {
                                    const next = [...prev];
                                    next[globalIdx] = { ...next[globalIdx], NationalAMC: newVal };
                                    return next;
                                  });
                                  setAmcEditing(prev => ({ ...prev, [globalIdx]: false }));
                                  setAmcDirtyValues(prev => ({ ...prev, [globalIdx]: undefined }));
                                }}
                                className="p-1.5 text-success hover:bg-success/10 rounded transition-colors"
                                title="Save"
                              >
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setAmcEditing(prev => ({ ...prev, [globalIdx]: false }));
                                  setAmcDirtyValues(prev => ({ ...prev, [globalIdx]: undefined }));
                                }}
                                className="p-1.5 text-on-surface-variant hover:bg-surface-low rounded transition-colors"
                                title="Cancel"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAmcEditing(prev => ({ ...prev, [globalIdx]: true }));
                                setAmcDirtyValues(prev => ({ ...prev, [globalIdx]: row.NationalAMC }));
                              }}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Edit"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyState colSpan={6} message="No items found matching the search query." icon="fa-box-open" />
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <SimplePagination
            currentPage={amcPage}
            totalPages={amcTotalPages}
            totalItems={filteredAmcData.length}
            itemsPerPage={amcRowsPerPage}
            onPageChange={(p) => setAmcPage(p)}
            label="items"
          />
        </div>
      </div>
      </>}
    </div>
  );
}

export default MiscellaneousStockReport;
