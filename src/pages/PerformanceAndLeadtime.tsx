import { useMemo, useRef, useState, useEffect } from 'react';
import StickyHeader from '../components/StickyHeader';
import SectionNavigator from '../components/SectionNavigator';
import { getTrendData } from '../api/trend';
import generateAllData from '../data/poPerformanceData';
import poSummaryRaw from '../data/POSummary.json';
import poByMaterialTypeRaw from '../data/POByMaterialType.json';
import poByTypeRaw from '../data/POByType.json';
import poSummaryByYearRaw from '../data/POSummaryByYear.json';
import poByMaterialTypeByYearRaw from '../data/POByMaterialTypeByYear.json';
import { formatAmount } from './po/poShared';
import OverviewTab from './po/OverviewTab';
import ProcurementBreakdownTab from './po/ProcurementBreakdownTab';
import ContractManagementTab from './po/ContractManagementTab';
import LeadtimeAndPerformanceTab from './po/LeadtimeAndPerformanceTab';

const TABS = [
  { key: 'overview',     label: 'Overview',              icon: 'fa-gauge-high',        sections: ['ppc-overview', 'ppc-procurement-breakdown', 'ppc-supplier-share', 'ppc-funding', 'ppc-local-intl', 'ppc-trend'] },
  { key: 'procurement',  label: 'Procurement Breakdown',  icon: 'fa-cart-shopping',     sections: ['ppc-open-pos', 'ppc-open-po-items', 'ppc-overdue-pos', 'ppc-status'] },
  { key: 'contracts',    label: 'Contract Management',    icon: 'fa-file-signature',    sections: ['ppc-pipeline', 'ppc-contract-vs-po', 'ppc-contract-to-receive', 'ppc-yearly-contract-receipt', 'ppc-lc-cad'] },
  { key: 'compliance',   label: 'Performance & Leadtime', icon: 'fa-shield-halved',   sections: ['ppc-leadtime', 'ppc-supplier-perf', 'ppc-supplier-risk', 'ppc-bond'] },
];

const SECTION_LABELS = {
  'ppc-overview': 'Overview', 'ppc-open-pos': 'Open POs', 'ppc-open-po-items': 'PO Items', 'ppc-status': 'Status', 'ppc-trend': 'Trend',
  'ppc-procurement-breakdown': 'Proc. Breakdown', 'ppc-supplier-share': 'Supplier Share',
  'ppc-funding': 'Funding', 'ppc-local-intl': 'Local vs Intl',
  'ppc-pipeline': 'Pipeline', 'ppc-contract-vs-po': 'Contract vs PO', 'ppc-lc-cad': 'LC/CAD', 'ppc-contract-to-receive': 'Contract → Receive', 'ppc-yearly-contract-receipt': 'Yearly Funnel',
  'ppc-leadtime': 'Leadtime', 'ppc-supplier-perf': 'Supplier Perf', 'ppc-supplier-risk': 'Supplier Risk', 'ppc-bond': 'Bond', 'ppc-overdue-pos': 'Overdue PO',
};

