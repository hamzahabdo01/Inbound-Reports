import { useMemo, useState, useEffect, useRef } from 'react';
import ProgramPanel from './ProgramPanel';
import ProgramBarChart from './ProgramBarChart';
import ProgramStackedBarChart from './ProgramStackedBarChart';
import SectionNavigator from '../SectionNavigator';
import BaseTable from '../BaseTable';
import PurchaseOrderTable from './PurchaseOrderTable';
import RecentReceivesTable from './RecentReceivesTable';
import PieChart from '../PieChart';
import KPICard from '../KPICard';
import KpiCarousel from '../KpiCarousel';
import IconButton from '../IconButton';
import ExportDropdown from '../ExportDropdown';
import { SS_WebApi, OIH_WebApi, POD_WebApi, POHRIHRCH_WebApi, RCD_WebApi, MainDashboard_WebApi, OIDRCD_WebApi, LookUp } from '../../api/fanos';

function formatDate(raw) {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return raw;
  }
}

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);
const compactNumber = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const firstAvailableNumber = (row, keys, fallback = 0) => {
  const key = keys.find((candidate) => row?.[candidate] !== undefined && row?.[candidate] !== null && row?.[candidate] !== '');
  return Number(row?.[key]) || fallback;
};

const CHART_COLORS = ['#00373B', '#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74', '#D97706', '#BA1A1A'];

function TinySelect({ label = '2016' }: any) {
  return (
    <select
      value={label}
      aria-label="Report year"
      disabled
      className="h-8 rounded-md border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:outline-none"
    >
      <option>{label}</option>
    </select>
  );
}

function DetailChartPanel({ title, contentId, expandData, expandTitle, action, children }: any) {
  return (
    <ProgramPanel
      title={title}
      action={(
        <div className="flex items-center gap-2">
          {action}
          {expandData && <IconButton variant="expand" data={expandData} title={expandTitle || title} />}
          {contentId && <IconButton variant="info" contentId={contentId} />}
        </div>
      )}
    >
      {children}
    </ProgramPanel>
  );
}

function EmptyDataTable({ title, contentId, columns, subtitle = '', rows = [] }: any) {
  const count = rows.length;
  return (
    <ProgramPanel title={title} subtitle={subtitle} action={contentId ? <div className="flex items-center gap-2"><IconButton variant="info" contentId={contentId} /><ExportDropdown headers={columns} rows={rows} filename={contentId} /></div> : undefined}>
      <BaseTable columns={columns} rows={rows} emptyMessage="No rows" headerBg="bg-[#CFD8DC]" minWidth="520px" rowKey={(row, index) => row.id || index} rowClassName="hover:bg-surface-container-low" />
      <div className="flex items-center justify-end gap-5 border-t border-surface-container-low px-4 py-3 text-[11px] font-semibold text-on-surface-variant">
        <span>Rows per page: 10</span>
        <span>{count > 0 ? `1-${count} of ${count}` : '0-0 of 0'}</span>
        <span className="inline-flex gap-3 text-outline">
          <i className="fa-solid fa-chevron-left" />
          <i className="fa-solid fa-chevron-right" />
        </span>
      </div>
    </ProgramPanel>
  );
}

function NationalMosBelowEop({ stockRow, unit, unitLoaded }: any) {
  if (!stockRow || typeof stockRow !== 'object' || Object.keys(stockRow).length === 0) {
    return (
      <ProgramPanel title="National MOS Below EOP" action={<IconButton variant="info" contentId="national-mos-below-eop" />}>
        <div className="flex h-40 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
      </ProgramPanel>
    );
  }
  const [hoveredGauge, setHoveredGauge] = useState(null);
  const current = firstAvailableNumber(stockRow, ['EstimatedMos', 'EstimatedMOS', 'Estimated', 'Mos', 'MOS', 'CurrentMosBelowEop', 'NationalMosBelowEop'], 2);
  const offTarget = 100;
  const soh = firstAvailableNumber(stockRow, ['SOH', 'NationalMosSoh', 'MosSoh'], 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const currentPct = Math.min(current / Math.max(offTarget, 1), 1);
  const currentLength = Math.max(circumference * currentPct, 4);

  return (
    <ProgramPanel title="National MOS Below EOP" action={<IconButton variant="info" contentId="national-mos-below-eop" />}>
      <div className="px-3 pt-4">
        <div className="relative mx-auto h-28 w-28">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label="National MOS below EOP chart">
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke="#DFE3E5" strokeWidth="18"
              onMouseEnter={() => setHoveredGauge('offTarget')}
              onMouseLeave={() => setHoveredGauge(null)}
            />
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke="#0B4F54" strokeWidth="18" strokeLinecap="round"
              strokeDasharray={`${currentLength} ${circumference - currentLength}`}
              onMouseEnter={() => setHoveredGauge('current')}
              onMouseLeave={() => setHoveredGauge(null)}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full text-center">
            <span className="text-[9px] font-extrabold uppercase text-on-surface-variant">MOS</span>
            <span className="text-[20px] font-extrabold leading-6 text-on-surface">{compactNumber(current)}</span>
            <span className="text-[8px] font-semibold text-on-surface-variant">of {offTarget}</span>
          </div>
          {hoveredGauge && (
            <div
              className="absolute rounded-md bg-[#2F3337] px-2 py-1 text-[12px] font-semibold text-white shadow-lg"
              style={{
                left: hoveredGauge === 'current' ? '62px' : '78px',
                top: hoveredGauge === 'current' ? '10px' : '38px',
              }}
            >
              {hoveredGauge === 'current' ? `MOS: ${compactNumber(current)}` : `Target: ${offTarget} MOS`}
            </div>
          )}
        </div>
        <div className="-mx-3 mt-2 border-t border-outline-variant">
          <div className="flex items-center justify-between border-b border-outline-variant px-3 py-2.5">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">Unit</span>
            <span className="text-[16px] font-extrabold text-on-surface">
              {unitLoaded ? (unit || '—') : <i className="fa-solid fa-spinner fa-spin text-primary text-sm" />}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">SOH</span>
            <span className="text-[16px] font-extrabold text-on-surface">{formatNumber(soh)}</span>
          </div>
        </div>
      </div>
    </ProgramPanel>
  );
}

function ProgramItemSwitcher({ items = [], selectedItem, onSelectItem }: any) {
  if (!items.length || !onSelectItem) return null;

  return (
    <div className="sticky top-[50px] z-[9] -mx-lg border-b border-outline-variant bg-[#F6FAFC]/95 px-lg py-1.5 backdrop-blur">
      <div className="relative">
        <div className="program-item-switcher-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
          {items.map((item) => {
            const label = typeof item === 'string' ? item : item.label;
            const status = typeof item === 'string' ? '' : item.status;
            const active = label === selectedItem;

            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectItem(label)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-bold ${
                  active
                    ? 'border-primary bg-primary text-white shadow-[0px_4px_14px_rgba(10,50,53,0.16)]'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:border-primary/40 hover:text-primary'
                }`}
              >
                <span>{label}</span>
                {status && (
                  <span className={`h-1.5 w-1.5 rounded-full ${status === 'Stocked Out' ? 'bg-error' : status === 'Below EOP' ? 'bg-warning' : 'bg-success'}`} />
                )}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#F6FAFC] to-transparent" />
      </div>
    </div>
  );
}

function StockStatusTable({ stockRow }: any) {
  return (
    <ProgramPanel title="Stock Status" action={<div className="flex items-center gap-2"><TinySelect label="06/18/2026" /><IconButton variant="info" contentId="stock-status" /></div>}>
      <BaseTable
        columns={[
          { key: 'site', label: 'Site' },
          { key: 'SOH', label: 'SOH' },
          { key: 'MOS', label: 'MOS' },
          { key: 'QuantityPurchaseOrder', label: 'Ordered' },
          { key: 'GIT', label: 'GIT' },
          { key: 'Min', label: 'Min' },
          { key: 'Max', label: 'Max' },
          { key: 'need', label: 'Need' },
        ]}
        rows={[]}
        emptyMessage="No stock status data"
        headerBg="bg-[#CFD8DC]"
        minWidth="520px"
        rowKey={(row, index) => row.id || index}
        rowClassName="hover:bg-surface-container-low"
      />
    </ProgramPanel>
  );
}

function PanelSkeleton({ rows = 4, height = 'h-48' }: any) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)] animate-pulse">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-surface-container-high rounded w-48" />
          <div className="h-3 bg-surface-container-high rounded w-32" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
          <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
        </div>
      </div>
      <div className={`px-5 py-4 space-y-3 ${height}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3.5 bg-surface-container-high rounded flex-1" />
            <div className="h-3.5 bg-surface-container-high rounded w-16" />
            <div className="h-3.5 bg-surface-container-high rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrgToggle({ value, onChange }: any) {
  const isHPR = value === 'HPR';
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(isHPR ? 'RDF' : 'HPR')}
        className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F54] cursor-pointer ${
          isHPR ? 'bg-[#0B4F54]' : 'bg-[#86BFC5]'
        }`}
        role="switch" aria-checked={isHPR}
      >
        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
          isHPR ? 'translate-x-8' : 'translate-x-1'
        }`} />
      </button>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange('HPR')}
          className={`text-sm font-bold tracking-wide transition-colors duration-200 cursor-pointer ${
            isHPR ? 'text-[#0B4F54]' : 'text-[#707979] hover:text-[#404849]'
          }`}
        >HPR</button>
        <span className="text-[#CFD8DC] text-sm font-light select-none">/</span>
        <span className={`text-sm font-bold tracking-wide transition-colors duration-200 ${
          !isHPR ? 'text-[#0B4F54]' : 'text-[#707979]'
        }`}>RDF</span>
      </div>
    </div>
  );
}

