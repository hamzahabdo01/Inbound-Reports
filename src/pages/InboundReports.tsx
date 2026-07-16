import { useState, useEffect, useMemo } from 'react';
import { parseCSV, parseDwellingTime, parseQuantity, parseDate } from '../utils/csvParser';
import { shipmentCSVData } from '../data/shipmentData';
import PurchaseOrderFollowUp from './PurchaseOrderFollowUp';
import AutoScrollKPIRow from '../components/AutoScrollKPIRow';
import SearchInput from '../components/SearchInput';
import SimplePagination from '../components/SimplePagination';
import EmptyState from '../components/EmptyState';
import SelectFilter from '../components/SelectFilter';
import ExportDropdown from '../components/ExportDropdown';
import StickyHeader from '../components/StickyHeader';
import IconButton from '../components/IconButton';


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

function InboundReports() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(13);
  const [mobilePageSize, setMobilePageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('shipment');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Top filter states
  const [officerFilter, setOfficerFilter] = useState(null);
  const [arrivalDateFilter, setArrivalDateFilter] = useState(null);
  const [dwellingTimeFilter, setDwellingTimeFilter] = useState(null);

  // Quick filter state
  const [quickFilter, setQuickFilter] = useState(null);

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

  // Load data
  useEffect(() => {
    const parsedData = parseCSV(shipmentCSVData);
    const processedData = parsedData.map(row => ({
      ...row,
      DwellingTime: parseDwellingTime(row.DwellingTime)
    }));
    setData(processedData);
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

  const effectiveRowsPerPage = isMobile ? mobilePageSize : rowsPerPage;

  const kpiCards = useMemo(() => [
    { icon: 'fa-boxes-stacked', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', label: 'Active Shipments', value: kpis.totalActive, valueColor: 'text-emerald-600', subtitle: '2.4% increase' },
    { icon: 'fa-clock', label: 'Avg Dwelling', value: kpis.avgDwelling, subtitle: 'average days' },
    { icon: 'fa-triangle-exclamation', iconBg: 'bg-red-50', iconColor: 'text-red-500', label: 'Max Dwelling', value: kpis.maxDwelling, valueColor: 'text-red-600', subtitle: '12% increase' },
    { icon: 'fa-circle-exclamation', iconBg: 'bg-red-50', iconColor: 'text-red-500', label: '> 90 Days', value: kpis.over90Days, valueColor: 'text-red-600', subtitle: 'critical items' },
  ], [kpis]);

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
    const startIndex = (currentPage - 1) * effectiveRowsPerPage;
    const endIndex = startIndex + effectiveRowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, effectiveRowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / effectiveRowsPerPage);

  useEffect(() => {
    setTimeout(() => {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
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
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeTab]);

  // Reset page when mobile page size changes
  useEffect(() => { setCurrentPage(1); }, [mobilePageSize]);

  const exportHeaders = useMemo(() => ALL_COLUMNS.map(key => ({ key, label: key.replace(/([A-Z])/g, ' $1').trim() })), []);
  const exportRows = data;

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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <StickyHeader className="gap-md">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('shipment')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'shipment'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <i className="fa-solid fa-ship mr-2"></i>
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
            <i className="fa-solid fa-file-lines mr-2"></i>
            Purchase Order Follow Up
          </button>
        </div>
      </StickyHeader>

      {activeTab === 'purchase-order' && (
        <PurchaseOrderFollowUp />
      )}

      {activeTab === 'shipment' && (
      <>
      {/* KPI Cards */}
      <div className="relative mt-md mb-lg">
        <AutoScrollKPIRow cards={kpiCards} />
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-container-lowest border border-[#D1D5DB] rounded-lg p-4 mb-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-md">
          <div className="flex items-center gap-2 sm:hidden">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search POs, Medicines, Suppliers" className="flex-1" />
            <IconButton variant="info" contentId="shipment-dwelling-time" />
            <ExportDropdown headers={exportHeaders} rows={exportRows} filename="shipment-dwelling-time" />
          </div>
          <div className="hidden sm:block sm:w-72 lg:w-96">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search POs, Medicines, Suppliers" />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <div className="grid grid-cols-2 sm:contents gap-2 w-full sm:w-auto">
              <SelectFilter
                value={officerFilter || ''}
                onChange={setOfficerFilter}
                options={[...new Set(data.map(row => row.ShipmentOfficer).filter(Boolean))]}
                placeholder="Officer: All"
                className="w-full sm:w-auto"
              />

              <SelectFilter
                value={arrivalDateFilter || ''}
                onChange={setArrivalDateFilter}
                options={[...new Set(data.map(row => row.PortArrivalDate).filter(Boolean))]}
                placeholder="Arrival Date: Any"
                className="w-full sm:w-auto"
              />
            </div>

            <SelectFilter
              value={dwellingTimeFilter || ''}
              onChange={setDwellingTimeFilter}
              options={[
                { value: '>90', label: '> 90 days' },
                { value: '60-90', label: '60-90 days' },
                { value: '30-60', label: '30-60 days' },
                { value: '<30', label: '< 30 days' }
              ]}
              placeholder="Dwelling Time: Any"
              className="w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex items-center gap-2">
              <IconButton variant="info" contentId="shipment-dwelling-time" />
              <ExportDropdown headers={exportHeaders} rows={exportRows} filename="shipment-dwelling-time" />
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-body-md text-primary hover:text-primary/80 transition-colors shrink-0 whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scroll-smooth flex-nowrap sm:flex-wrap sm:overflow-visible [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          <span className="text-body-sm text-on-surface-variant shrink-0">Quick Filters:</span>
          <button
            onClick={() => handleQuickFilter('critical')}
            className={`shrink-0 px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'critical'
                ? 'bg-error text-on-error'
                : 'bg-error/10 text-error hover:bg-error/20'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => handleQuickFilter('delayed-90')}
            className={`shrink-0 px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'delayed-90'
                ? 'bg-warning text-white'
                : 'bg-warning/10 text-warning hover:bg-warning/20'
            }`}
          >
            Delayed +90
          </button>
          <button
            onClick={() => handleQuickFilter('no-officer')}
            className={`shrink-0 px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'no-officer'
                ? 'bg-on-surface-variant text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            No Officer
          </button>
          <button
            onClick={() => handleQuickFilter('recently-arrived')}
            className={`shrink-0 px-3 py-1 rounded-full text-body-sm transition-colors ${
              quickFilter === 'recently-arrived'
                ? 'bg-[#4A8EA5] text-white'
                : 'bg-[#4A8EA5]/10 text-[#4A8EA5] hover:bg-[#4A8EA5]/20'
            }`}
          >
            Recently Arrived
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-[#D1D5DB] rounded-lg overflow-hidden mb-md">
        <div className={`${isMobile ? 'relative before:absolute before:top-0 before:right-0 before:bottom-0 before:w-8 before:bg-gradient-to-l before:from-surface-container-lowest before:to-transparent before:pointer-events-none before:z-10 focus-within:ring-2 focus-within:ring-primary/20 rounded-lg' : ''}`}>
        <div className={`${isMobile ? 'overflow-x-auto scroll-smooth -webkit-overflow-scrolling:touch' : 'overflow-x-auto'}`}>
          <div className={isMobile ? 'min-w-[960px]' : ''}>
          <table className={isMobile ? '' : 'w-full'}>
            <thead className="bg-surface-container border-b border-[#D1D5DB]">
              <tr>
                    <th
                      onClick={() => toggleSort('PurchaseOrderNumber')}
                      className="py-3 px-4 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group border-r border-outline-variant"
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
                      className="pl-2 pr-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none relative group sticky left-0 bg-surface-container z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
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
                <EmptyState colSpan={11} message="No shipments found" icon="fa-box-open" />
              ) : (
                paginatedData.map((row, index) => {
                  const dwellingDays = row.DwellingTime;
                  const isOver90 = dwellingDays > 90;

                  return (
                    <tr key={index} className="group border-b border-[#D1D5DB] hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-4 border-r border-outline-variant/60 text-body-md text-on-surface">{row.PurchaseOrderNumber}</td>
                      <td className="pl-2 pr-4 py-2 sticky left-0 bg-white group-hover:bg-surface-container-low z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
          totalItems={filteredData.length}
          itemsPerPage={rowsPerPage}
          onPageChange={(p) => setCurrentPage(p)}
          label="shipments"
        />
      )}
      </>
      )}
    </div>
  );
}

export default InboundReports;