export default function PerformanceAndLeadtime() {
  const data = useMemo(() => {
    const d: any = generateAllData();
    d.trend = getTrendData();
    d.poSummary = poSummaryRaw.data;
    d.poByMaterialType = poByMaterialTypeRaw.data;
    d.poByType = poByTypeRaw.data;
    return d;
  }, []);

  const poSummaryByYear = useMemo(() => {
    const map: Record<number, any> = {};
    poSummaryByYearRaw.data.forEach((item: any) => { map[item.year] = item; });
    return map;
  }, []);

  const poByMaterialTypeByYear = useMemo(() => {
    const map: Record<number, any[]> = {};
    poByMaterialTypeByYearRaw.data.forEach((item: any) => {
      if (!map[item.year]) map[item.year] = [];
      map[item.year].push({ ...item, amountSharePercent: item.yearAmountSharePercent });
    });
    return map;
  }, []);

  const years = useMemo(() => Object.keys(poSummaryByYear).map(Number).sort(), [poSummaryByYear]);
  const [selectedYear, setSelectedYear] = useState(() => years[years.length - 1] || 2026);
  const [yearLoading, setYearLoading] = useState(false);

  const prevYearRef = useRef(selectedYear);
  useEffect(() => {
    if (prevYearRef.current !== selectedYear) {
      prevYearRef.current = selectedYear;
      setYearLoading(true);
      const timer = setTimeout(() => setYearLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [selectedYear]);

  const poSummaryForYear = poSummaryByYear[selectedYear] || poSummaryByYear[years[years.length - 1]];
  const poByMaterialTypeForYear = poByMaterialTypeByYear[selectedYear] || poByMaterialTypeByYear[years[years.length - 1]];

  const [activeTab, setActiveTab] = useState('overview');
  const [tablePages, setTablePages] = useState({});

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [trendHover, setTrendHover] = useState(null);
  const [supplierHover, setSupplierHover] = useState(null);
  const [procurementStatusFilter, setProcurementStatusFilter] = useState('All');
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewStatus, setOverviewStatus] = useState('All');

  const tp = (key) => tablePages[key] || 1;
  const sp = (key) => (page) => setTablePages((prev) => ({ ...prev, [key]: page }));

  const activeSections = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    return tab ? tab.sections : [];
  }, [activeTab]);

  const navigatorSections = useMemo(() => {
    return activeSections
      .filter(id => id !== 'ppc-overview')
      .map(id => ({ id, label: SECTION_LABELS[id] || id }));
  }, [activeSections]);

  const prevTab = useRef(activeTab);
  if (prevTab.current !== activeTab) {
    prevTab.current = activeTab;
    setTablePages({});
  }

  const kpiCards = useMemo(() => {
    const totalConsumed = data.contractVsPO.reduce((s, c) => s + c.consumedAmount, 0);
    const totalRemaining = data.contractVsPO.reduce((s, c) => s + c.remaining, 0);
    const avgPct = (totalConsumed + totalRemaining) ? Math.round((totalConsumed / (totalConsumed + totalRemaining)) * 100) : 0;
    const poIssued = data.procurementStatus.stages.find((s) => s.stage === 'PO Issued')?.count || 0;
    const received = data.procurementStatus.stages.find((s) => s.stage === 'Received at Warehouse')?.count || 0;
    const poToReceivePct = poIssued ? Math.round((received / poIssued) * 100) : 0;
    const ps = poSummaryForYear;
    return [
      { icon: 'fa-coins',                iconBg: 'bg-warning/10',    iconColor: 'text-warning',        label: 'Total Contract',     value: formatAmount(data.kpis.totalContractAmount),                          subtitle: `${data.kpis.totalContracts} contracts` },
      { icon: 'fa-file-invoice',         iconBg: 'bg-primary/10',     iconColor: 'text-primary',       label: 'Total PO Amount',          value: `${formatAmount(ps.totalAmount)} ETB`,                 subtitle: `${ps.purchaseOrderCount.toLocaleString()} purchase orders` },
      { icon: 'fa-list',                 iconBg: 'bg-[#4A8EA5]/10',  iconColor: 'text-[#4A8EA5]',     label: '# of Procured Items',           value: ps.purchaseOrderLineCount.toLocaleString(),           subtitle: `${ps.lineCurrencyConversionCoveragePercent}% conversion` },
      { icon: 'fa-building',             iconBg: 'bg-surface-container', iconColor: 'text-primary',    label: 'Suppliers',          value: ps.supplierCount.toLocaleString(),                    subtitle: 'active vendors' },
      { icon: 'fa-calendar-check',       iconBg: 'bg-success/10',    iconColor: 'text-success',        label: 'Latest PO',          value: (() => { const [y,m,d] = ps.latestPurchaseOrderDate.split('-').map(Number); return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}, ${y}`; })(), subtitle: 'most recent PO date' },
      { icon: 'fa-calendar-plus',        iconBg: 'bg-[#4A8EA5]/10',  iconColor: 'text-[#4A8EA5]',     label: 'Earliest PO',        value: (() => { const [y,m,d] = ps.earliestPurchaseOrderDate.split('-').map(Number); return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}, ${y}`; })(), subtitle: 'first PO date' },
      { icon: 'fa-percent',              iconBg: 'bg-primary/10',     iconColor: 'text-primary',       label: 'Avg Consumption Rate', value: `${avgPct}%`,                                                        subtitle: 'across all contracts' },
      { icon: 'fa-warehouse',            iconBg: 'bg-success/10',    iconColor: 'text-success',        label: 'PO to Receive Conversion', value: `${poToReceivePct}%`,                                           subtitle: `${received} of ${poIssued} PO received` },
    ];
  }, [poSummaryForYear, data.contractVsPO, data.procurementStatus, data.kpis]);

  const filteredOpenOverduePOs = useMemo(() => {
    return data.openOverduePOs.filter((po) => {
      const matchSearch = !overviewSearch ||
        po.poNo.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.materialDescription.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.poType.toLowerCase().includes(overviewSearch.toLowerCase());
      const matchStatus = overviewStatus === 'All' || po.status === overviewStatus;
      return matchSearch && matchStatus;
    });
  }, [data.openOverduePOs, overviewSearch, overviewStatus]);

  const prevOverviewSearch = useRef(overviewSearch);
  const prevOverviewStatus = useRef(overviewStatus);
  if (prevOverviewSearch.current !== overviewSearch || prevOverviewStatus.current !== overviewStatus) {
    prevOverviewSearch.current = overviewSearch;
    prevOverviewStatus.current = overviewStatus;
    setTablePages((prev) => ({ ...prev, 'open-pos': 1 }));
  }

  const filteredStatusDetails = useMemo(() => {
    if (procurementStatusFilter === 'All') return data.procurementStatus.details;
    return data.procurementStatus.details.filter((d) => d.stage === procurementStatusFilter);
  }, [data, procurementStatusFilter]);

  return (
    <div className="space-y-5">
      <SectionNavigator sections={navigatorSections} />
      <StickyHeader mobileYearTabs={isMobile ? years.map(y => (
        <button key={y} onClick={() => setSelectedYear(y)}
          className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-all duration-150 ${
            selectedYear === y
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
        >{y}</button>
      )) : undefined}>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-2 sm:px-4 py-2 max-sm:px-1.5 max-sm:py-1.5 max-sm:text-[11px] text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            ><i className={`fa-solid ${tab.icon} mr-2`}></i>{tab.label}</button>
          ))}
        </div>
        {!isMobile && (
          <div className="relative shrink-0">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="appearance-none h-8 min-w-[82px] rounded-md border border-outline-variant bg-white pl-2.5 pr-7 text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary pointer-events-none" />
          </div>
        )}
      </StickyHeader>

      {yearLoading ? (
        <div className="space-y-5 animate-pulse">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 h-24 bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)]" />
            ))}
          </div>
          <div className="h-72 bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)]" />
          <div className="h-48 bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)]" />
        </div>
      ) : activeTab === 'overview' && (
        <OverviewTab
          data={data} activeSections={activeSections}
          kpiCards={kpiCards}
          supplierHover={supplierHover} setSupplierHover={setSupplierHover}
          trendHover={trendHover} setTrendHover={setTrendHover}
          poByMaterialTypeForYear={poByMaterialTypeForYear}
          selectedYear={selectedYear}
        />
      )}

      {activeTab === 'procurement' && (
        <ProcurementBreakdownTab
          data={data} activeSections={activeSections}
          filteredOpenOverduePOs={filteredOpenOverduePOs}
          overviewSearch={overviewSearch} setOverviewSearch={setOverviewSearch}
          overviewStatus={overviewStatus} setOverviewStatus={setOverviewStatus}
          procurementStatusFilter={procurementStatusFilter}
          setProcurementStatusFilter={setProcurementStatusFilter}
          filteredStatusDetails={filteredStatusDetails}
          tp={tp} sp={sp}
          selectedYear={selectedYear}
        />
      )}

      {activeTab === 'contracts' && (
        <ContractManagementTab
          data={data} activeSections={activeSections} tp={tp} sp={sp}
          selectedYear={selectedYear}
        />
      )}

      {activeTab === 'compliance' && (
        <LeadtimeAndPerformanceTab
          data={data} activeSections={activeSections} tp={tp} sp={sp}
          selectedYear={selectedYear}
        />
      )}
    </div>
  );
}
