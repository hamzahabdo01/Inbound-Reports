import { useMemo, useRef, useState } from 'react';
import StickyHeader from '../components/StickyHeader';
import SectionNavigator from '../components/SectionNavigator';
import { getTrendData } from '../api/trend';
import generateAllData from '../data/poPerformanceData';
import poSummaryRaw from '../data/POSummary.json';
import poByMaterialTypeRaw from '../data/POByMaterialType.json';
import poByTypeRaw from '../data/POByType.json';
import { formatAmount } from './po/poShared';
import OverviewTab from './po/OverviewTab';
import ProcurementBreakdownTab from './po/ProcurementBreakdownTab';
import ContractManagementTab from './po/ContractManagementTab';
import PerformanceComplianceTab from './po/PerformanceComplianceTab';

const TABS = [
  { key: 'overview',     label: 'Overview',              icon: 'fa-gauge-high',        sections: ['ppc-overview', 'ppc-open-pos', 'ppc-status', 'ppc-trend'] },
  { key: 'procurement',  label: 'Procurement Breakdown',  icon: 'fa-cart-shopping',     sections: ['ppc-commodity', 'ppc-po-type', 'ppc-supplier-share', 'ppc-funding', 'ppc-local-intl'] },
  { key: 'contracts',    label: 'Contract Management',    icon: 'fa-file-signature',    sections: ['ppc-pipeline', 'ppc-contract-vs-po', 'ppc-lc-cad'] },
  { key: 'compliance',   label: 'Performance & Compliance', icon: 'fa-shield-halved',   sections: ['ppc-leadtime', 'ppc-supplier-perf', 'ppc-supplier-risk', 'ppc-bond'] },
];

const SECTION_LABELS = {
  'ppc-overview': 'Overview', 'ppc-open-pos': 'Open POs', 'ppc-status': 'Status', 'ppc-trend': 'Trend',
  'ppc-commodity': 'Material', 'ppc-po-type': 'PO Type', 'ppc-supplier-share': 'Supplier Share',
  'ppc-funding': 'Funding', 'ppc-local-intl': 'Local vs Intl',
  'ppc-pipeline': 'Pipeline', 'ppc-contract-vs-po': 'Contract vs PO', 'ppc-lc-cad': 'LC/CAD',
  'ppc-leadtime': 'Leadtime', 'ppc-supplier-perf': 'Supplier Perf', 'ppc-supplier-risk': 'Supplier Risk', 'ppc-bond': 'Bond', 'ppc-status': 'Status',
};

