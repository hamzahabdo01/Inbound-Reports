import { useState, useEffect, useMemo } from 'react';
import { parseCSV } from '../utils/csvParser';
import tenderProcessCSV from '../data/tenderProcess.csv?raw';
import contractProcessForSeaCSV from '../data/contractProcessforSea.csv?raw';
import contractProcessForAirCSV from '../data/contractProcessforAir.csv?raw';
import PieChart from '../components/PieChart';
import SearchInput from '../components/SearchInput';
import SimplePagination from '../components/SimplePagination';
import EmptyState from '../components/EmptyState';
import SelectFilter from '../components/SelectFilter';
import KPICard from '../components/KPICard';
import KpiCarousel from '../components/KpiCarousel';
import StickyHeader from '../components/StickyHeader';
import IconButton from '../components/IconButton';


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
              <div className="h-full flex flex-col items-center justify-start gap-md py-1">
                {/* SVG Interactive Area Chart */}
                <div className="relative w-full flex-1 min-h-0 mt-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-4">
                  <svg className="w-full h-full" viewBox="0 0 780 220" preserveAspectRatio="none">
                    {[0, 200, 400, 600, 800, 1000].map((val) => {
                      const y = 180 - (val / 1000) * 150;
                      return (
                        <line key={val} x1="60" y1={y} x2="740" y2={y} stroke="#EAEEF0" strokeWidth="1" />
                      );
                    })}

                    {[0, 500, 1000].map((val) => {
                      const y = 180 - (val / 1000) * 150;
                      return (
                        <text key={val} x="45" y={y + 4} className="text-[10px] font-bold text-on-surface-variant text-right" fill="currentColor">{val}d</text>
                      );
                    })}

                    {['June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => {
                      const x = 80 + idx * 100;
                      return (
                        <text key={month} x={x} y="200" className="text-[10px] font-bold text-on-surface-variant text-center" fill="currentColor" textAnchor="middle">{month}</text>
                      );
                    })}

                    <path
                      d="M 80 180 L 80 180 L 180 160 L 280 140 L 380 90 L 480 60 L 580 40 L 680 30 L 680 180 Z"
                      fill="#00373B"
                      className="opacity-10"
                    />

                    <path
                      d="M 80 180 L 180 160 L 280 140 L 380 90 L 480 60 L 580 40 L 680 30"
                      fill="none"
                      stroke="#00373B"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {hoveredMonthIdx !== null && (
                      <line
                        x1={80 + hoveredMonthIdx * 100}
                        y1="30"
                        x2={80 + hoveredMonthIdx * 100}
                        y2="180"
                        stroke="#00373B"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}

                    {[
                      { x: 80, y: 180 },
                      { x: 180, y: 160 },
                      { x: 280, y: 140 },
                      { x: 380, y: 90 },
                      { x: 480, y: 60 },
                      { x: 580, y: 40 },
                      { x: 680, y: 30 },
                    ].map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredMonthIdx === i ? '7' : '5'}
                        fill="#00373B"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    ))}

                    {['June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                      <rect
                        key={idx}
                        x={80 + idx * 100 - 50}
                        y="20"
                        width="100"
                        height="165"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredMonthIdx(idx)}
                        onMouseLeave={() => setHoveredMonthIdx(null)}
                      />
                    ))}
                  </svg>

                  {hoveredMonthIdx !== null && (
                    <div
                      className="absolute bg-[#00373B] text-white p-3 rounded-xl shadow-level-3 border border-white/10 z-50 w-56 pointer-events-none"
                      style={{
                        left: isMobile ? '50%' : `${Math.min(80 + hoveredMonthIdx * 100 - 90, 500)}px`,
                        top: '25px',
                        transform: isMobile ? 'translateX(-50%)' : 'none',
                      }}
                    >
                      <div className="text-sm font-bold text-sidebar-accent border-b border-white/10 pb-2 mb-2">
                        {['June 2023', 'July 2023', 'August 2023', 'September 2023', 'October 2023', 'November 2023', 'December 2023'][hoveredMonthIdx]}
                      </div>
                      <div className="text-xs leading-tight space-y-1.5">
                        <div className="flex justify-between"><span>Avg Delay:</span> <span className="font-bold text-white">{[0, 130, 270, 600, 800, 930, 1000][hoveredMonthIdx]} days</span></div>
                        <div className="flex justify-between"><span>Active Contracts:</span> <span className="font-bold text-white">{[0, 50, 150, 300, 450, 500, filteredData.length][hoveredMonthIdx]}</span></div>
                        <div className="flex justify-between"><span>Status:</span> <span className="font-bold text-warning">{hoveredMonthIdx >= 3 ? 'Critical Delays' : 'On Track'}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-md space-y-sm mt-auto text-center text-sm text-on-surface-variant font-medium">
                  Hover over any month's data point on the chart to inspect average contract delay days.
                </div>
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
          <button
            type="button"
            onClick={() => setTableLandscape(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 shrink-0 ${
              tableLandscape
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-on-surface-variant border-outline hover:bg-surface-container'
            }`}
            aria-pressed={tableLandscape}
          >
            <i className={`fa-solid ${tableLandscape ? 'fa-compress' : 'fa-expand'} text-[10px]`} />
            {tableLandscape ? 'Compact' : 'Landscape'}
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-level-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
                        className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none hover:bg-surface-container transition-colors whitespace-nowrap ${i === 0 && isMobile ? 'sticky left-0 z-10 bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]' : ''}`}
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
                        className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase cursor-pointer select-none hover:bg-surface-container transition-colors whitespace-nowrap ${i === 0 && isMobile ? 'sticky left-0 z-10 bg-surface-container-low shadow-[2px_0_4px_rgba(0,0,0,0.06)]' : ''}`}
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
                  const isSelected = selectedRow && (activeTab === 'tender' ? selectedRow['Tender No'] === row['Tender No'] : selectedRow['PO No'] === row['PO No']);
                  return (
                    <tr
                      key={index}
                      onClick={() => setSelectedRow(row)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 hover:bg-primary/10 font-medium' : 'hover:bg-surface-container-low'
                      }`}
                    >
                      {activeTab === 'tender' ? (
                        <>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} font-mono text-on-surface sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]`}>{row['Tender No']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} text-on-surface whitespace-nowrap`}>{row.Responsible}</td>
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
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Consumed']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Remaining']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-right pr-6`}>{formatBadge(row['Days Saved'])}</td>
                        </>
                      ) : (
                        <>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} font-mono text-on-surface sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)]`}>{row['PO No']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} text-on-surface whitespace-nowrap`}>{row['PO Type']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs max-w-[80px]' : 'px-4 py-3.5 text-body-md max-w-xs'} text-on-surface truncate`} title={row['Invoice No']}>{row['Invoice No'] || '—'}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs max-w-[80px]' : 'px-4 py-3.5 text-body-md max-w-xs'} font-mono text-on-surface truncate`} title={row['Tender No']}>{row['Tender No']}</td>
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
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Consumed']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5 text-body-xs' : 'px-4 py-3.5 text-body-md'} text-on-surface text-right pr-6 font-bold`}>{row['Days Remaining']}</td>
                          <td className={`${isMobile ? 'px-2 py-2.5' : 'px-4 py-3.5'} text-right pr-6`}>{formatBadge(row['Days Saved'])}</td>
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
