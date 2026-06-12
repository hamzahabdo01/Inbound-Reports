import { useState, useEffect, useMemo, useRef } from 'react';
import { parseCSV, parseDwellingTime, parseQuantity, parseDate } from '../utils/csvParser';
import { shipmentCSVData } from '../data/shipmentData';
import { exportDataToCSV } from '../utils/exportCSV';
import PurchaseOrderFollowUp from './PurchaseOrderFollowUp';

const ALL_COLUMNS = [
  'PurchaseOrderNumber',
  'Item',
  'Unit',
  'InvoiceNumber',
  'InvoiceOrder',
  'InvoicedQuantity',
  'WayBillNumber',
  'ShipmentOfficer',
  'PortArrivalDate',
  'DwellingTime'
];

function InboundReports({ sidebarVisible, toggleSidebar }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(13);
  const [activeTab, setActiveTab] = useState('shipment');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Top filter states
  const [officerFilter, setOfficerFilter] = useState(null);
  const [arrivalDateFilter, setArrivalDateFilter] = useState(null);
  const [dwellingTimeFilter, setDwellingTimeFilter] = useState(null);

  // Quick filter state
  const [quickFilter, setQuickFilter] = useState(null);

  // Load data
  useEffect(() => {
    setIsLoading(true);

    setTimeout(() => {
      const parsedData = parseCSV(shipmentCSVData);

      const processedData = parsedData.map(row => ({
        ...row,
        DwellingTime: parseDwellingTime(row.DwellingTime)
      }));

      setData(processedData);
      setIsLoading(false);
    }, 500);
  }, []);

  // Apply all filters to data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(value =>
          value && value.toString().toLowerCase().includes(query)
        )
      );
    }

    // Apply officer filter
    if (officerFilter) {
      result = result.filter(row =>
        row.ShipmentOfficer && row.ShipmentOfficer === officerFilter
      );
    }

    // Apply arrival date filter
    if (arrivalDateFilter) {
      result = result.filter(row =>
        row.PortArrivalDate && row.PortArrivalDate === arrivalDateFilter
      );
    }

    // Apply dwelling time filter
    if (dwellingTimeFilter) {
      result = result.filter(row => {
        const days = row.DwellingTime;
        switch(dwellingTimeFilter) {
          case '>90': return days > 90;
          case '60-90': return days >= 60 && days <= 90;
          case '30-60': return days >= 30 && days < 60;
          case '<30': return days < 30;
          default: return true;
        }
      });
    }

    // Apply quick filters
    if (quickFilter) {
      switch (quickFilter) {
        case 'critical':
          result = result.filter(row => row.DwellingTime > 90);
          break;
        case 'delayed-90':
          result = result.filter(row => row.DwellingTime > 90);
          break;
        case 'no-officer':
          result = result.filter(row => !row.ShipmentOfficer || row.ShipmentOfficer.trim() === '');
          break;
        case 'recently-arrived':
          result = result.filter(row => row.DwellingTime <= 30);
          break;
        default:
          break;
      }
    }

    return result;
  }, [data, searchQuery, officerFilter, arrivalDateFilter, dwellingTimeFilter, quickFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalActive = filteredData.length;
    const avgDwelling = totalActive > 0
      ? (filteredData.reduce((sum, row) => sum + row.DwellingTime, 0) / totalActive).toFixed(1)
      : 0;
    const maxDwelling = totalActive > 0
      ? Math.max(...filteredData.map(row => row.DwellingTime))
      : 0;
    const over90Days = filteredData.filter(row => row.DwellingTime > 90).length;

    return { totalActive, avgDwelling, maxDwelling, over90Days };
  }, [filteredData]);

  // Sorting state
  const [sortBy, setSortBy] = useState({ key: null, direction: null });
  const [openSortMenu, setOpenSortMenu] = useState(null);

  const toggleSort = (key) => {
    setSortBy((prev) => {
      if (prev.key !== key) {
        setCurrentPage(1);
        return { key, direction: 'asc' };
      }

      if (prev.direction === 'asc') {
        setCurrentPage(1);
        return { key, direction: 'desc' };
      }

      setCurrentPage(1);
      return { key: null, direction: null };
    });
  };

  const setSortDirection = (key, direction) => {
    setSortBy({ key, direction });
    setCurrentPage(1);
    setOpenSortMenu(null);
  };

  // Close menu on outside click or Escape
  useEffect(() => {
    const onDocClick = () => setOpenSortMenu(null);
    const onKey = (e) => { if (e.key === 'Escape') setOpenSortMenu(null); };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Sorted data derived from filteredData
  const sortedData = useMemo(() => {
    if (!sortBy.key || !sortBy.direction) return filteredData;

    const compare = (a, b) => {
      const key = sortBy.key;

      const getValue = (row) => {
        if (key === 'InvoicedQuantity') return parseQuantity(row.InvoicedQuantity);
        if (key === 'DwellingTime') return Number(row.DwellingTime) || 0;
        if (key === 'InvoiceOrder') return parseInt(row.InvoiceOrder, 10) || 0;
        if (key === 'PortArrivalDate') {
          const d = parseDate(row.PortArrivalDate);
          return d ? d.getTime() : 0;
        }
        const v = row[key];
        return v ? v.toString().toLowerCase() : '';
      };

      const va = getValue(a);
      const vb = getValue(b);

      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    };

    const sorted = [...filteredData].sort((a, b) => {
      const res = compare(a, b);
      return sortBy.direction === 'asc' ? res : -res;
    });

    return sorted;
  }, [filteredData, sortBy]);

  // Paginated data (after sorting)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const mainRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (mainRef.current && typeof mainRef.current.scrollTo === 'function') {
        try {
          mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } catch (e) {
          mainRef.current.scrollTop = 0;
        }
      }

      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }, 0);
  }, [currentPage]);

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleExport = () => {
    exportDataToCSV(data, ALL_COLUMNS);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setOfficerFilter(null);
    setArrivalDateFilter(null);
    setDwellingTimeFilter(null);
    setQuickFilter(null);
    setCurrentPage(1);
  };

  const handleQuickFilter = (filter) => {
    setQuickFilter(prev => prev === filter ? null : filter);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() || officerFilter || arrivalDateFilter || dwellingTimeFilter || quickFilter;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-header-sm text-on-surface-variant">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('shipment')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'shipment'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Shipment Dwelling Time
          </button>
          <button
            onClick={() => setActiveTab('purchase-order')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'purchase-order'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Purchase Order Follow Up
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            className="p-2 rounded border border-outline bg-surface-container-lowest hover:bg-surface-container transition-colors"
          >
            <i className={`fa-solid ${sidebarVisible ? 'fa-bars' : 'fa-columns'} text-on-surface`}></i>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border rounded text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {activeTab === 'purchase-order' && (
        <PurchaseOrderFollowUp />
      )}

      {activeTab === 'shipment' && (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-lg">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <i className="fa-solid fa-boxes-stacked text-lg text-on-surface-variant"></i>
            <div className="text-label-caps text-on-surface-variant uppercase text-[11px]">Active Shipments</div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-display-kpi text-on-surface font-extrabold">{kpis.totalActive}</div>
            <span className="flex items-center text-body-sm text-success">
              <i className="fa-solid fa-check text-xs mr-1"></i>
              2.4%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <i className="fa-solid fa-clock text-lg text-on-surface-variant"></i>
            <div className="text-label-caps text-on-surface-variant uppercase text-[11px]">Avg Dwelling</div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-display-kpi text-on-surface font-extrabold">{kpis.avgDwelling}</div>
            <span className="text-body-sm text-on-surface-variant">days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <i className="fa-solid fa-triangle-exclamation text-lg text-error"></i>
            <div className="text-label-caps text-on-surface-variant uppercase text-[11px]">Max Dwelling</div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-display-kpi text-error font-extrabold">{kpis.maxDwelling}</div>
            <span className="flex items-center text-body-sm text-error">
              <i className="fa-solid fa-check text-xs mr-1"></i>
              12%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <i className="fa-solid fa-circle-exclamation text-lg text-error"></i>
            <div className="text-label-caps text-on-surface-variant uppercase text-[11px]">&gt; 90 Days</div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-display-kpi text-error font-extrabold">{kpis.over90Days}</div>
            <span className="text-body-sm text-on-surface-variant">critical</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-container-lowest border border-[#D1D5DB] rounded-lg p-4 mb-md">
        <div className="flex items-center gap-3 mb-md">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search POs, Medicines, Suppliers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D1D5DB] rounded text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Officer Filter */}
          <select
            value={officerFilter || ''}
            onChange={(e) => setOfficerFilter(e.target.value || null)}
            className="px-4 py-2 border border-[#D1D5DB] rounded text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-surface-container-lowest"
          >
            <option value="">Officer: All</option>
            {[...new Set(data.map(row => row.ShipmentOfficer).filter(Boolean))].map(officer => (
              <option key={officer} value={officer}>{officer}</option>
            ))}
          </select>

          {/* Arrival Date Filter */}
          <select
            value={arrivalDateFilter || ''}
            onChange={(e) => setArrivalDateFilter(e.target.value || null)}
            className="px-4 py-2 border border-[#D1D5DB] rounded text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-surface-container-lowest"
          >
            <option value="">Arrival Date: Any</option>
            {[...new Set(data.map(row => row.PortArrivalDate).filter(Boolean))].map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>

          {/* Dwelling Time Filter */}
          <select
            value={dwellingTimeFilter || ''}
            onChange={(e) => setDwellingTimeFilter(e.target.value || null)}
            className="px-4 py-2 border border-[#D1D5DB] rounded text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-surface-container-lowest"
          >
            <option value="">Dwelling Time: Any</option>
            <option value=">90">&gt; 90 days</option>
            <option value="60-90">60-90 days</option>
            <option value="30-60">30-60 days</option>
            <option value="<30">&lt; 30 days</option>
          </select>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-body-md text-primary hover:text-primary/80 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-on-surface-variant">Quick Filters:</span>
          <button
            onClick={() => handleQuickFilter('critical')}
            className={`px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'critical'
                ? 'bg-error text-on-error'
                : 'bg-error/10 text-error hover:bg-error/20'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => handleQuickFilter('delayed-90')}
            className={`px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'delayed-90'
                ? 'bg-warning text-white'
                : 'bg-warning/10 text-warning hover:bg-warning/20'
            }`}
          >
            Delayed +90
          </button>
          <button
            onClick={() => handleQuickFilter('no-officer')}
            className={`px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'no-officer'
                ? 'bg-on-surface-variant text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            No Officer
          </button>
          <button
            onClick={() => handleQuickFilter('recently-arrived')}
            className={`px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'recently-arrived'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20'
            }`}
          >
            Recently Arrived
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-[#D1D5DB] rounded-lg overflow-hidden mb-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container border-b border-[#D1D5DB]">
              <tr>
                    <th className="w-8 px-4 py-3"></th>
                    <th
                      onClick={() => toggleSort('PurchaseOrderNumber')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">PO NUMBER {sortBy.key === 'PurchaseOrderNumber' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'PurchaseOrderNumber' ? null : 'PurchaseOrderNumber'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'PurchaseOrderNumber' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute left-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('PurchaseOrderNumber', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('PurchaseOrderNumber', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('Item')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">ITEM & DETAILS {sortBy.key === 'Item' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'Item' ? null : 'Item'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'Item' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('Item', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('Item', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('Unit')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">UNIT {sortBy.key === 'Unit' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'Unit' ? null : 'Unit'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'Unit' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('Unit', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('Unit', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('InvoiceNumber')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">INVOICE NUMBER {sortBy.key === 'InvoiceNumber' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'InvoiceNumber' ? null : 'InvoiceNumber'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'InvoiceNumber' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('InvoiceNumber', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('InvoiceNumber', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('InvoicedQuantity')}
                      className="px-4 py-3 text-right text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">INVOICED QUANTITY {sortBy.key === 'InvoicedQuantity' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'InvoicedQuantity' ? null : 'InvoicedQuantity'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'InvoicedQuantity' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('InvoicedQuantity', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('InvoicedQuantity', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('InvoiceOrder')}
                      className="px-4 py-3 text-center text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">INVOICE ORDER {sortBy.key === 'InvoiceOrder' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'InvoiceOrder' ? null : 'InvoiceOrder'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'InvoiceOrder' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('InvoiceOrder', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('InvoiceOrder', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('WayBillNumber')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">WAY BILL NUMBER {sortBy.key === 'WayBillNumber' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'WayBillNumber' ? null : 'WayBillNumber'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'WayBillNumber' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('WayBillNumber', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('WayBillNumber', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('ShipmentOfficer')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">SHIPMENT OFFICER {sortBy.key === 'ShipmentOfficer' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'ShipmentOfficer' ? null : 'ShipmentOfficer'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'ShipmentOfficer' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('ShipmentOfficer', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('ShipmentOfficer', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('PortArrivalDate')}
                      className="px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">PORT ARRIVAL DATE {sortBy.key === 'PortArrivalDate' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'PortArrivalDate' ? null : 'PortArrivalDate'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'PortArrivalDate' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('PortArrivalDate', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('PortArrivalDate', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort('DwellingTime')}
                      className="px-4 py-3 text-right text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1">DWELLING TIME {sortBy.key === 'DwellingTime' ? (sortBy.direction === 'asc' ? '▲' : '▼') : ''}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenSortMenu(openSortMenu === 'DwellingTime' ? null : 'DwellingTime'); }}
                          className="p-1 rounded hover:bg-surface-container transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Open sort menu"
                        >
                          ⋮
                        </button>
                      </div>
                      {openSortMenu === 'DwellingTime' && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-full mt-2 bg-white border rounded shadow-md w-44 z-50">
                          <button onClick={() => setSortDirection('DwellingTime', 'asc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▲ Sort by ASC</button>
                          <button onClick={() => setSortDirection('DwellingTime', 'desc')} className="w-full text-left px-3 py-2 hover:bg-surface-container">▼ Sort by DESC</button>
                        </div>
                      )}
                    </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-body-md text-on-surface-variant">
                    No shipments found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const dwellingDays = row.DwellingTime;
                  const isOver90 = dwellingDays > 90;

                  return (
                    <tr key={index} className="border-b border-[#D1D5DB] hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-2">
                        <div className={`w-2 h-2 rounded-full ${isOver90 ? 'bg-error' : 'bg-success'}`}></div>
                      </td>
                      <td className="px-4 py-2 text-body-md text-on-surface">{row.PurchaseOrderNumber}</td>
                      <td className="px-4 py-2">
                        <div className="text-body-md font-semibold text-on-surface">{row.Item}</div>
                        <div className="text-body-sm text-on-surface-variant">Quantity: {row.InvoicedQuantity}</div>
                      </td>
                      <td className="px-4 py-2 text-body-md text-on-surface">{row.Unit}</td>
                      <td className="px-4 py-2 text-body-md text-on-surface">{row.InvoiceNumber}</td>
                      <td className="px-4 py-2 text-right text-body-md text-on-surface whitespace-nowrap">{row.InvoicedQuantity}</td>
                      <td className="px-4 py-2 text-center text-body-md text-on-surface whitespace-nowrap">{row.InvoiceOrder}</td>
                      <td className="px-4 py-2 text-body-md text-on-surface">{row.WayBillNumber}</td>
                      <td className="px-4 py-2 text-body-md text-on-surface whitespace-nowrap">{row.ShipmentOfficer || '—'}</td>
                      <td className="px-4 py-2 text-body-md text-on-surface whitespace-nowrap">{row.PortArrivalDate}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded text-body-md font-bold ${
                          isOver90 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                        }`}>
                          {dwellingDays} days
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-body-sm text-on-surface-variant">
          Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)}-{Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} shipments
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      </>
      )}
    </>
  );
}

export default InboundReports;
