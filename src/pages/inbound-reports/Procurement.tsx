import { useState, useEffect, useMemo } from 'react';
import { parseCSV } from '../../utils/csvParser';
import tenderProcessCSV from '../../data/procurement/tenderProcess.csv?raw';
import contractProcessForSeaCSV from '../../data/procurement/contractProcessforSea.csv?raw';
import contractProcessForAirCSV from '../../data/procurement/contractProcessforAir.csv?raw';
import PieChart from '../../components/PieChart';
import SearchInput from '../../components/SearchInput';
import SimplePagination from '../../components/SimplePagination';
import EmptyState from '../../components/EmptyState';
import SelectFilter from '../../components/SelectFilter';
import KPICard from '../../components/KPICard';
import KpiCarousel from '../../components/KpiCarousel';
import StickyHeader from '../../components/StickyHeader';
import IconButton from '../../components/IconButton';
import LandscapeToggle from '../../components/LandscapeToggle';


const TENDER_STAGES = [
  { id: 1, name: 'Preparation & Budget Analysis' },
  { id: 2, name: 'Bidding Document Preparation' },
  { id: 3, name: 'Announcement of Bid Floatation' },
  { id: 4, name: 'Tender Floatation' },
  { id: 5, name: 'Tender Evaluation' },
  { id: 6, name: 'Announcement of Winner' },
  { id: 7, name: 'PO Preparation' },
  { id: 8, name: 'Contract Signed By DG' },
  { id: 9, name: 'Completed' },
];

const CONTRACT_SEA_STAGES = [
  { id: 1, name: 'Receiving And Updation On CMS', hoverValue: 433 },
  { id: 2, name: 'Performance Bond Receiving And Verifying', hoverValue: 433 },
  { id: 3, name: 'LC Opening Process', hoverValue: 635 },
  { id: 4, name: 'Shipment Follow Up', hoverValue: 565 },
  { id: 5, name: 'Original Document Release Follow Up', hoverValue: 335 },
  { id: 6, name: 'ESLE And Customs Payment', hoverValue: 577 },
  { id: 7, name: 'EFDA Inspection Request AND Follow Up', hoverValue: 246 },
  { id: 8, name: 'Follow Up of Custom Release', hoverValue: null },
  { id: 9, name: 'Completed', hoverValue: null },
];

const CONTRACT_AIR_STAGES = [
  { id: 1, name: 'Receiving And Updation On CMS', hoverValue: 433 },
  { id: 2, name: 'Performance Bond Receiving And Verifying', hoverValue: 433 },
  { id: 3, name: 'LC Opening Process', hoverValue: 635 },
  { id: 4, name: 'Shipment Follow Up', hoverValue: 565 },
  { id: 5, name: 'EFDA Inspection Request AND Follow Up', hoverValue: 335 },
  { id: 6, name: 'Customs and Storage Payment', hoverValue: null },
  { id: 7, name: 'Follow Up of Custom Release', hoverValue: null },
  { id: 8, name: 'Completed', hoverValue: null },
];

