import { useMemo, useState, useEffect, useCallback } from 'react';
import ProgramPanel from './ProgramPanel';
import ProgramBarChart from './ProgramBarChart';
import ProgramStackedBarChart from './ProgramStackedBarChart';
import SectionNavigator from '../SectionNavigator';
import BaseTable from '../BaseTable';
import PurchaseOrderTable from './PurchaseOrderTable';
import RecentReceivesTable from './RecentReceivesTable';
import PieChart from '../PieChart';
import KPICard from '../KPICard';
import IconButton from '../IconButton';
import { SS_WebApi, OIH_WebApi, POD_WebApi, POHRIHRCH_WebApi, RCD_WebApi, MainDashboard_WebApi, OIDRCD_WebApi, LookUp } from '../../api/fanos';

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);
const compactNumber = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const safePercent = (value, total) => (total > 0 ? (value / total) * 100 : 0);
const firstAvailableNumber = (row, keys, fallback = 0) => {
  const key = keys.find((candidate) => row?.[candidate] !== undefined && row?.[candidate] !== null && row?.[candidate] !== '');
  return Number(row?.[key]) || fallback;
};

const CHART_COLORS = ['#00373B', '#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74', '#D97706', '#BA1A1A'];

const groupBySum = (rows, key, valueKey) => {
  const grouped: Record<string, number> = rows.reduce((acc: any, row: any) => {
    const label = row[key] || 'Unknown';
    acc[label] = (acc[label] || 0) + (Number(row[valueKey]) || 0);
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

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

function DetailChartPanel({ title, icon = 'fa-circle-info', action, children }: any) {
  return (
    <ProgramPanel
      title={title}
      action={(
        <div className="flex items-center gap-2">
          {action}
          <i className={`fa-solid ${icon} text-[13px] text-primary/80`} />
        </div>
      )}
    >
      {children}
    </ProgramPanel>
  );
}

function EmptyDataTable({ title, columns, subtitle = '', rows = [] }: any) {
  return (
    <ProgramPanel title={title} subtitle={subtitle}>
      <BaseTable columns={columns} rows={rows} emptyMessage="No rows" headerBg="bg-[#CFD8DC]" minWidth="520px" rowKey={(row, index) => row.id || index} rowClassName="hover:bg-surface-container-low" />
      <div className="flex items-center justify-end gap-5 border-t border-surface-container-low px-4 py-3 text-[11px] font-semibold text-on-surface-variant">
        <span>Rows per page: 10</span>
        <span>0-0 of 0</span>
        <span className="inline-flex gap-3 text-outline">
          <i className="fa-solid fa-chevron-left" />
          <i className="fa-solid fa-chevron-right" />
        </span>
      </div>
    </ProgramPanel>
  );
}

function NationalMosBelowEop({ stockRow }: any) {
  const [hoveredGauge, setHoveredGauge] = useState(null);
  const current = firstAvailableNumber(stockRow, ['NationalMosBelowEop', 'CurrentMosBelowEop'], 2);
  const offTarget = firstAvailableNumber(stockRow, ['OffTarget', 'OffTargetMos'], 100);
  const unit = stockRow?.Unit || '50x2';
  const soh = firstAvailableNumber(stockRow, ['NationalMosSoh', 'MosSoh'], 70735);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const currentPct = Math.min(current / Math.max(offTarget, 1), 1);
  const currentLength = Math.max(circumference * currentPct, 4);

  return (
    <ProgramPanel title="National MOS Below EOP">
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
            <span className="text-[9px] font-extrabold uppercase text-on-surface-variant">Current</span>
            <span className="text-[24px] font-extrabold leading-7 text-on-surface">{current}</span>
          </div>
          {hoveredGauge && (
            <div
              className="absolute rounded-md bg-[#2F3337] px-2 py-1 text-[12px] font-semibold text-white shadow-lg"
              style={{
                left: hoveredGauge === 'current' ? '62px' : '78px',
                top: hoveredGauge === 'current' ? '10px' : '38px',
              }}
            >
              {hoveredGauge === 'current' ? `Current: ${current}` : `Off target: ${offTarget}`}
            </div>
          )}
        </div>
        <div className="-mx-3 mt-1 grid grid-cols-2 border-t border-outline-variant text-body-sm">
          <div className="border-r border-outline-variant px-3 py-2">
            <p className="font-bold text-on-surface">Unit</p>
            <p className="mt-2 text-on-surface">{unit}</p>
          </div>
          <div className="px-3 py-2 text-right">
            <p className="font-bold text-on-surface">SOH</p>
            <p className="mt-2 text-on-surface">{formatNumber(soh)}</p>
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
  const rows = stockRow ? [stockRow] : [];
  return (
    <ProgramPanel title="Stock Status" action={<TinySelect label="06/18/2026" />}>
      <BaseTable
        columns={[
          { key: 'site', label: 'Site' },
          { key: 'SOH', label: 'SOH', render: (row) => formatNumber(row.SOH) },
          { key: 'MOS', label: 'MOS', render: (row) => row.MOS.toFixed(1) },
          { key: 'QuantityPurchaseOrder', label: 'Ordered', render: (row) => formatNumber(row.QuantityPurchaseOrder) },
          { key: 'GIT', label: 'GIT', render: (row) => formatNumber(row.GIT) },
          { key: 'Min', label: 'Min', render: (row) => formatNumber(row.Min) },
          { key: 'Max', label: 'Max', render: (row) => formatNumber(row.Max) },
          { key: 'need', label: 'Need', render: (row) => formatNumber(Math.max(row.Max - row.SOH - row.GIT - row.QuantityPurchaseOrder, 0)) },
        ]}
        rows={rows.map((row) => ({ ...row, site: 'National' }))}
        headerBg="bg-[#CFD8DC]"
        minWidth="520px"
        rowKey={(row, index) => row.id || index}
        rowClassName="hover:bg-surface-container-low"
      />
    </ProgramPanel>
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

  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LookUp.getCurrentDate().then((res) => {
      const d = res?.data?.Data?.[0]?.CurrentDate;
      if (d) setCurrentDate(d);
    }).catch(() => {});
  }, []);

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

  const fetchAll = useCallback(async () => {
    if (!productSN) return;
    setLoading(true);

    const today = currentDate || new Date().toISOString();
    const todaySlash = formatDateForApi(today, 'slash');
    const todayDash = formatDateForApi(today, 'dash');
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromSlash = formatDateForApi(thirtyDaysAgo.toISOString(), 'slash');
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDash = formatDateForApi(sevenDaysAgo.toISOString(), 'dash');

    const p1 = SS_WebApi.getNationalMOS({ ModeCode: 'HPR', ProductSN: String(productSN) })
      .then(r => setApiNationalMos(r?.data?.Data?.[0] || null)).catch(() => {});

    const p2 = SS_WebApi.getStockutilizationByEnvironment({ ModeCode: 'HPR', EnvironmentGroupCode: 'HUB', ProductSN: String(productSN), OrderBy: 'Environment' })
      .then(r => setApiStockUtil(r?.data?.Data || [])).catch(() => {});

    const p3 = POHRIHRCH_WebApi.getHubPipelineByEnvironment({ ModeCode: 'HPR', EnvironmentGroupCode: 'HUB', ProductSN: String(productSN), OrderBy: 'Environment' })
      .then(r => setApiPipeline(r?.data?.Data || [])).catch(() => {});

    const p4 = SS_WebApi.getSohNearyExpiryBreakdownByEnvironment({ ModeCode: 'HPR', EnvironmentGroupCode: 'HUB', ProductSN: String(productSN) })
      .then(r => setApiExpiryBkdn(r?.data?.Data || [])).catch(() => {});

    const p5 = SS_WebApi.getDaysOutOfStockBySite({ ModeCode: 'HPR', EnvironmentGroupCode: 'HUB', ProductSN: String(productSN), From: fromSlash, To: todaySlash })
      .then(r => setApiDaysOos(r?.data?.Data || [])).catch(() => {});

    const p6 = SS_WebApi.getPoRiRcByDP({ ModeCode: 'HPR', ProductSN: String(productSN) })
      .then(r => setApiPoRc(r?.data?.Data || [])).catch(() => {});

    const p7 = RCD_WebApi.getItemByManufacturer({ ModeCode: 'HPR', FiscalYear: '2016', ProductSN: String(productSN), OrderBy: 'Manufacturer' })
      .then(r => setApiManufacturers(r?.data?.Data || [])).catch(() => {});

    const p8 = RCD_WebApi.getItemBySupplier({ ModeCode: 'HPR', FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => setApiSuppliers(r?.data?.Data || [])).catch(() => {});

    const p9 = RCD_WebApi.getItemCountry({ ModeCode: 'HPR', FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => setApiCountries(r?.data?.Data || [])).catch(() => {});

    const p10 = MainDashboard_WebApi.getReceiveTrend({ ModeCode: 'HPR', EnvironmentCode: 'CNPH', ProductSN: String(productSN) })
      .then(r => setApiReceived(r?.data?.Data || [])).catch(() => {});

    const p11 = OIH_WebApi.getItemDistributionHub2Facility({ ModeCode: 'HPR', PageSize: 100, Page: 1, ProductSN: String(productSN) })
      .then(r => setApiIssued(r?.data?.Data || [])).catch(() => {});

    const p12 = POD_WebApi.getItemFundingSourceAndProcurer({ ModeCode: 'HPR', ProductSN: String(productSN) })
      .then(r => setApiFunding(r?.data?.Data || [])).catch(() => {});

    const p13 = POD_WebApi.getItemProcurer({ ModeCode: 'HPR', FiscalYear: '2016', ProductSN: String(productSN) })
      .then(r => setApiProcurer(r?.data?.Data || [])).catch(() => {});

    const p14 = OIH_WebApi.getDistributionByFacilityType({ ModeCode: 'HPR', ProductSN: String(productSN) })
      .then(r => setApiFacilityDist(r?.data?.Data || [])).catch(() => {});

    const p15 = OIH_WebApi.getDistributionByOwnershipType({ ModeCode: 'HPR', ProductSN: String(productSN) })
      .then(r => setApiOwnershipDist(r?.data?.Data || [])).catch(() => {});

    const p16 = SS_WebApi.getSOHByRegion({ ModeCode: 'HPR', ProductSN: String(productSN) })
      .then(r => setApiRegionDist(r?.data?.Data || [])).catch(() => {});

    const p17 = OIDRCD_WebApi.getByDateIU_MostRecentIssueReceive({ ModeCode: 'hpr', ProductSN: String(productSN), From: fromDash, To: todayDash })
      .then(r => setApiBinCard(r?.data?.Data || [])).catch(() => {});

    await Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17]);
    setLoading(false);
  }, [productSN, currentDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const productPOs = useMemo(
    () => {
      if (apiPoRc.length > 0) {
        return apiPoRc.map((r) => {
          const ordered = Number(r.OrderQuantity || r.OrderedQuantity || 0);
          const delivered = Number(r.DeliveredQuantity || r.QuantityReceived || 0);
          return { ...r, deliveryProgress: ordered > 0 ? (delivered / ordered) * 100 : 0 };
        });
      }
      return purchaseOrders.filter((row) => row.ProductCN === productName);
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
  const totalValue = productReceives.reduce((sum, row) => sum + (row.AmountReceivedBirr || 0), 0);
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
    const expiryKey = sampleKeys.find(k => /Expir|Near|Neary|Below/i.test(k)) || sampleKeys[2];
    return apiExpiryBkdn.slice(0, 12).map((r) => ({
      label: String(r[labelKey] || ''),
      segments: [
        { label: 'SOH', value: Number(r[sohKey]) || 0 },
        { label: 'Near Expiry', value: Number(r[expiryKey]) || 0 },
      ].filter(s => s.value > 0),
    }));
  }, [apiExpiryBkdn]);

  const daysOutChart = useMemo(() => {
    if (apiDaysOos.length === 0) return [];
    const sampleKeys = Object.keys(apiDaysOos[0]);
    const labelKey = sampleKeys.find(k => /Environment|Site|Hub/i.test(k)) || sampleKeys[0];
    const valKey = sampleKeys.find(k => /Days|Percent|Value|Count|Pct/i.test(k)) || sampleKeys[1];
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
      const segKeys = sampleKeys.filter(k => k !== envKey && k !== 'RowNumber' && typeof apiPipeline[0][k] === 'number');
      return apiPipeline.slice(0, 20).map((r) => ({
        label: String(r[envKey] || ''),
        segments: segKeys.map(k => ({ label: k, value: Number(r[k]) || 0 })).filter(s => s.value > 0),
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
        { label: 'Issued', value: Number(issuedKey ? r[issuedKey] : 0) || 0, color: '#14B8A6' },
        { label: 'Reserved', value: Number(reservedKey ? r[reservedKey] : 0) || 0, color: '#A5D8DB' },
        { label: 'Soh', value: Number(sohKey ? r[sohKey] : 0) || 0, color: '#61A582' },
        { label: 'Expired', value: Number(expiredKey ? r[expiredKey] : 0) || 0, color: '#1A3644' },
        { label: 'Damaged', value: Number(damagedKey ? r[damagedKey] : 0) || 0, color: '#FCD5B5' },
        { label: 'Suspended', value: Number(suspendedKey ? r[suspendedKey] : 0) || 0, color: '#E65100' },
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
      return apiManufacturers.map((r) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: valKey ? Number(r[valKey]) || 0 : 1,
        share: total > 0 ? `${((Number(r[valKey]) / total) * 100).toFixed(1)}%` : '0%',
      })).filter((r) => r.value > 0);
    }
    return groupBySum(productReceives, 'Manufacturer', 'AmountReceivedBirr').map((row) => ({
      ...row,
      share: `${safePercent(row.value, totalValue).toFixed(1)}%`,
    }));
  }, [apiManufacturers, productReceives, totalValue]);

  const supplierRows = useMemo(() => {
    if (apiSuppliers.length > 0) {
      const sampleKeys = Object.keys(apiSuppliers[0]);
      const labelKey = sampleKeys.find(k => /Supplier|Donor|Name|Agent/i.test(k)) || sampleKeys[0];
      const valKey = sampleKeys.find(k => /Birr|Amount|Value|ETB|Total|Quantity/i.test(k)) || sampleKeys.find(k => typeof apiSuppliers[0][k] === 'number');
      const total = apiSuppliers.reduce((s, r) => s + (valKey ? Number(r[valKey]) || 0 : 0), 0);
      return apiSuppliers.map((r) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: valKey ? Number(r[valKey]) || 0 : 1,
        share: total > 0 ? `${((Number(r[valKey]) / total) * 100).toFixed(1)}%` : '0%',
      })).filter((r) => r.value > 0);
    }
    return groupBySum(productPOs, 'Donor', 'OrderQuantity').map((row) => ({
      ...row,
      share: `${safePercent(row.value, totalPO).toFixed(1)}%`,
    }));
  }, [apiSuppliers, productPOs, totalPO]);

  const countryRows = useMemo(() => {
    if (apiCountries.length > 0) {
      const sampleKeys = Object.keys(apiCountries[0]);
      const labelKey = sampleKeys.find(k => /Country|Origin/i.test(k)) || sampleKeys[0];
      const valKey = sampleKeys.find(k => /Birr|Amount|Value|ETB|Total|Quantity/i.test(k)) || sampleKeys.find(k => typeof apiCountries[0][k] === 'number');
      const total = apiCountries.reduce((s, r) => s + (valKey ? Number(r[valKey]) || 0 : 0), 0);
      return apiCountries.map((r) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: valKey ? Number(r[valKey]) || 0 : 1,
        share: total > 0 ? `${((Number(r[valKey]) / total) * 100).toFixed(1)}%` : '0%',
      })).filter((r) => r.value > 0);
    }
    return groupBySum(productReceives, 'Country', 'AmountReceivedBirr').map((row) => ({
      ...row,
      share: `${safePercent(row.value, totalValue).toFixed(1)}%`,
    }));
  }, [apiCountries, productReceives, totalValue]);

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
    const r = apiFacilityDist[0];
    const keys = Object.keys(r).filter(k => k !== 'RowNumber' && typeof r[k] === 'number');
    return keys.map((k, i) => ({
      label: k,
      value: Number(r[k]) || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })).filter(item => item.value > 0);
  }, [apiFacilityDist]);

  const ownershipDistData = useMemo(() => {
    if (apiOwnershipDist.length === 0) return [];
    const sampleKeys = Object.keys(apiOwnershipDist[0]);
    const labelKey = sampleKeys.find(k => /Ownership|Type|Owner/i.test(k)) || sampleKeys.find(k => typeof apiOwnershipDist[0][k] === 'string');
    const valKey = sampleKeys.find(k => /Birr|Amount|Value|Count|Total|ETB/i.test(k)) || sampleKeys.find(k => typeof apiOwnershipDist[0][k] === 'number');
    if (labelKey && valKey) {
      return apiOwnershipDist.map((r, i) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: Number(r[valKey]) || 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })).filter(r => r.value > 0);
    }
    return [];
  }, [apiOwnershipDist]);

  const regionDistData = useMemo(() => {
    if (apiRegionDist.length === 0) return [];
    const sampleKeys = Object.keys(apiRegionDist[0]);
    const labelKey = sampleKeys.find(k => /Region|Environment|Site|Hub/i.test(k)) || sampleKeys.find(k => typeof apiRegionDist[0][k] === 'string');
    const valKey = sampleKeys.find(k => /Birr|Amount|Value|SOH|Count|Total|ETB/i.test(k)) || sampleKeys.find(k => typeof apiRegionDist[0][k] === 'number');
    if (labelKey && valKey) {
      return apiRegionDist.map((r, i) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: Number(r[valKey]) || 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })).filter(r => r.value > 0);
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
    return apiIssued.slice(0, 20).map((r, i) => ({
      id: i,
      date: String(r[dateKey] || ''),
      region: String(r[regionKey] || ''),
      facility: '',
      quantity: formatNumber(Number(r[qtyKey]) || 0),
      invoice: String(r[invKey] || ''),
      distributor: '',
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
              className="inline-flex items-center gap-2 text-body-md font-bold text-primary hover:text-primary-hover"
            >
              <i className="fa-solid fa-arrow-left" />
              Back to {programName}
            </button>
          </div>
          <OrgToggle value={activeOrg} onChange={setActiveOrg} />
        </div>
      </div>

      <section id="pd-overview">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] items-stretch gap-4">
          <NationalMosBelowEop stockRow={apiNationalMos || stockRow} />
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
          </div>
        </section>

      <section id="pd-stock-status">
        <StockStatusTable stockRow={stockRow} />
      </section>

      <section id="pd-charts">
        <div className="grid grid-cols-[minmax(0,1fr)_330px] gap-x-5 gap-y-5">
        <DetailChartPanel title="Months Of Stock">
          <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">
            No data
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Funding Source">
          <div className="flex h-64 items-center">
            {fundingChart.length > 0 ? (
              <PieChart data={fundingChart} totalLabel="Funding source" />
            ) : (
              <div className="text-body-sm text-on-surface-variant">No data</div>
            )}
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Stock Utilization">
          {stockUtilData.length > 0 ? (
            <ProgramStackedBarChart data={stockUtilData} normalized yLabel="%" height={220} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Procurement Agents">
          <div className="flex items-center justify-center py-6">
            <div className="w-[380px]">
              {procurerChart.length > 0 ? (
                <PieChart data={procurerChart} totalLabel="Procurement agents" />
              ) : (
                <div className="text-center text-body-sm text-on-surface-variant py-4">No data</div>
              )}
            </div>
          </div>
        </DetailChartPanel>

        <DetailChartPanel title="Pipeline">
          {pipelineHubData.length > 0 ? (
            <ProgramStackedBarChart data={pipelineHubData} normalized yLabel="%" height={220} yTicks={[0, 10, 20, 30, 40, 50, 60, 70, 80]} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Facility Type">
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

        <DetailChartPanel title="Expiry Breakdown in Qty">
          {expiryChart.length > 0 ? (
            <ProgramStackedBarChart data={expiryChart} height={240} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Ownership Type">
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

        <DetailChartPanel title="Days Out of Stock in %">
          {daysOutChart.length > 0 ? (
            <ProgramBarChart data={daysOutChart} valueFormatter={(value) => `${value.toFixed(0)}%`} />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>

        <DetailChartPanel title="Distribution by Region">
          {regionDistData.length > 0 ? (
            <PieChart data={regionDistData} totalLabel="Region distribution" />
          ) : (
            <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">No data</div>
          )}
        </DetailChartPanel>
      </div>
      </section>

      <section id="pd-po">
        <ProgramPanel title="Purchase Order/Incoming Shipments" subtitle={`${productPOs.length} purchase order records`}>
          <PurchaseOrderTable rows={productPOs} />
        </ProgramPanel>
      </section>

      <section id="pd-bin-card">
        <ProgramPanel title="Bin Card" subtitle="Stock movement history">
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

      <section id="pd-manufacturers">
        <EmptyDataTable
          title="Manufacturers"
          subtitle={`${manufacturerRows.length} source records`}
          rows={manufacturerRows}
          columns={[
            { key: 'label', label: 'Manufacturer' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>

      <section id="pd-supplier">
        <EmptyDataTable
          title="Supplier"
          rows={supplierRows}
          columns={[
            { key: 'label', label: 'Supplier' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>

      <section id="pd-country">
        <EmptyDataTable
          title="Country"
          rows={countryRows}
          columns={[
            { key: 'label', label: 'Country' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
        />
      </section>

      <section id="pd-received">
        <ProgramPanel title="Received" subtitle={`${productReceives.length} months of data`}>
          <RecentReceivesTable rows={productReceives} />
        </ProgramPanel>
      </section>

      <section id="pd-issued">
        <ProgramPanel title="Issued Data: Hub to Facility" subtitle={`${issuedRows.length} records`}>
          <BaseTable
            columns={[
              { key: 'date', label: 'Date' },
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
    </div>
  );
}

export default ProgramItemDetail;