import { useState, useMemo, Fragment } from 'react';
import stockData from '../data/NationalStockStatus.json';

// Status styling & logic helper
const getStockStatus = (mos) => {
  if (mos === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-700 border-red-200' };
  if (mos > 0 && mos < 3) return { label: 'Understocked', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (mos >= 3 && mos <= 6) return { label: 'Adequate', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { label: 'Overstocked', color: 'bg-blue-50 text-blue-700 border-blue-200' };
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString(undefined, { maximumFractionDigits: 1 });
};

function MiscellaneousStockReport({ sidebarVisible, toggleSidebar }) {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [venFilter, setVenFilter] = useState('All');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Row Expansion
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTabs, setActiveTabs] = useState({}); // { [itemSn]: 'pipeline' | 'hubs' | 'expiries' }

  // High-level statistics (always computed from full dataset)
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
      // 1. Search Query
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.item.toLowerCase().includes(query) || 
        (item.sn && item.sn.toString().includes(query));

      // 2. VEN Filter
      const matchesVen = venFilter === 'All' || item.ven === venFilter;

      // 3. Status Filter
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

  const handleRowClick = (sn) => {
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
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-md">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant md:hidden"
            aria-label="Toggle Sidebar"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
          <div>
            <h1 className="text-headline-lg text-primary-dark tracking-tight">Miscellaneous Stock Report</h1>
            <p className="text-body-sm text-on-surface-variant">
              National Stock Status and Pipeline Analysis Dashboard
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 border border-outline bg-white hover:bg-surface-low text-on-surface font-semibold text-body-sm rounded-lg shadow-sm"
        >
          <i className="fa-solid fa-file-excel text-emerald-600"></i>
          Export Excel Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-md">
        {/* Total Items */}
        <div className="bg-white p-lg rounded-xl shadow-level-1 border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-sm">
            <span className="text-label-caps uppercase text-xs">Total Items</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>
          <div className="text-display-kpi text-slate-900 leading-none">{formatNumber(stats.total)}</div>
          <p className="text-xs text-on-surface-variant mt-2">Monitored commodities</p>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-lg rounded-xl shadow-level-1 border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-red-500 mb-sm">
            <span className="text-label-caps uppercase text-xs text-on-surface-variant">Out of Stock</span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
          </div>
          <div className="text-display-kpi text-red-600 leading-none">{formatNumber(stats.outOfStock)}</div>
          <p className="text-xs text-red-500 font-semibold mt-2">MOS = 0 Months</p>
        </div>

        {/* Understocked */}
        <div className="bg-white p-lg rounded-xl shadow-level-1 border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-amber-500 mb-sm">
            <span className="text-label-caps uppercase text-xs text-on-surface-variant">Understocked</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="text-display-kpi text-amber-600 leading-none">{formatNumber(stats.understocked)}</div>
          <p className="text-xs text-amber-600 font-semibold mt-2">MOS &lt; 3 Months</p>
        </div>

        {/* Adequate */}
        <div className="bg-white p-lg rounded-xl shadow-level-1 border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-emerald-500 mb-sm">
            <span className="text-label-caps uppercase text-xs text-on-surface-variant">Adequate</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <i className="fa-solid fa-check-double"></i>
            </div>
          </div>
          <div className="text-display-kpi text-emerald-600 leading-none">{formatNumber(stats.adequate)}</div>
          <p className="text-xs text-emerald-600 font-semibold mt-2">MOS 3 - 6 Months</p>
        </div>

        {/* Overstocked */}
        <div className="bg-white p-lg rounded-xl shadow-level-1 border border-outline-variant hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-blue-500 mb-sm">
            <span className="text-label-caps uppercase text-xs text-on-surface-variant">Overstocked</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <i className="fa-solid fa-circle-arrow-up"></i>
            </div>
          </div>
          <div className="text-display-kpi text-blue-600 leading-none">{formatNumber(stats.overstocked)}</div>
          <p className="text-xs text-blue-600 font-semibold mt-2">MOS &gt; 6 Months</p>
        </div>
      </div>

      {/* Control panel (Filters and search) */}
      <div className="bg-white p-md rounded-xl border border-outline-variant shadow-level-1 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm"></i>
            <input
              type="text"
              placeholder="Search by SN or Item Description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-outline rounded-lg text-body-sm bg-white placeholder-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-md w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-body-sm font-semibold text-on-surface-variant">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-outline rounded-lg text-body-sm bg-white focus:border-primary"
              >
                <option value="All">All Statuses</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Understocked">Understocked</option>
                <option value="Adequate">Adequate</option>
                <option value="Overstocked">Overstocked</option>
              </select>
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
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-level-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12">SN</th>
                <th className="py-3.5 px-4 min-w-[200px]">Item Description</th>
                <th className="py-3.5 px-4 w-24">Unit</th>
                <th className="py-3.5 px-4 w-16 text-center">VEN</th>
                <th className="py-3.5 px-4 w-32 text-right">National SOH</th>
                <th className="py-3.5 px-4 w-32 text-right">Adjusted AMC</th>
                <th className="py-3.5 px-4 w-20 text-center">MOS</th>
                <th className="py-3.5 px-4 w-36 text-center">Stock Status</th>
                <th className="py-3.5 px-4 w-10"></th>
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
                        onClick={() => handleRowClick(item.sn)}
                        className={`cursor-pointer group hover:bg-surface-low/50 transition-colors ${
                          isExpanded ? 'bg-surface-low/30' : ''
                        }`}
                      >
                        <td className="py-4 px-4 font-mono text-xs text-on-surface-variant">{item.sn}</td>
                        <td className="py-4 px-4 font-semibold text-primary-dark group-hover:text-primary transition-colors text-body-sm">
                          {item.item}
                        </td>
                        <td className="py-4 px-4 text-xs text-on-surface-variant font-medium">{item.unit}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded ${
                            item.ven === 'V' ? 'bg-purple-100 text-purple-700' :
                            item.ven === 'E' ? 'bg-sky-100 text-sky-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.ven || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-body-sm font-semibold text-slate-800">
                          {formatNumber(item.national.soh)}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-body-sm text-on-surface-variant">
                          {formatNumber(item.national.adjusted_amc)}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-body-sm">
                          {formatNumber(item.national.mos)}
                        </td>
                        <td className="py-4 px-4 text-center">
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
                          <td colSpan="9" className="py-0 px-0 bg-surface-container-lowest border-y border-outline-variant">
                            <div className="p-lg space-y-md animate-slide-up">
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
                                  Pipeline Details
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
                                  Hub Inventory Distribution
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
                                  Expiry Batches
                                </button>
                              </div>

                              {/* Tab Content 1: Pipeline */}
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

                              {/* Tab Content 2: Hub Inventory */}
                              {activeTab === 'hubs' && (
                                <div className="space-y-4 pt-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Main Center stock */}
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

                                    {/* GIT stock */}
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

                                  {/* Hub Breakdown */}
                                  <div>
                                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-sm">Hub Distribution</h4>
                                    
                                    {/* Compute maximum SOH for scale */}
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

                              {/* Tab Content 3: Expiry Batches */}
                              {activeTab === 'expiries' && (
                                <div className="space-y-4 pt-2">
                                  {item.expiry_list && item.expiry_list.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
                                      {item.expiry_list.map((batch, index) => {
                                        // Parse batch year/month if needed, or color code based on arbitrary threshold
                                        let batchStyle = "border-emerald-200 bg-emerald-50 text-emerald-800";
                                        
                                        // If date contains 2024 or 2025 (assuming current year is 2026, let's treat these as expired or critical)
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
                <tr>
                  <td colSpan="9" className="py-12 text-center text-body-md text-on-surface-variant/70">
                    <i className="fa-solid fa-box-open text-xl mb-2 block"></i>
                    No items found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="py-4 px-lg bg-surface border-t border-outline-variant flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="inline-flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-outline rounded-lg text-body-sm font-semibold bg-white hover:bg-surface-low disabled:opacity-50 disabled:pointer-events-none"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-outline rounded-lg text-body-sm font-semibold bg-white hover:bg-surface-low disabled:opacity-50 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiscellaneousStockReport;