function ProgramItemDetail({
  programCode = '',
  programName = 'Program',
  productName,
  productSN,
  itemOptions = [],
  stockRow,
  purchaseOrders,
  recentReceives,
  hubRows,
  onBack,
  onSelectItem,
}: any) {
  const [activeOrg, setActiveOrg] = useState('HPR');

  const [apiNationalMos, setApiNationalMos] = useState(null);
  const [apiStockUtil, setApiStockUtil] = useState([]);
  const [apiPipeline, setApiPipeline] = useState([]);
  const [apiExpiryBkdn, setApiExpiryBkdn] = useState([]);
  const [apiDaysOos, setApiDaysOos] = useState([]);
  const [apiPoRc, setApiPoRc] = useState([]);
  const [apiManufacturers, setApiManufacturers] = useState([]);
  const [apiSuppliers, setApiSuppliers] = useState([]);
  const [apiCountries, setApiCountries] = useState([]);
  const [apiReceived, setApiReceived] = useState([]);
  const [apiIssued, setApiIssued] = useState([]);
  const [apiFunding, setApiFunding] = useState([]);
  const [apiProcurer, setApiProcurer] = useState([]);
  const [apiFacilityDist, setApiFacilityDist] = useState([]);
  const [apiOwnershipDist, setApiOwnershipDist] = useState([]);
  const [apiRegionDist, setApiRegionDist] = useState([]);
  const [apiBinCard, setApiBinCard] = useState([]);
  const [unit, setUnit] = useState('');
  const [unitLoaded, setUnitLoaded] = useState(false);

  const [currentDate, setCurrentDate] = useState('');
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const markLoaded = (key: string) => setLoaded(prev => ({...prev, [key]: true}));

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [procurerYear, setProcurerYear] = useState('2016');
  const [yearOptions, setYearOptions] = useState<string[]>(['2016']);
  const [procurerLoading, setProcurerLoading] = useState(false);

  useEffect(() => {
    LookUp.getCurrentDate().then((res) => {
      const d = res?.data?.Data?.[0]?.CurrentDate;
      if (d) setCurrentDate(d);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    LookUp.getFiscalYearList().then((res) => {
      const list = (res?.data?.Data || []).map((y: any) => y.FiscalYear).filter(Boolean);
      if (list.length > 0) {
        setYearOptions(list);
        const current = res?.data?.Data?.find((fy: any) => fy.IsCurrent);
        if (current) setProcurerYear(current.FiscalYear);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Component mount/unmount tracking
  }, []);

  const procurerKeyRef = useRef('');
  useEffect(() => {
    if (!productSN) return;
    const key = `${productSN}|${procurerYear}|${activeOrg}`;
    if (procurerKeyRef.current === key) return;
    procurerKeyRef.current = key;
    setProcurerLoading(true);
    POD_WebApi.getItemProcurer({ ModeCode: activeOrg, FiscalYear: procurerYear, ProductSN: String(productSN) })
      .then(r => setApiProcurer(r?.data?.Data || []))
      .catch(() => setApiProcurer([]))
      .finally(() => setProcurerLoading(false));
  }, [productSN, procurerYear, activeOrg]);

  const formatDateForApi = (dateStr, fmt: 'slash' | 'dash') => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (fmt === 'slash') {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchKeyRef = useRef('');
  useEffect(() => {
    if (!productSN) return;
    const key = `${productSN}|${activeOrg}`;
    if (fetchKeyRef.current === key) return;
    fetchKeyRef.current = key;

    const today = currentDate || new Date().toISOString();
    const todaySlash = formatDateForApi(today, 'slash');
    const todayDash = formatDateForApi(today, 'dash');
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromSlash = formatDateForApi(thirtyDaysAgo.toISOString(), 'slash');
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDash = formatDateForApi(sevenDaysAgo.toISOString(), 'dash');

    const p1 = SS_WebApi.getNationalMOS({ ModeCode: activeOrg, ProductSN: String(productSN) })
      .then(r => { setApiNationalMos(r?.data?.Data?.[0] || null); markLoaded('overview'); }).catch(() => { markLoaded('overview'); });

    const p2 = SS_WebApi.getStockutilizationByEnvironment({ ModeCode: activeOrg, EnvironmentGroupCode: 'HUB', ProductSN: String(productSN), OrderBy: 'Environment' })
      .then(r => { setApiStockUtil(r?.data?.Data || []); markLoaded('stockUtil'); }).catch(() => { markLoaded('stockUtil'); });

    const p3 = POHRIHRCH_WebApi.getHubPipelineByEnvironment({ ModeCode: activeOrg, EnvironmentGroupCode: 'HUB', ProductSN: String(productSN), OrderBy: 'Environment' })
      .then(r => { setApiPipeline(r?.data?.Data || []); markLoaded('pipeline'); }).catch(() => { markLoaded('pipeline'); });

    const p4 = SS_WebApi.getSohNearyExpiryBreakdownByEnvironment({ ModeCode: activeOrg, EnvironmentGroupCode: 'HUB', ProductSN: String(productSN) })
      .then(r => { setApiExpiryBkdn(r?.data?.Data || []); markLoaded('expiry'); }).catch(() => { markLoaded('expiry'); });

    const p5 = SS_WebApi.getDaysOutOfStockBySite({ ModeCode: activeOrg, EnvironmentGroupCode: 'HUB', ProductSN: String(productSN), From: fromSlash, To: todaySlash })
      .then(r => { setApiDaysOos(r?.data?.Data || []); markLoaded('daysOos'); }).catch(() => { markLoaded('daysOos'); });

    const p6 = SS_WebApi.getPoRiRcByDP({ ModeCode: activeOrg, ProductSN: String(productSN) })
      .then(r => { setApiPoRc(r?.data?.Data || []); markLoaded('po'); }).catch(() => { markLoaded('po'); });

    const p7 = RCD_WebApi.getItemByManufacturer({ ModeCode: activeOrg, FiscalYear: '2016', ProductSN: String(productSN), OrderBy: 'Manufacturer' })
      .then(r => { setApiManufacturers(r?.data?.Data || []); markLoaded('manufacturers'); }).catch(() => { markLoaded('manufacturers'); });

    const p8 = RCD_WebApi.getItemBySupplier({ ModeCode: activeOrg, FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => { setApiSuppliers(r?.data?.Data || []); markLoaded('supplier'); }).catch(() => { markLoaded('supplier'); });

    const p9 = RCD_WebApi.getItemCountry({ ModeCode: activeOrg, FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => { setApiCountries(r?.data?.Data || []); markLoaded('country'); }).catch(() => { markLoaded('country'); });

    const p10 = MainDashboard_WebApi.getReceiveTrend({ ModeCode: activeOrg, EnvironmentCode: 'CNPH', ProductSN: String(productSN) })
      .then(r => { setApiReceived(r?.data?.Data || []); markLoaded('received'); }).catch(() => { markLoaded('received'); });

    const p11 = OIH_WebApi.getItemDistributionHub2Facility({ ModeCode: activeOrg, PageSize: 100, Page: 1, ProductSN: String(productSN) })
      .then(r => { setApiIssued(r?.data?.Data || []); markLoaded('issued'); }).catch(() => { markLoaded('issued'); });

    const p12 = POD_WebApi.getItemFundingSourceAndProcurer({ ModeCode: activeOrg, ProductSN: String(productSN) })
      .then(r => { setApiFunding(r?.data?.Data || []); markLoaded('funding'); }).catch(() => { markLoaded('funding'); });

    const p13 = OIH_WebApi.getDistributionByFacilityType({ ModeCode: activeOrg, FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => { setApiFacilityDist(r?.data?.Data || []); markLoaded('facilityDist'); }).catch(() => { markLoaded('facilityDist'); });

    const p14 = OIH_WebApi.getDistributionByOwnershipType({ ModeCode: activeOrg, FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => { setApiOwnershipDist(r?.data?.Data || []); markLoaded('ownershipDist'); }).catch(() => { markLoaded('ownershipDist'); });

    const p15 = SS_WebApi.getSOHByRegion({ ModeCode: activeOrg, ProductSN: String(productSN) })
      .then(r => { setApiRegionDist(r?.data?.Data || []); markLoaded('regionDist'); }).catch(() => { markLoaded('regionDist'); });

    const p16 = OIDRCD_WebApi.getByDateIU_MostRecentIssueReceive({ ModeCode: activeOrg, ProductSN: String(productSN), From: fromDash, To: todayDash })
      .then(r => { setApiBinCard(r?.data?.Data || []); markLoaded('binCard'); }).catch(() => { markLoaded('binCard'); });

    const p17 = SS_WebApi.getNationalstockutilization({ ModeCode: activeOrg, ProgramCode: programCode, OrderBy: 'ProductCN' })
      .then(r => { const rows = r?.data?.Data || []; const match = rows.find((row: any) => String(row.ProductSN) === String(productSN)); if (match?.unit) setUnit(match.unit); setUnitLoaded(true); }).catch(() => { setUnitLoaded(true); });

    Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17]);
  }, [productSN, activeOrg]);

  const productPOs = useMemo(
    () => {
      if (apiPoRc.length > 0) {
        const sampleKeys = Object.keys(apiPoRc[0]);
        const poKey = sampleKeys.find((k) => /^PurchaseOrderNumber|^PONumber|^PO_/i.test(k)) || 'PONumber';
        const dateKey = sampleKeys.find((k) => /^Date|^PODate|^OrderDate/i.test(k)) || 'Date';
        const donorKey = sampleKeys.find((k) => /^Donor|^FundingSource|^Source/i.test(k)) || 'Donor';
        const procurerKey = sampleKeys.find((k) => /^Procurer/i.test(k)) || 'Procurer';
        const supplierKey = sampleKeys.find((k) => /^Supplier|^Vendor|^Manufacturer/i.test(k)) || 'Supplier';
        const orderedKey = sampleKeys.find((k) => /^QuantityPurchaseOrder|^OrderQuantity|^OrderedQuantity|^QuantityOrdered/i.test(k)) || 'OrderQuantity';
        const shippedKey = sampleKeys.find((k) => /^QuantityInvoiced|^Shipped/i.test(k)) || 'Shipped';
        const receivedKey = sampleKeys.find((k) => /^QuantityReceived|^DeliveredQuantity|^ReceivedQuantity/i.test(k)) || 'QuantityReceived';
        return apiPoRc.map((r) => {
          const ordered = Number(r[orderedKey]) || 0;
          const shipped = Number(r[shippedKey]) || 0;
          const received = Number(r[receivedKey]) || 0;
          const pending = Math.max(ordered - received, 0);
          const completed = ordered > 0 ? ((received / ordered) * 100).toFixed(1) : '0.0';
          return {
            po: String(r[poKey] || ''),
            date: String(r[dateKey] || ''),
            donor: String(r[donorKey] || ''),
            procurer: String(r[procurerKey] || ''),
            supplier: String(r[supplierKey] || ''),
            ordered,
            shipped,
            received,
            pending,
            completed,
          };
        });
      }
      return purchaseOrders.filter((row) => row.ProductCN === productName).map((r) => ({
        po: String(r.PurchaseOrderNumber || r.PONumber || ''),
        date: String(r.Date || r.PODate || ''),
        donor: String(r.Donor || r.FundingSource || ''),
        procurer: String(r.Procurer || ''),
        supplier: String(r.Supplier || r.Vendor || r.Manufacturer || ''),
        ordered: Number(r.OrderQuantity || r.OrderedQuantity || 0),
        shipped: Number(r.Shipped || 0),
        received: Number(r.DeliveredQuantity || r.QuantityReceived || 0),
        pending: Math.max(Number(r.OrderQuantity || r.OrderedQuantity || 0) - Number(r.DeliveredQuantity || r.QuantityReceived || 0), 0),
        completed: (() => {
          const o = Number(r.OrderQuantity || r.OrderedQuantity || 0);
          const d = Number(r.DeliveredQuantity || r.QuantityReceived || 0);
          return o > 0 ? ((d / o) * 100).toFixed(1) : '0.0';
        })(),
      }));
    },
    [apiPoRc, purchaseOrders, productName],
  );

  const productReceives = useMemo(
    () => {
      if (apiReceived.length > 0) return apiReceived;
      return recentReceives.filter((row) => row.ProductCN === productName);
    },
    [apiReceived, recentReceives, productName],
  );

  const hubStockRowsOrig = useMemo(
    () => hubRows
      .map((row) => ({ label: row.Site, value: Number(row[productName]) || 0 }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value),
    [hubRows, productName],
  );

  const totalPO = productPOs.reduce((sum, row) => sum + (row.OrderQuantity || row.OrderedQuantity || 0), 0);
  const totalReceived = productReceives.reduce((sum, row) => sum + (row.QuantityReceived || 0), 0);
  const soh = stockRow?.SOH || 0;
  const amc = stockRow?.AMC || 0;
  const max = stockRow?.Max || 0;
  const min = stockRow?.Min || 0;
  const gap = Math.max(max - soh, 0);
  const wastage = firstAvailableNumber(stockRow, ['Wastage', 'WastageQuantity', 'Waste']);
  const nearExpiry = firstAvailableNumber(stockRow, ['nExpiry', 'NearExpiry', 'NearExpiryQuantity', 'ReExpiry']);
  const overage = Math.max(soh - max, 0);

  const pipelineChart = productPOs.slice(0, 12).map((row) => ({
    label: row.PurchaseOrderNumber || row.PONumber || '',
    value: row.NextDeliveryQuantity || row.DeliveredQuantity || 0,
    color: (row.DeliveredQuantity || 0) > 0 ? '#0B4F54' : '#86BFC5',
  }));

  const expiryChart = useMemo(() => {
    if (apiExpiryBkdn.length === 0) return [];
    const sampleKeys = Object.keys(apiExpiryBkdn[0]);
    const labelKey = sampleKeys.find(k => /Environment|Site|Hub/i.test(k)) || sampleKeys[0];
    const sohKey = sampleKeys.find(k => /SOH|Stock|Quantity|Qty|Count/i.test(k)) || sampleKeys[1];
    const expiryKey = sampleKeys.find(k => /^ExpiredAmt/i.test(k)) || sampleKeys.find(k => /Expir/i.test(k) && !/Near/i.test(k)) || sampleKeys.find(k => /Expir|Near|Neary|Below/i.test(k)) || sampleKeys[2];
    return apiExpiryBkdn.slice(0, 12).map((r) => ({
      label: String(r[labelKey] || ''),
      segments: [
        { label: 'SOH', value: Number(r[sohKey]) || 0 },
        { label: 'Expired', value: Number(r[expiryKey]) || 0 },
      ].filter(s => s.value > 0),
    }));
  }, [apiExpiryBkdn]);

  const daysOutChart = useMemo(() => {
    if (apiDaysOos.length === 0) return [];
    const sampleKeys = Object.keys(apiDaysOos[0]);
    const labelKey = sampleKeys.find(k => /EnvironmentCode|Environment_Code/i.test(k)) || sampleKeys.find(k => /Environment|Site|Hub/i.test(k)) || sampleKeys[0];
    const valKey = sampleKeys.find(k => /^DOS$/i.test(k)) || sampleKeys.find(k => /^DoS$/i.test(k)) || sampleKeys.find(k => /^dos$/i.test(k)) || sampleKeys.find(k => /Days|Percent|Value|Count|Pct/i.test(k)) || sampleKeys[1];
    return apiDaysOos.slice(0, 18).map((r, i) => ({
      label: String(r[labelKey] || ''),
      value: Number(r[valKey]) || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [apiDaysOos]);

  const pipelineHubData = useMemo(() => {
    if (apiPipeline.length > 0) {
      const sampleKeys = Object.keys(apiPipeline[0]);
      const envKey = sampleKeys.find(k => /Environment|Site|Hub/i.test(k)) || sampleKeys[0];

      const findKey = (patterns: RegExp[]) => {
        for (const pattern of patterns) {
          const found = sampleKeys.find(k => pattern.test(k));
          if (found) return found;
        }
        return null;
      };

      const poKey = findKey([/^PO$/i, /^PO /i, /OrderQuantity/i, /OrderedQuantity/i, /OrderQty/i, /PurchaseOrderQuantity/i]);
      const gitKey = findKey([/^GIT$/i, /^GIT /i, /InTransit/i, /GoodsInTransit/i]);
      const belowKey = findKey([/^Below Max$/i, /^Below$/i, /BelowMax/i, /BelowMaximum/i]);
      const aboveKey = findKey([/^Above Max$/i, /^Above$/i, /AboveMax/i, /AboveMaximum/i, /OverMax/i]);
      const pdosKey = findKey([/^pDOS$/i, /^pDOS /i, /^PDOS$/i, /^PDOS /i, /ProjectedDays/i, /DaysOfStock/i]);

      const segmentDefs = [
        { label: 'PO', key: poKey },
        { label: 'GIT', key: gitKey },
        { label: 'Below Max', key: belowKey },
        { label: 'Above Max', key: aboveKey },
        { label: 'pDOS', key: pdosKey },
      ];

      return apiPipeline.slice(0, 20).map((r) => ({
        label: String(r[envKey] || ''),
        segments: segmentDefs
          .filter(s => s.key && Number(r[s.key]) > 0)
          .map(s => ({ label: s.label, value: Number(r[s.key]) || 0 })),
      })).filter(item => item.segments.length > 0);
    }
    return hubRows
      .filter((row) => row.Site && Number(row[productName]) > 0)
      .map((row) => {
        const total = Number(row[productName]) || 1;
        return {
          label: row.Site,
          segments: [
            { label: 'PO', value: Math.round(total * 0.35) },
            { label: 'GIT', value: Math.round(total * 0.20) },
            { label: 'Below Max', value: Math.round(total * 0.18) },
            { label: 'Above Max', value: Math.round(total * 0.15) },
            { label: 'pDOS', value: Math.round(total * 0.12) },
          ].filter(s => s.value > 0),
        };
      });
  }, [apiPipeline, hubRows, productName]);

  const stockUtilData = useMemo(() => {
    if (apiStockUtil.length === 0) return [];
    const sampleKeys = Object.keys(apiStockUtil[0]);
    const envKey = sampleKeys.find(k => /Environment|Site|Hub/i.test(k)) || sampleKeys[0];

    const findKey = (patterns: RegExp[]) => {
      const validKeys = sampleKeys.filter(k => !/Amt|Birr|Cost|Price|Value/i.test(k));
      for (const pattern of patterns) {
        const found = validKeys.find(k => pattern.test(k));
        if (found) return found;
      }
      return null;
    };

    const issuedKey = findKey([/^QuantityIssued$/i, /^Issued$/i, /Issued/i]);
    const reservedKey = findKey([/^QuantityReserved$/i, /^Reserved$/i, /Reserved/i]);
    const sohKey = findKey([/^SOH$/i, /^Soh$/i, /Soh/i, /Stock/i]);
    const expiredKey = findKey([/^QuantityExpired$/i, /^Expired$/i, /Expired/i]);
    const damagedKey = findKey([/^QuantityDamaged$/i, /^Damaged$/i, /Damaged/i]);
    const suspendedKey = findKey([/^QuantitySuspended$/i, /^Suspended$/i, /Suspended/i]);

      return apiStockUtil.slice(0, 20).map((r) => {
        const segments = [
          { label: 'Issued', value: Number(issuedKey ? r[issuedKey] : 0) || 0, color: '#0B4F54' },
          { label: 'Reserved', value: Number(reservedKey ? r[reservedKey] : 0) || 0, color: '#86BFC5' },
          { label: 'Soh', value: Number(sohKey ? r[sohKey] : 0) || 0, color: '#059669' },
          { label: 'Expired', value: Number(expiredKey ? r[expiredKey] : 0) || 0, color: '#BA1A1A' },
          { label: 'Damaged', value: Number(damagedKey ? r[damagedKey] : 0) || 0, color: '#D97706' },
          { label: 'Suspended', value: Number(suspendedKey ? r[suspendedKey] : 0) || 0, color: '#404849' },
        ];
      return {
        label: String(r[envKey] || ''),
        segments,
      };
    }).filter(item => item.segments.some(s => s.value > 0));
  }, [apiStockUtil]);

  const manufacturerRows = useMemo(() => {
    if (apiManufacturers.length > 0) {
      const sampleKeys = Object.keys(apiManufacturers[0]);
      const labelKey = sampleKeys.find(k => /Manufacturer|Name|Supplier/i.test(k)) || sampleKeys[0];
      const valKey = sampleKeys.find(k => /Birr|Amount|Value|ETB|Total/i.test(k)) || sampleKeys.find(k => typeof apiManufacturers[0][k] === 'number');
      const total = apiManufacturers.reduce((s, r) => s + (valKey ? Number(r[valKey]) || 0 : 0), 0);
      return apiManufacturers.map((r) => {
        const val = valKey ? Number(r[valKey]) || 0 : 1;
        return {
          label: String(r[labelKey] || 'Unknown'),
          value: val,
          share: total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0%',
        };
      }).filter((r) => r.label && r.label !== 'Unknown');
    }
    return [];
  }, [apiManufacturers]);

  const supplierRows = useMemo(() => {
    if (apiSuppliers.length > 0) {
      const sampleKeys = Object.keys(apiSuppliers[0]);
      const labelKey = sampleKeys.find(k => /Supplier|Donor|Name|Agent/i.test(k)) || sampleKeys[0];
      const valKey = sampleKeys.find(k => /Birr|Amount|Value|ETB|Total|Quantity/i.test(k)) || sampleKeys.find(k => typeof apiSuppliers[0][k] === 'number');
      const total = apiSuppliers.reduce((s, r) => s + (valKey ? Number(r[valKey]) || 0 : 0), 0);
      return apiSuppliers.map((r) => {
        const val = valKey ? Number(r[valKey]) || 0 : 1;
        return {
          label: String(r[labelKey] || 'Unknown'),
          value: val,
          share: total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0%',
        };
      }).filter((r) => r.label && r.label !== 'Unknown');
    }
    return [];
  }, [apiSuppliers]);

  const countryRows = useMemo(() => {
    if (apiCountries.length > 0) {
      const sampleKeys = Object.keys(apiCountries[0]);
      const labelKey = sampleKeys.find(k => /Country|Origin/i.test(k)) || sampleKeys[0];
      const valKey = sampleKeys.find(k => /Birr|Amount|Value|ETB|Total|Quantity/i.test(k)) || sampleKeys.find(k => typeof apiCountries[0][k] === 'number');
      const total = apiCountries.reduce((s, r) => s + (valKey ? Number(r[valKey]) || 0 : 0), 0);
      return apiCountries.map((r) => {
        const val = valKey ? Number(r[valKey]) || 0 : 1;
        return {
          label: String(r[labelKey] || 'Unknown'),
          value: val,
          share: total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '0%',
        };
      }).filter((r) => r.label && r.label !== 'Unknown');
    }
    return [];
  }, [apiCountries]);

  const fundingChart = useMemo(() => {
    if (apiFunding.length === 0) return [];
    const sampleKeys = Object.keys(apiFunding[0]);
    const labelKey = sampleKeys.find(k => /Procurer|Donor|Funding|Source|Agent/i.test(k)) || sampleKeys.find(k => typeof apiFunding[0][k] === 'string');
    const valKey = sampleKeys.find(k => /Birr|Amount|Value|Count|Total|ETB/i.test(k)) || sampleKeys.find(k => typeof apiFunding[0][k] === 'number');
    if (labelKey && valKey) {
      return apiFunding.map((r, i) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: Number(r[valKey]) || 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })).filter(r => r.value > 0);
    }
    return [];
  }, [apiFunding]);

  const procurerChart = useMemo(() => {
    if (apiProcurer.length === 0) return [];
    const sampleKeys = Object.keys(apiProcurer[0]);
    const labelKey = sampleKeys.find(k => /Procurer|Donor|Agent|Name/i.test(k)) || sampleKeys.find(k => typeof apiProcurer[0][k] === 'string');
    const valKey = sampleKeys.find(k => /Birr|Amount|Value|Count|Total|ETB/i.test(k)) || sampleKeys.find(k => typeof apiProcurer[0][k] === 'number');
    if (labelKey && valKey) {
      return apiProcurer.map((r, i) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: Number(r[valKey]) || 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })).filter(r => r.value > 0);
    }
    return [];
  }, [apiProcurer]);

  const facilityDistData = useMemo(() => {
    if (apiFacilityDist.length === 0) return [];
    const data = apiFacilityDist;
    const ignore = new Set(['RowNumber', 'FiscalYear', 'ProductCN', 'ProductSN']);
    const labelKey = Object.keys(data[0]).find((k) =>
      /InstitutionType|Institution|type|facility|category/i.test(k) && typeof data[0][k] === 'string'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'string' && !ignore.has(k)
    );
    const valueKey = Object.keys(data[0]).find((k) =>
      /^AmountIssuedInBirr$/i.test(k)
    ) || Object.keys(data[0]).find((k) =>
      /amount|birr|value|total|quantity|qty/i.test(k) && typeof data[0][k] === 'number'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'number' && !ignore.has(k)
    );
    if (labelKey && valueKey) {
      return data
        .map((r, i) => ({
          label: String(r[labelKey]),
          value: Number(r[valueKey]) || 0,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
        .filter((r) => r.value > 0);
    }
    return [];
  }, [apiFacilityDist]);

  const ownershipDistData = useMemo(() => {
    if (apiOwnershipDist.length === 0) return [];
    const row = apiOwnershipDist[0];
    const keys = Object.keys(row).filter(k => !/RowNumber|Row/i.test(k));
    const labelKey = keys.find(k => typeof row[k] === 'string') || keys[0];
    const valKey = keys.find(k => typeof row[k] === 'number') || keys[1];
    if (!labelKey || !valKey) return [];
    return apiOwnershipDist.map((r, i) => {
      const rawLabel = String(r[labelKey] || '');
      const label = /other/i.test(rawLabel) ? 'Others' : /private/i.test(rawLabel) ? 'Private' : /public/i.test(rawLabel) ? 'Public' : rawLabel;
      return { label, value: Number(r[valKey]) || 0, color: CHART_COLORS[i % CHART_COLORS.length] };
    }).filter(r => r.value > 0);
  }, [apiOwnershipDist]);

  const regionDistData = useMemo(() => {
    if (apiRegionDist.length === 0) return [];
    const sampleKeys = Object.keys(apiRegionDist[0]);
    const labelKey = sampleKeys.find(k => /Region|Environment|Site|Hub/i.test(k)) || sampleKeys.find(k => typeof apiRegionDist[0][k] === 'string');
    const valKey = sampleKeys.find(k => /Birr|Amount|Value|SOH|Count|Total|ETB/i.test(k)) || sampleKeys.find(k => typeof apiRegionDist[0][k] === 'number');
    if (labelKey && valKey) {
      const raw = apiRegionDist.map((r) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: Number(r[valKey]) || 0,
      })).filter(r => r.value > 0);
      const total = raw.reduce((s, r) => s + r.value, 0);
      return raw.map((r, i) => ({
        ...r,
        rawValue: r.value,
        value: total > 0 ? (r.value / total) * 100 : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
    }
    return [];
  }, [apiRegionDist]);

  const binCardRows = useMemo(() => {
    if (apiBinCard.length === 0) return [];
    const sampleKeys = Object.keys(apiBinCard[0]);
    const dateKey = sampleKeys.find(k => /Date|FullDate|TransactionDate/i.test(k)) || sampleKeys[0];
    const invKey = sampleKeys.find(k => /Invoice|Document/i.test(k)) || sampleKeys[1];
    const qtyKey = sampleKeys.find(k => /Quantity|Qty|Count/i.test(k)) || sampleKeys.find(k => typeof apiBinCard[0][k] === 'number');
    const balKey = sampleKeys.find(k => /Balance|Remaining/i.test(k)) || (qtyKey !== sampleKeys[2] ? sampleKeys[2] : sampleKeys[3]);
    const typeKey = sampleKeys.find(k => /Type|Transaction|Action/i.test(k));
    return apiBinCard.map((r, i) => ({
      id: i,
      date: String(r[dateKey] || ''),
      invoice: String(r[invKey] || ''),
      transaction: typeKey ? String(r[typeKey] || '') : '',
      document: '',
      type: '',
      from: '',
      to: '',
      quantity: formatNumber(Number(r[qtyKey]) || 0),
      balance: formatNumber(Number(r[balKey]) || 0),
    }));
  }, [apiBinCard]);

  const issuedRows = useMemo(() => {
    if (apiIssued.length === 0) return [];
    const sampleKeys = Object.keys(apiIssued[0]);
    const dateKey = sampleKeys.find(k => /Date|FullDate/i.test(k)) || sampleKeys[0];
    const regionKey = sampleKeys.find(k => /Region|Woreda|Zone/i.test(k)) || sampleKeys[1];
    const qtyKey = sampleKeys.find(k => /Quantity|Qty|Issued/i.test(k)) || sampleKeys.find(k => typeof apiIssued[0][k] === 'number');
    const invKey = sampleKeys.find(k => /Invoice/i.test(k)) || sampleKeys[2];
    const facilityKey = sampleKeys.find(k => /Facility|Institution|Receiver|To/i.test(k));
    const distributorKey = sampleKeys.find(k => /Supplier/i.test(k)) || sampleKeys.find(k => /Distributor|Hub|Sender|From|Environment/i.test(k));
    return apiIssued.slice(0, 20).map((r, i) => ({
      id: i,
      date: formatDate(r[dateKey]),
      region: String(r[regionKey] || ''),
      facility: facilityKey ? String(r[facilityKey] || '') : '',
      quantity: formatNumber(Number(r[qtyKey]) || 0),
      invoice: String(r[invKey] || ''),
      distributor: distributorKey ? String(r[distributorKey] || '') : '',
    }));
  }, [apiIssued]);

  const DETAIL_SECTIONS = [
    { id: 'pd-overview',     label: 'Overview' },
    { id: 'pd-stock-status', label: 'Stock Status' },
    { id: 'pd-charts',       label: 'Charts' },
    { id: 'pd-po',           label: 'Purchase Orders' },
    { id: 'pd-bin-card',     label: 'Bin Card' },
    { id: 'pd-manufacturers',label: 'Manufacturers' },
    { id: 'pd-supplier',     label: 'Supplier' },
    { id: 'pd-country',      label: 'Country' },
    { id: 'pd-received',     label: 'Received' },
    { id: 'pd-issued',       label: 'Issued' },
  ];

  return (
    <div className="space-y-5">
      <SectionNavigator sections={DETAIL_SECTIONS} scrollOffset={160} />
      <ProgramItemSwitcher
        items={itemOptions}
        selectedItem={productName}
        onSelectItem={onSelectItem}
      />

      <div className="sticky top-[98px] z-[8] -mx-lg bg-[#F6FAFC]/95 px-lg py-1.5 backdrop-blur border-b border-outline-variant">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs sm:text-body-md font-bold text-primary hover:text-primary-hover"
            >
              <i className="fa-solid fa-arrow-left" />
              Back to {programName}
            </button>
          </div>
          <OrgToggle value={activeOrg} onChange={setActiveOrg} />
        </div>
      </div>

      {loaded.overview ? (
      <section id="pd-overview">
        <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] items-stretch gap-4">
          <div className="order-2 lg:order-1">
          <NationalMosBelowEop stockRow={apiNationalMos} unit={unit} unitLoaded={unitLoaded} />
          </div>
          <div className="order-1 lg:order-2">
          {isMobile ? (
          <KpiCarousel>
          <KPICard variant="detailed" icon="fa-boxes-stacked"      iconBg="bg-surface-container" iconColor="text-primary" label="AMC"     value={compactNumber(amc)}          subtitle="Avg monthly" />
          <KPICard variant="detailed" icon="fa-warehouse"          iconBg="bg-success/10"       iconColor="text-success"  label="SOH"     value={compactNumber(soh)}          subtitle="Stock on hand" />
          <KPICard variant="detailed" icon="fa-cart-shopping"      iconBg="bg-surface-container" iconColor="text-primary" label="Ordered" value={compactNumber(totalPO || stockRow?.QuantityPurchaseOrder)} subtitle={`${productPOs.length} PO lines`} />
          <KPICard variant="detailed" icon="fa-route"              iconBg="bg-success/10"       iconColor="text-success"  label="GIT"     value={compactNumber(stockRow?.GIT)} subtitle="In transit" />
          <KPICard variant="detailed" icon="fa-box-open"           iconBg={wastage > 0 ? 'bg-warning/10' : 'bg-surface-container'} iconColor={wastage > 0 ? 'text-warning' : 'text-primary'} label="Wastage"  value={compactNumber(wastage)}       subtitle="Reported waste" />
          <KPICard variant="detailed" icon="fa-clock"              iconBg={nearExpiry > 0 ? 'bg-warning/10' : 'bg-surface-container'} iconColor={nearExpiry > 0 ? 'text-warning' : 'text-primary'} label="nExpiry"  value={compactNumber(nearExpiry)}    subtitle="Near expiry" />
          <KPICard variant="detailed" icon="fa-triangle-exclamation" iconBg={gap > 0 ? 'bg-warning/10' : 'bg-success/10'} iconColor={gap > 0 ? 'text-warning' : 'text-success'} label="Gap"      value={compactNumber(gap)}           subtitle="Gap to max" />
          <KPICard variant="detailed" icon="fa-circle-plus"        iconBg={overage > 0 ? 'bg-error/10' : 'bg-surface-container'} iconColor={overage > 0 ? 'text-error' : 'text-primary'} label="Overage"  value={compactNumber(overage)}       subtitle="Above max" />
          </KpiCarousel>
          ) : (
          <div className="grid h-full grid-cols-4 grid-rows-2 items-stretch gap-2">
          <KPICard variant="detailed" icon="fa-boxes-stacked"      iconBg="bg-surface-container" iconColor="text-primary" label="AMC"     value={compactNumber(amc)}          subtitle="Avg monthly" />
          <KPICard variant="detailed" icon="fa-warehouse"          iconBg="bg-success/10"       iconColor="text-success"  label="SOH"     value={compactNumber(soh)}          subtitle="Stock on hand" />
          <KPICard variant="detailed" icon="fa-cart-shopping"      iconBg="bg-surface-container" iconColor="text-primary" label="Ordered" value={compactNumber(totalPO || stockRow?.QuantityPurchaseOrder)} subtitle={`${productPOs.length} PO lines`} />
          <KPICard variant="detailed" icon="fa-route"              iconBg="bg-success/10"       iconColor="text-success"  label="GIT"     value={compactNumber(stockRow?.GIT)} subtitle="In transit" />
          <KPICard variant="detailed" icon="fa-box-open"           iconBg={wastage > 0 ? 'bg-warning/10' : 'bg-surface-container'} iconColor={wastage > 0 ? 'text-warning' : 'text-primary'} label="Wastage"  value={compactNumber(wastage)}       subtitle="Reported waste" />
          <KPICard variant="detailed" icon="fa-clock"              iconBg={nearExpiry > 0 ? 'bg-warning/10' : 'bg-surface-container'} iconColor={nearExpiry > 0 ? 'text-warning' : 'text-primary'} label="nExpiry"  value={compactNumber(nearExpiry)}    subtitle="Near expiry" />
          <KPICard variant="detailed" icon="fa-triangle-exclamation" iconBg={gap > 0 ? 'bg-warning/10' : 'bg-success/10'} iconColor={gap > 0 ? 'text-warning' : 'text-success'} label="Gap"      value={compactNumber(gap)}           subtitle="Gap to max" />
          <KPICard variant="detailed" icon="fa-circle-plus"        iconBg={overage > 0 ? 'bg-error/10' : 'bg-surface-container'} iconColor={overage > 0 ? 'text-error' : 'text-primary'} label="Overage"  value={compactNumber(overage)}       subtitle="Above max" />
        </div>
          )}
          </div>
          </div>
        </section>
      ) : (
        <PanelSkeleton rows={2} height="h-28" />
      )}

      <section id="pd-stock-status">
        <StockStatusTable stockRow={stockRow} />
      </section>

      {loaded.stockUtil || loaded.pipeline || loaded.expiry || loaded.daysOos || loaded.funding || loaded.facilityDist || loaded.ownershipDist || loaded.regionDist ? (
      <section id="pd-charts">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-x-5 gap-y-5">
        <DetailChartPanel title="Months Of Stock" contentId="months-of-stock">
          <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">
            No data
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Funding Source" contentId="funding-source" expandData={fundingChart} expandTitle="Funding Source">
          <div className="flex h-64 items-center">
            {fundingChart.length > 0 ? (
              <PieChart data={fundingChart} totalLabel="Funding source" />
            ) : (
              <div className="text-body-sm text-on-surface-variant">No data</div>
            )}
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Stock Utilization" contentId="stock-utilization">
          {stockUtilData.length > 0 ? (
            <ProgramStackedBarChart data={stockUtilData} normalized yLabel="%" height={220} horizontal={isMobile} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Procurement Agents" contentId="procurement-agents" expandData={procurerChart} expandTitle="Procurement Agents" action={
          <div className="relative">
            <select value={procurerYear} onChange={(e) => setProcurerYear(e.target.value)}
              className="appearance-none h-7 min-w-[72px] rounded-md border border-outline-variant bg-white pl-2 pr-5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down -ml-4 text-[8px] text-primary pointer-events-none" />
          </div>
        }>
          <div className="flex items-center justify-center py-6">
            <div className="w-[380px]">
              {procurerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <i className="fa-solid fa-spinner fa-spin text-primary text-xl" />
                </div>
              ) : procurerChart.length > 0 ? (
                <PieChart data={procurerChart} totalLabel="Procurement agents" />
              ) : (
                <div className="text-center text-body-sm text-on-surface-variant py-4">No data</div>
              )}
            </div>
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Pipeline" contentId="pipeline">
          {pipelineHubData.length > 0 ? (
            <ProgramStackedBarChart data={pipelineHubData} height={220} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Facility Type" contentId="distribution-by-facility-type" expandData={facilityDistData} expandTitle="Distribution by Facility Type">
          <div className="flex items-center justify-center py-4">
            <div className="w-[380px]">
              {facilityDistData.length > 0 ? (
                <PieChart data={facilityDistData} totalLabel="Facility distribution" />
              ) : (
                <div className="text-center text-body-sm text-on-surface-variant py-4">No data</div>
              )}
            </div>
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Expiry Breakdown in Qty" contentId="expiry-breakdown">
          {expiryChart.length > 0 ? (
            <ProgramStackedBarChart data={expiryChart} height={240} showPct={false} yTicks={[0, 5000, 10000, 15000, 20000, 25000, 30000]} horizontal={isMobile} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Ownership Type" contentId="distribution-by-ownership-type" expandData={ownershipDistData} expandTitle="Distribution by Ownership Type">
          <div className="flex items-center justify-center py-4">
            <div className="w-[380px]">
              {ownershipDistData.length > 0 ? (
                <PieChart data={ownershipDistData} totalLabel="Ownership distribution" />
              ) : (
                <div className="text-center text-body-sm text-on-surface-variant py-4">No data</div>
              )}
            </div>
          </div>
        </DetailChartPanel>

        <div className="col-span-full">
        <DetailChartPanel title="Days Out of Stock in %" contentId="days-out-of-stock">
          {daysOutChart.length > 0 ? (
              <ProgramBarChart data={daysOutChart} valueFormatter={(value) => `${value.toFixed(2)}`} yTicks={[-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1]} horizontal={isMobile} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>
        </div>
      </div>

      <div className="mt-5">
        <DetailChartPanel title="Distribution by Region" contentId="distribution-by-region">
          {regionDistData.length > 0 ? (
            <ProgramBarChart data={regionDistData} valueFormatter={(v) => `${v.toFixed(1)}%`} titleFormatter={(item) => compactNumber(item.rawValue)} horizontal={isMobile} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>
      </div>
      </section>
      ) : (
        <PanelSkeleton rows={6} height="h-72" />
      )}

      {loaded.po ? (
      <section id="pd-po">
        <ProgramPanel title="Purchase Order/Incoming Shipments" subtitle={`${productPOs.length} purchase order records`} action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="purchase-orders" /><ExportDropdown headers={[{key:'po',label:'PO'},{key:'date',label:'Date'},{key:'donor',label:'Donor'},{key:'procurer',label:'Procurer'},{key:'supplier',label:'Supplier'},{key:'ordered',label:'Ordered'},{key:'shipped',label:'Shipped'},{key:'received',label:'Received'},{key:'pending',label:'Pending'},{key:'completed',label:'Completed'}]} rows={productPOs} filename="purchase-orders" /></div>}>
          <PurchaseOrderTable rows={productPOs} />
        </ProgramPanel>
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-52" />
      )}

      {loaded.binCard ? (
      <section id="pd-bin-card">
        <ProgramPanel title="Bin Card" subtitle="Stock movement history" action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="bin-card" /><ExportDropdown headers={[{key:'date',label:'Date'},{key:'invoice',label:'Invoice'},{key:'transaction',label:'Transaction'},{key:'document',label:'Document'},{key:'type',label:'Type'},{key:'from',label:'From'},{key:'to',label:'To'},{key:'quantity',label:'Quantity'},{key:'balance',label:'Balance'}]} rows={binCardRows} filename="bin-card" /></div>}>
          <BaseTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'invoice', label: 'Invoice' },
              { key: 'transaction', label: 'Transaction' },
              { key: 'document', label: 'Document' },
              { key: 'type', label: 'Type' },
              { key: 'from', label: 'From' },
              { key: 'to', label: 'To' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'balance', label: 'Balance' },
            ]}
            rows={binCardRows}
            emptyMessage="No bin card records"
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-52" />
      )}

      {loaded.manufacturers ? (
      <section id="pd-manufacturers">
        <EmptyDataTable
          title="Manufacturers"
          contentId="manufacturers"
          subtitle={`${manufacturerRows.length} source records`}
          rows={manufacturerRows}
          columns={[
            { key: 'label', label: 'Manufacturer' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-36" />
      )}

      {loaded.supplier ? (
      <section id="pd-supplier">
        <EmptyDataTable
          title="Supplier"
          contentId="supplier"
          rows={supplierRows}
          columns={[
            { key: 'label', label: 'Supplier' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-36" />
      )}

      {loaded.country ? (
      <section id="pd-country">
        <EmptyDataTable
          title="Country"
          contentId="country"
          rows={countryRows}
          columns={[
            { key: 'label', label: 'Country' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-36" />
      )}

      {loaded.received ? (
      <section id="pd-received">
        <ProgramPanel title="Received" subtitle={`${productReceives.length} months of data`} action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="received" /><ExportDropdown headers={[{key:'FullDate',label:'Date'},{key:'Supplier',label:'Supplier'},{key:'Manufacturer',label:'Manufacturer'},{key:'Country',label:'Country'},{key:'QuantityReceived',label:'Quantity'},{key:'AmountReceivedBirr',label:'Value (ETB)'}]} rows={productReceives} filename="received" /></div>}>
          <RecentReceivesTable rows={productReceives} />
        </ProgramPanel>
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-52" />
      )}

      {loaded.issued ? (
      <section id="pd-issued">
        <ProgramPanel title="Issued Data: Hub to Facility" subtitle={`${issuedRows.length} records`} action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="issued" /><ExportDropdown headers={[{key:'date',label:'Date'},{key:'region',label:'Region-Zone-Woreda'},{key:'facility',label:'Facility'},{key:'quantity',label:'Quantity'},{key:'invoice',label:'Invoice'},{key:'distributor',label:'Distributor'}]} rows={issuedRows} filename="issued" /></div>}>
          <BaseTable
            columns={[
              { key: 'date', label: 'Date', width: 'min-w-[150px]' },
              { key: 'region', label: 'Region-Zone-Woreda' },
              { key: 'facility', label: 'Facility' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'invoice', label: 'Invoice' },
              { key: 'distributor', label: 'Distributor' },
            ]}
            rows={issuedRows}
            emptyMessage="No issue records available for this product yet"
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
      </section>
      ) : (
        <PanelSkeleton rows={4} height="h-52" />
      )}
    </div>
  );
}

export default ProgramItemDetail;