export default function PoPerformanceCompliance() {
  const data = useMemo(() => {
    const d = generateAllData();
    d.trend = getTrendData();
    d.poSummary = poSummaryRaw.data;
    d.poByMaterialType = poByMaterialTypeRaw.data;
    d.poByType = poByTypeRaw.data;
    return d;
  }, []);

  const [activeTab, setActiveTab] = useState('overview');
  const [tablePages, setTablePages] = useState({});
  const [trendHover, setTrendHover] = useState(null);
  const [materialHover, setMaterialHover] = useState(null);
  const [poTypeHover, setPoTypeHover] = useState(null);
  const [supplierHover, setSupplierHover] = useState(null);
  const [procurementStatusFilter, setProcurementStatusFilter] = useState('All');
  const [kpiPage, setKpiPage] = useState(0);
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewStatus, setOverviewStatus] = useState('All');

  const trendWithDates = useMemo(() => {
    return data.trend.map(t => {
      const d = new Date(t.date);
      return { ...t, year: d.getFullYear(), month: d.getMonth() + 1, monthLabel: d.toLocaleDateString('en', { month: 'short' }) };
    });
  }, [data.trend]);

  const trendYears = useMemo(() => [...new Set(trendWithDates.map(t => t.year))].sort(), [trendWithDates]);
  const latestYear = trendYears[trendYears.length - 1] || 2026;
  const [trendYear, setTrendYear] = useState(latestYear);

  const filteredTrend = useMemo(() => trendWithDates.filter(t => t.year === trendYear), [trendWithDates, trendYear]);

  const tp = (key) => tablePages[key] || 1;
  const sp = (key) => (page) => setTablePages((prev) => ({ ...prev, [key]: page }));

  const activeSections = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    return tab ? tab.sections : [];
  }, [activeTab]);

  const navigatorSections = useMemo(() => activeSections.map(id => ({ id, label: SECTION_LABELS[id] || id })), [activeSections]);

  const prevTab = useRef(activeTab);
  if (prevTab.current !== activeTab) {
    prevTab.current = activeTab;
    setTablePages({});
  }

  const kpiCards = useMemo(() => {
    const totalPO = data.contractVsPO.reduce((s, c) => s + c.poAmount, 0);
    const totalConsumption = data.contractVsPO.reduce((s, c) => s + c.consumption, 0);
    const avgPct = totalPO ? Math.round((totalConsumption / totalPO) * 100) : 0;
    const poIssued = data.procurementStatus.stages.find((s) => s.stage === 'PO Issued')?.count || 0;
    const received = data.procurementStatus.stages.find((s) => s.stage === 'Received at Warehouse')?.count || 0;
    const poToReceivePct = poIssued ? Math.round((received / poIssued) * 100) : 0;
    return [
      { icon: 'fa-coins',                iconBg: 'bg-warning/10',    iconColor: 'text-warning',        label: 'Total Contract',     value: formatAmount(data.kpis.totalContractAmount),                          subtitle: `${data.kpis.totalContracts} contracts` },
      { icon: 'fa-file-invoice',         iconBg: 'bg-primary/10',     iconColor: 'text-primary',       label: 'Total PO Amount',          value: data.poSummary.purchaseOrderCount.toLocaleString(),               subtitle: `${data.poSummary.convertedPurchaseOrderCount} converted` },
      { icon: 'fa-list',                 iconBg: 'bg-[#4A8EA5]/10',  iconColor: 'text-[#4A8EA5]',     label: 'Num of Procured Items',           value: data.poSummary.purchaseOrderLineCount.toLocaleString(),           subtitle: `${data.poSummary.lineCurrencyConversionCoveragePercent}% conversion` },
      { icon: 'fa-building',             iconBg: 'bg-surface-container', iconColor: 'text-primary',    label: 'Suppliers',          value: data.poSummary.supplierCount.toLocaleString(),                    subtitle: 'active vendors' },
      { icon: 'fa-percent',              iconBg: 'bg-primary/10',     iconColor: 'text-primary',       label: 'Conversion',         value: `${data.poSummary.purchaseOrderCurrencyConversionCoveragePercent}%`, subtitle: 'currency coverage' },
      { icon: 'fa-flag',                 iconBg: 'bg-success/10',    iconColor: 'text-success',        label: 'Unconverted',        value: data.poSummary.unconvertedPurchaseOrderCount.toLocaleString(),     subtitle: 'POs not converted' },
      { icon: 'fa-calendar-check',       iconBg: 'bg-success/10',    iconColor: 'text-success',        label: 'Latest PO',          value: data.poSummary.latestPurchaseOrderDate,                            subtitle: 'most recent PO date' },
      { icon: 'fa-calendar-plus',        iconBg: 'bg-[#4A8EA5]/10',  iconColor: 'text-[#4A8EA5]',     label: 'Earliest PO',        value: data.poSummary.earliestPurchaseOrderDate,                          subtitle: 'first PO date' },
      { icon: 'fa-percent',              iconBg: 'bg-primary/10',     iconColor: 'text-primary',       label: 'Avg Consumption Rate', value: `${avgPct}%`,                                                        subtitle: 'across all contracts' },
      { icon: 'fa-warehouse',            iconBg: 'bg-success/10',    iconColor: 'text-success',        label: 'PO to Receive Conversion', value: `${poToReceivePct}%`,                                           subtitle: `${received} of ${poIssued} PO received` },
    ];
  }, [data.poSummary, data.contractVsPO, data.procurementStatus, data.kpis]);

  const kpiTotalPages = Math.ceil(kpiCards.length / 4);
  const visibleKpiCards = kpiCards.slice(kpiPage * 4, kpiPage * 4 + 4);

  const filteredOpenOverduePOs = useMemo(() => {
    return data.openOverduePOs.filter((po) => {
      const matchSearch = po.poNo.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.supplier.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.program.toLowerCase().includes(overviewSearch.toLowerCase());
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
      <StickyHeader>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            ><i className={`fa-solid ${tab.icon} mr-2`}></i>{tab.label}</button>
          ))}
        </div>
      </StickyHeader>

      {activeTab === 'overview' && (
        <OverviewTab
          data={data} activeSections={activeSections}
          kpiPage={kpiPage} setKpiPage={setKpiPage}
          visibleKpiCards={visibleKpiCards} kpiTotalPages={kpiTotalPages}
          filteredOpenOverduePOs={filteredOpenOverduePOs}
          overviewSearch={overviewSearch} setOverviewSearch={setOverviewSearch}
          overviewStatus={overviewStatus} setOverviewStatus={setOverviewStatus}
          trendWithDates={trendWithDates} trendYears={trendYears}
          trendYear={trendYear} setTrendYear={setTrendYear}
          filteredTrend={filteredTrend} trendHover={trendHover} setTrendHover={setTrendHover}
          procurementStatusFilter={procurementStatusFilter}
          setProcurementStatusFilter={setProcurementStatusFilter}
          filteredStatusDetails={filteredStatusDetails}
          tp={tp} sp={sp}
        />
      )}

      {activeTab === 'procurement' && (
        <ProcurementBreakdownTab
          data={data} activeSections={activeSections}
          materialHover={materialHover} setMaterialHover={setMaterialHover}
          poTypeHover={poTypeHover} setPoTypeHover={setPoTypeHover}
          supplierHover={supplierHover} setSupplierHover={setSupplierHover}
        />
      )}

      {activeTab === 'contracts' && (
        <ContractManagementTab
          data={data} activeSections={activeSections} tp={tp} sp={sp}
        />
      )}

      {activeTab === 'compliance' && (
        <PerformanceComplianceTab
          data={data} activeSections={activeSections} tp={tp} sp={sp}
        />
      )}
    </div>
  );
}