function Procurement() {
  const [activeTab, setActiveTab] = useState('tender'); // 'tender' | 'contract'
  const [tenderData, setTenderData] = useState([]);
  const [contractData, setContractData] = useState([]);
  const [selectedTenderRow, setSelectedTenderRow] = useState(null);
  const [selectedContractRow, setSelectedContractRow] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState('Sea'); // 'Sea' | 'Air'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Visualization modes
  const [visMode, setVisMode] = useState('pipeline'); // 'pipeline' | 'chart' | 'trend'
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);
  const [trendTooltip, setTrendTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Responsive state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [tableLandscape, setTableLandscape] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Load and parse data
  useEffect(() => {
    // Parse Tender
    const parsedTender = parseCSV(tenderProcessCSV);
    const cleanedTender = parsedTender.filter(row => row['Tender No'] && row['Tender No'] !== 'Total');
    setTenderData(cleanedTender);
    if (cleanedTender.length > 0) {
      setSelectedTenderRow(cleanedTender[0]);
    }

    // Parse Contract Sea
    const parsedContractSea = parseCSV(contractProcessForSeaCSV);
    const cleanedContractSea = parsedContractSea
      .filter(row => row['PO No'] && row['PO No'] !== 'Total')
      .map(row => ({ ...row, _datasetType: 'Sea' }));

    // Parse Contract Air
    const parsedContractAir = parseCSV(contractProcessForAirCSV);
    const cleanedContractAir = parsedContractAir
      .filter(row => row['PO No'] && row['PO No'] !== 'Total')
      .map(row => ({ ...row, _datasetType: 'Air' }));

    const combinedContract = [...cleanedContractSea, ...cleanedContractAir];
    setContractData(combinedContract);
    if (combinedContract.length > 0) {
      setSelectedContractRow(combinedContract[0]);
    }
  }, []);

  // Reset filters and selection when switching tabs
  useEffect(() => {
    setSearchQuery('');
    setResponsibleFilter('');
    setContractTypeFilter('Sea');
    setCurrentPage(1);
    setSortConfig({ key: null, direction: 'asc' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeTab]);

  // Determine active stage of a row
  const getActiveStage = (row) => {
    for (let i = 8; i >= 1; i--) {
      const val = row[i.toString()];
      if (val && val.trim() !== '') {
        return i;
      }
    }
    return 1;
  };

  const currentStages = activeTab === 'tender' 
    ? TENDER_STAGES 
    : (contractTypeFilter === 'Air' ? CONTRACT_AIR_STAGES : CONTRACT_SEA_STAGES);
  const currentData = activeTab === 'tender' ? tenderData : contractData;
  const selectedRow = activeTab === 'tender' ? selectedTenderRow : selectedContractRow;
  const setSelectedRow = activeTab === 'tender' ? setSelectedTenderRow : setSelectedContractRow;

  const hideStages = isMobile && !tableLandscape;
  const stageKeys = ['1', '2', '3', '4', '5', '6', '7', '8'];



  // Unique responsible officers for filter dropdown (tender only)
  const responsibles = useMemo(() => {
    const set = new Set();
    tenderData.forEach(row => {
      if (row.Responsible) set.add(row.Responsible.trim());
    });
    return Array.from(set).sort();
  }, [tenderData]);

  // Filter and Sort Data
  const filteredData = useMemo(() => {
    let result = [...currentData];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (activeTab === 'tender') {
        result = result.filter(row =>
          (row['Tender No'] && row['Tender No'].toLowerCase().includes(query)) ||
          (row.Responsible && row.Responsible.toLowerCase().includes(query))
        );
      } else {
        result = result.filter(row =>
          (row['PO No'] && row['PO No'].toLowerCase().includes(query)) ||
          (row['Tender No'] && row['Tender No'].toLowerCase().includes(query)) ||
          (row['Invoice No'] && row['Invoice No'].toLowerCase().includes(query))
        );
      }
    }

    // Tender specific filters
    if (activeTab === 'tender' && responsibleFilter) {
      result = result.filter(row => row.Responsible === responsibleFilter);
    }

    // Contract specific filters (Sea / Air)
    if (activeTab === 'contract' && contractTypeFilter !== 'All') {
      result = result.filter(row => row._datasetType === contractTypeFilter);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Parse numbers if applicable
        if (['1', '2', '3', '4', '5', '6', '7', '8', 'Days Consumed', 'Days Remaining', 'Days Saved'].includes(sortConfig.key)) {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [currentData, searchQuery, responsibleFilter, contractTypeFilter, sortConfig, activeTab]);

  // Calculate active counts per stage
  const stageCounts = useMemo(() => {
    const counts = Array(10).fill(0);
    filteredData.forEach(row => {
      const activeStage = getActiveStage(row);
      counts[activeStage]++;
    });
    return counts;
  }, [filteredData]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatBadge = (val) => {
    if (!val || val.trim() === '') return '';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (num < 0) {
      return (
        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-error/10 text-error">
          {num}
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-success/10 text-success font-semibold">
        +{num}
      </span>
    );
  };

  // Helper to generate cumulative dates for Contract Process
  const getContractStageDates = (row) => {
    const dates = [];
    const baseDate = new Date('2023-07-18');
    dates.push({ name: 'Process Start Date', date: '18 Jul 2023' });
    
    let currentDate = baseDate;
    for (let i = 1; i <= 8; i++) {
      const StageArray = contractTypeFilter === 'Air' ? CONTRACT_AIR_STAGES : CONTRACT_SEA_STAGES;
      const val = row[i.toString()];
      if (val && val.trim() !== '') {
        const days = Math.abs(parseInt(val, 10)) || 0;
        // Project forward from the base date
        currentDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
        
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        dates.push({
          id: i,
          name: StageArray.find(s => s.id === i).name,
          date: currentDate.toLocaleDateString('en-GB', options)
        });
      } else {
        dates.push({
          id: i,
          name: StageArray.find(s => s.id === i).name,
          date: '[Blank]'
        });
      }
    }
    return dates;
  };

  // Pie slices based on counts
  const pieData = useMemo(() => (
    currentStages.filter(s => s.id <= 8).map((stage, i) => ({
      label: stage.name,
      value: stageCounts[stage.id] || 0,
      color: ['#00373B', '#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74', '#D97706', '#059669'][i % 8],
    }))
  ), [stageCounts, currentStages]);

  return (
    <div className="space-y-lg animate-fade-in">
      {/* Top Tabs / Nav */}
      <StickyHeader className="border-b border-outline-variant">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tender')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'tender'
                  ? 'bg-sidebar-active text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              Tender Process
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'contract'
                  ? 'bg-sidebar-active text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              Contract Process
            </button>
          </div>
          <div />  {/* spacer for flex justify-between */}
        </div>
      </StickyHeader>

      {/* Contract Sub-filters */}
      {activeTab === 'contract' && (
        <div className="flex items-center gap-1.5 bg-surface-container p-0.5 rounded-lg border border-outline-variant/30 w-fit">
          <button
            onClick={() => setContractTypeFilter('All')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              contractTypeFilter === 'All'
                ? 'bg-white text-sidebar-bg shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setContractTypeFilter('Sea')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              contractTypeFilter === 'Sea'
                ? 'bg-white text-sidebar-bg shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sea
          </button>
          <button
            onClick={() => setContractTypeFilter('Air')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              contractTypeFilter === 'Air'
                ? 'bg-white text-sidebar-bg shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Air
          </button>
        </div>
      )}

      {/* KPI and Timeline Row */}
      {isMobile ? (
        <KpiCarousel>
          <KPICard variant="detailed" icon="fa-folder-tree"   iconBg="bg-primary/10" iconColor="text-primary" label={activeTab === 'tender' ? 'Active Tenders' : 'Active Contracts'} value={activeTab === 'tender' ? '11' : '504'} subtitle="currently in process" />
          <KPICard variant="detailed" icon="fa-list-check"    iconBg="bg-primary/10" iconColor="text-primary" label={activeTab === 'tender' ? 'Total Tenders' : 'Total Contracts'} value={activeTab === 'tender' ? '11' : '525'} subtitle="total records" />
          <KPICard variant="detailed" icon="fa-sack-dollar"   iconBg="bg-warning/10" iconColor="text-warning" label="Total Value" value={activeTab === 'tender' ? '$8 B' : (contractTypeFilter === 'Air' ? '$3 B' : '$10.1 B')} subtitle="estimated budget" />
          <KPICard variant="detailed" icon="fa-calendar-check" iconBg="bg-primary/10" iconColor="text-primary" label="Process Start Date" value={activeTab === 'tender' ? '30 Nov 2023' : '18 Jul 2023'} subtitle="baseline date" />
        </KpiCarousel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 grid grid-cols-3 gap-md">
            <KPICard variant="detailed" icon="fa-folder-tree"   iconBg="bg-primary/10" iconColor="text-primary" label={activeTab === 'tender' ? 'Active Tenders' : 'Active Contracts'} value={activeTab === 'tender' ? '11' : '504'} subtitle="currently in process" />
            <KPICard variant="detailed" icon="fa-list-check"    iconBg="bg-primary/10" iconColor="text-primary" label={activeTab === 'tender' ? 'Total Tenders' : 'Total Contracts'} value={activeTab === 'tender' ? '11' : '525'} subtitle="total records" />
            <KPICard variant="detailed" icon="fa-sack-dollar"   iconBg="bg-warning/10" iconColor="text-warning" label="Total Value" value={activeTab === 'tender' ? '$8 B' : (contractTypeFilter === 'Air' ? '$3 B' : '$10.1 B')} subtitle="estimated budget" />
          </div>
          <KPICard variant="detailed" icon="fa-calendar-check" iconBg="bg-primary/10" iconColor="text-primary" label="Process Start Date" value={activeTab === 'tender' ? '30 Nov 2023' : '18 Jul 2023'} subtitle="baseline date" />
        </div>
      )}

      {/* Visualizer card & sidebar dates panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.05fr)_minmax(320px,1fr)] gap-lg">
        {/* Stage Visualizer */}
        <div className="bg-white rounded-xl p-md shadow-level-2 border border-outline-variant flex flex-col self-start">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-xs mb-sm relative z-20">
            <h3 className="text-header-sm font-bold text-on-surface">Stage Visualizer</h3>
            <div className="flex items-center gap-2">
              {visMode === 'chart' && (
                <IconButton variant="expand" data={pieData} title="Stage Visualizer" />
              )}
              <IconButton variant="info" contentId="procurement-stage-visualizer" />
              {isMobile ? (
                <select
                  value={visMode}
                  onChange={(e) => setVisMode(e.target.value)}
                  className="h-8 rounded-lg border border-outline-variant bg-white px-2 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="pipeline">Pipeline</option>
                  <option value="chart">Delay Chart</option>
                  <option value="trend">Delay Trend</option>
                </select>
              ) : (
              <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/30">
              <button
                onClick={() => setVisMode('pipeline')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  visMode === 'pipeline'
                    ? 'bg-white text-sidebar-bg shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <i className="fa-solid fa-chart-bar"></i>
                Pipeline
              </button>
              <button
                onClick={() => setVisMode('chart')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  visMode === 'chart'
                    ? 'bg-white text-sidebar-bg shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <i className="fa-solid fa-chart-pie"></i>
                Delay Chart
              </button>
              <button
                onClick={() => setVisMode('trend')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  visMode === 'trend'
                    ? 'bg-white text-sidebar-bg shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                Delay Trend
              </button>
            </div>
              )}
          </div>
          </div>

          <div className="h-[380px] md:h-[520px]">
            {visMode === 'pipeline' && (
              <div className="h-full flex flex-col justify-around py-1">
                {currentStages.filter(s => s.id <= 8).map((stage) => {
                  const count = stageCounts[stage.id] || 0;
                  const totalCount = filteredData.length || 1;
                  const percent = (count / totalCount) * 100;
                  return (
                    <div key={stage.id} className="flex items-center justify-between gap-md text-body-md py-1">
                      <div className="w-1/3 truncate text-on-surface font-bold text-xs">
                        {stage.id}. {stage.name}
                      </div>
                      <div className="flex-1 bg-surface-container-low h-8 rounded overflow-hidden relative border border-outline-variant/30">
                        {count > 0 && (
                          <div
                            className="bg-primary/80 h-full rounded transition-all duration-500 flex items-center px-3 text-white font-black text-xs"
                            style={{ width: `${Math.max(percent, 8)}%` }}
                          >
                            {count}
                          </div>
                        )}
                      </div>
                      <div className="w-8 text-right font-black text-on-surface text-xs">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {visMode === 'chart' && (
              <div className="h-full flex items-center justify-center px-3 py-2">
                <PieChart data={pieData} />
              </div>
            )}

            {visMode === 'trend' && (
              <div className="h-full flex flex-col">
                {isMobile ? (
                  /* Mobile: accordion list */
                  <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
                    {[
                      { month: 'June', value: 0, contracts: 0 },
                      { month: 'July', value: 130, contracts: 50 },
                      { month: 'August', value: 270, contracts: 150 },
                      { month: 'September', value: 600, contracts: 300 },
                      { month: 'October', value: 800, contracts: 450 },
                      { month: 'November', value: 930, contracts: 500 },
                      { month: 'December', value: 1000, contracts: filteredData.length },
                    ].map((d, idx) => {
                      const isExpanded = hoveredMonthIdx === idx;
                      const isCritical = idx >= 3;
                      return (
                        <div key={d.month} className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                          <button
                            onClick={() => setHoveredMonthIdx(prev => prev === idx ? null : idx)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                          >
                            <div className={`w-2 h-8 rounded-full shrink-0 ${isCritical ? 'bg-error/60' : 'bg-primary/40'}`} />
                            <span className="flex-1 min-w-0 text-sm font-semibold text-on-surface">{d.month} 2023</span>
                            <span className="text-xs font-bold text-on-surface-variant tabular-nums">{d.value}d</span>
                            <i className={`fa-solid fa-chevron-down text-[10px] text-on-surface-variant transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="h-px bg-outline-variant/50 mb-3" />
                              <div className="bg-surface-container-low rounded-lg p-4 space-y-2 text-body-sm">
                                <div className="flex justify-between"><span className="text-on-surface-variant">Avg Delay</span><span className="font-bold text-on-surface font-mono">{d.value} days</span></div>
                                <div className="flex justify-between"><span className="text-on-surface-variant">Active Contracts</span><span className="font-bold text-on-surface font-mono">{d.contracts}</span></div>
                                <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><span className={`font-bold ${isCritical ? 'text-error' : 'text-success'}`}>{isCritical ? 'Critical Delays' : 'On Track'}</span></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Desktop: bars + floating tooltip */
                  <div className="flex-1 min-h-0 relative bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                    {/* Y-axis gridlines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-8 pl-12 pr-4">
                      {[1000, 800, 600, 400, 200, 0].map((val) => (
                        <div key={val} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-on-surface-variant/50 w-7 text-right shrink-0">{val}</span>
                          <div className="flex-1 border-t border-outline-variant/30" />
                        </div>
                      ))}
                    </div>

                    {/* Bars area */}
                    <div className="absolute inset-0 pt-8 pl-14 pr-5 pb-8 flex items-end gap-2.5">
                      {[
                        { month: 'Jun', fullMonth: 'June', value: 0, contracts: 0 },
                        { month: 'Jul', fullMonth: 'July', value: 130, contracts: 50 },
                        { month: 'Aug', fullMonth: 'August', value: 270, contracts: 150 },
                        { month: 'Sep', fullMonth: 'September', value: 600, contracts: 300 },
                        { month: 'Oct', fullMonth: 'October', value: 800, contracts: 450 },
                        { month: 'Nov', fullMonth: 'November', value: 930, contracts: 500 },
                        { month: 'Dec', fullMonth: 'December', value: 1000, contracts: filteredData.length },
                      ].map((d, idx) => {
                        const maxVal = 1000;
                        const pct = (d.value / maxVal) * 100;
                        const isHovered = hoveredMonthIdx === idx;
                        const isCritical = idx >= 3;
                        return (
                          <div key={d.month} className="flex-1 flex flex-col items-center h-full min-w-0">
                            <div
                              className="w-full flex-1 flex items-end cursor-pointer group/bar relative"
                              onMouseEnter={(e) => setHoveredMonthIdx(idx)}
                              onMouseMove={(e) => setTrendTooltip({ x: e.clientX, y: e.clientY, idx })}
                              onMouseLeave={() => { setHoveredMonthIdx(null); setTrendTooltip(null); }}
                              onClick={() => setHoveredMonthIdx(isHovered ? null : idx)}
                            >
                              <div
                                className={`w-full rounded-t transition-all duration-200 ${
                                  isHovered
                                    ? 'bg-[#00373B]'
                                    : isCritical
                                      ? 'bg-[#00373B]/70 group-hover/bar:bg-[#00373B]'
                                      : 'bg-[#00373B]/40 group-hover/bar:bg-[#00373B]/70'
                                }`}
                                style={pct > 0 ? { height: `${pct}%` } : { height: 0, opacity: 0 }}
                              />
                            </div>
                            <div className={`text-[11px] font-bold text-center leading-none mt-1.5 ${isHovered ? 'text-[#00373B]' : 'text-on-surface-variant'}`}>
                              {d.month}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Floating tooltip */}
                    {trendTooltip && hoveredMonthIdx !== null && (() => {
                      const d = [
                        { fullMonth: 'June', value: 0, contracts: 0 },
                        { fullMonth: 'July', value: 130, contracts: 50 },
                        { fullMonth: 'August', value: 270, contracts: 150 },
                        { fullMonth: 'September', value: 600, contracts: 300 },
                        { fullMonth: 'October', value: 800, contracts: 450 },
                        { fullMonth: 'November', value: 930, contracts: 500 },
                        { fullMonth: 'December', value: 1000, contracts: filteredData.length },
                      ][hoveredMonthIdx];
                      const isCritical = hoveredMonthIdx >= 3;
                      return (
                        <div className="fixed pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs z-50"
                          style={{ left: trendTooltip.x + 12, top: trendTooltip.y - 10 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCritical ? 'bg-error' : 'bg-success'}`} />
                            <span className="font-bold text-on-surface text-[13px]">{d.fullMonth} 2023</span>
                          </div>
                          <div className="space-y-1 text-on-surface-variant">
                            <div className="flex justify-between gap-6"><span>Avg Delay</span><span className="font-semibold text-on-surface tabular-nums">{d.value} days</span></div>
                            <div className="flex justify-between gap-6"><span>Active Contracts</span><span className="font-semibold text-on-surface tabular-nums">{d.contracts}</span></div>
                            <div className="flex justify-between gap-6"><span>Status</span><span className={`font-semibold ${isCritical ? 'text-error' : 'text-success'}`}>{isCritical ? 'Critical Delays' : 'On Track'}</span></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Start Dates details panel */}
        <div className="bg-white rounded-xl p-md shadow-level-2 border border-outline-variant flex flex-col gap-sm">
          <div>
            <h3 className="text-header-sm font-bold text-on-surface border-b pb-sm mb-sm">Start Dates of Process</h3>
            {selectedRow ? (
              <div className="space-y-xs">
                {activeTab === 'tender' ? (
                  <>
                    <div className="text-body-sm font-semibold text-primary mb-sm">
                      Selected: <span className="font-mono">{selectedRow['Tender No']}</span>
                    </div>
                    {TENDER_STAGES.filter(s => s.id <= 8).map(stage => (
                      <div key={stage.id} className="flex flex-col py-0.5 border-b border-surface-container last:border-0">
                        <span className="text-[11px] text-on-surface-variant font-semibold leading-none">{stage.id}. {stage.name}</span>
                        <span className="text-[11px] text-on-surface italic mt-0.5">[Blank]</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="text-body-sm font-semibold text-primary mb-sm">
                      Selected PO: <span className="font-mono">{selectedRow['PO No']}</span>
                    </div>
                    {getContractStageDates(selectedRow).map((item, idx) => {
                      const StageArray = contractTypeFilter === 'Air' ? CONTRACT_AIR_STAGES : CONTRACT_SEA_STAGES;
                      const stageObj = item.id ? StageArray.find(s => s.id === item.id) : null;
                      const hoverVal = stageObj ? stageObj.hoverValue : null;
                      return (
                        <div key={idx} className="group relative flex justify-between items-center py-1 border-b border-surface-container last:border-0 cursor-help">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-on-surface-variant font-semibold leading-none">
                              {idx === 0 ? item.name : `${item.id}. ${item.name}`}
                            </span>
                            <span className="text-[11px] text-on-surface font-mono mt-0.5">{item.date}</span>
                          </div>
                          {idx !== 0 && hoverVal !== null && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-sidebar-bg text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md pointer-events-none z-10">
                              Average Processing Time: <span className="font-bold">{hoverVal} days</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              <div className="text-body-sm text-on-surface-variant italic py-4 text-center">
                Select a row in the table below to inspect stage dates
              </div>
            )}
          </div>

          <div className="mt-xs bg-surface-container-low rounded-lg p-sm border border-outline-variant/40">
            <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">Key Insight</span>
            <p className="text-body-sm text-on-surface mt-1 leading-relaxed">
              {activeTab === 'tender' 
                ? 'Active procurements are concentrated in **Preparation & Budget Analysis (7)** and **PO Preparation (3)** stages. None have progressed beyond PO Preparation.'
                : 'Contracts are heavily loaded in **Receiving And Updation On CMS (272)** and **Performance Bond Verification (108)** stages, with only a few reaching customs release.'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters row */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-level-2 flex flex-col md:flex-row items-start md:items-center gap-md">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchQuery}
            onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
            placeholder={activeTab === 'tender' ? 'Search by Tender No or Responsible...' : 'Search by PO No, Tender No, or Invoice No...'}
          />
        </div>
        
        {activeTab === 'tender' && (
          <SelectFilter
            value={responsibleFilter || ''}
            onChange={(v) => { setResponsibleFilter(v || ''); setCurrentPage(1); }}
            options={responsibles}
            placeholder="Responsible: All"
            className="w-full md:w-56"
          />
        )}

        {isMobile && (
          <LandscapeToggle value={tableLandscape} onChange={setTableLandscape} />
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-level-2">
        <div className="overflow-x-auto">
          <table className={`border-collapse ${isMobile && !tableLandscape ? 'whitespace-nowrap' : 'w-full'}`}>
            <thead className="bg-surface-container-low border-b border-outline-variant">
              {activeTab === 'tender' ? (
                <tr>
                  {['Tender No', 'Responsible', ...stageKeys, 'Days Consumed', 'Days Remaining', 'Days Saved']
                    .filter(col => !hideStages || !stageKeys.includes(col))
                    .map((col, i) => {
                    const isSorted = sortConfig.key === col;
                    return (
                      <th
                        key={col}
                        onClick={() => requestSort(col)}
                        className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none hover:bg-surface-container transition-colors whitespace-nowrap ${i === 0 ? 'sticky left-0 z-10 bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {col === '1' || col === '2' || col === '3' || col === '4' || col === '5' || col === '6' || col === '7' || col === '8' ? `Stage ${col}` : col}
                          {isSorted && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ) : (
                <tr>
                  {['PO No', 'PO Type', 'Invoice No', 'Tender No', ...stageKeys, 'Days Consumed', 'Days Remaining', 'Days Saved']
                    .filter(col => !hideStages || !stageKeys.includes(col))
                    .map((col, i) => {
                    const isSorted = sortConfig.key === col;
                    return (
                      <th
                        key={col}
                        onClick={() => requestSort(col)}
                        className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none hover:bg-surface-container transition-colors whitespace-nowrap ${i === 0 ? 'sticky left-0 z-10 bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {col === '1' || col === '2' || col === '3' || col === '4' || col === '5' || col === '6' || col === '7' || col === '8' ? `Stage ${col}` : col}
                          {isSorted && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {paginatedData.length === 0 ? (
                <EmptyState colSpan={hideStages ? (activeTab === 'tender' ? 5 : 7) : (activeTab === 'tender' ? 13 : 15)} message="No records found matching filters" icon="fa-box-open" />
              ) : (
                paginatedData.map((row, index) => {
                  return (
                    <tr
                      key={index}
                      className="transition-colors hover:bg-surface-container-low"
                    >
                      {activeTab === 'tender' ? (
                        <>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} font-mono text-on-surface sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]`}>{row['Tender No']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} text-on-surface whitespace-nowrap`}>{row.Responsible}</td>
                          {!hideStages && (
                            <>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['1'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['2'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['3'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['4'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['5'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['6'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['7'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['8'])}</td>
                            </>
                          )}
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Consumed']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Remaining']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5'} text-right pr-6`}>{formatBadge(row['Days Saved'])}</td>
                        </>
                      ) : (
                        <>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} font-mono text-on-surface sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]`}>{row['PO No']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} text-on-surface whitespace-nowrap`}>{row['PO Type']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px] max-w-[80px]' : 'px-4 py-3.5 text-body-md max-w-xs'} text-on-surface truncate`} title={row['Invoice No']}>{row['Invoice No'] || '—'}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px] max-w-[80px]' : 'px-4 py-3.5 text-body-md max-w-xs'} font-mono text-on-surface truncate`} title={row['Tender No']}>{row['Tender No']}</td>
                          {!hideStages && (
                            <>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['1'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['2'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['3'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['4'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['5'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['6'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['7'])}</td>
                              <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-center`}>{formatBadge(row['8'])}</td>
                            </>
                          )}
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Consumed']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Remaining']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-[11px]' : 'px-4 py-3.5'} text-right pr-6`}>{formatBadge(row['Days Saved'])}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={rowsPerPage}
          onPageChange={(p) => setCurrentPage(p)}
          label="records"
        />
      </div>
    </div>
  );
}

export default Procurement;
