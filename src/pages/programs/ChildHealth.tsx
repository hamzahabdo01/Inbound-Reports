import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import KPICard from '../../components/KPICard';
import ProgramFilters from '../../components/program/ProgramFilters';
import ProgramPanel from '../../components/program/ProgramPanel';
import ProgramChartRow from '../../components/program/ProgramChartRow';
import SectionNavigator from '../../components/SectionNavigator';
import NationalStockTable from '../../components/program/NationalStockTable';
import HubHeatmap from '../../components/program/HubHeatmap';
import ProgramBarChart from '../../components/program/ProgramBarChart';
import ProgramStackedBarChart from '../../components/program/ProgramStackedBarChart';
import BaseTable from '../../components/BaseTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PurchaseOrderTable from '../../components/program/PurchaseOrderTable';
import RecentReceivesTable from '../../components/program/RecentReceivesTable';
import IconButton from '../../components/IconButton';
import ProgramItemDetail from '../../components/program/ProgramItemDetail';
import { SS_WebApi, OIH_WebApi, POD_WebApi, POHRIHRCH_WebApi, RCD_WebApi, MainDashboard_WebApi, IUBVIUI_WebApi, FR_WebApi } from '../../api/fanos.ts';

const formatCompact = (v) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
const formatNumber = (v) => new Intl.NumberFormat('en').format(v || 0);

function includesQuery(row, query) {
  if (!query.trim()) return true;
  const lowered = query.toLowerCase();
  return Object.values(row).some((v) => String(v || '').toLowerCase().includes(lowered));
}

// ── Data processing helpers (shared by fetchData and individual refresh functions) ──
function processStockRows(apiStock) {
  if (!apiStock.length) return [];
  const sampleKeys = Object.keys(apiStock[0]);
  const productCNKey = sampleKeys.find((k) => /^ProductCN$/i.test(k))
    || sampleKeys.find((k) => /^ItemName$/i.test(k))
    || sampleKeys.find((k) => /^ProductName$/i.test(k))
    || 'ProductCN';
  const sohKey = sampleKeys.find((k) => /^SOH|StockOnHand|CurrentStock/i.test(k)) || 'SOH';
  const amcKey = sampleKeys.find((k) => /^AMC|AverageMonthlyConsumption/i.test(k)) || 'AMC';
  const poKey = sampleKeys.find((k) => /^QuantityPurchaseOrder|QuantityReceived|Planned|OrderQuantity/i.test(k)) || 'QuantityPurchaseOrder';
  const ssKey = sampleKeys.find((k) => /^SS|StockStatus|Status/i.test(k));
  const mosKey = sampleKeys.find((k) => /^MOS|MonthOfStock/i.test(k));
  const minKey = sampleKeys.find((k) => /^Min/i.test(k));
  const maxKey = sampleKeys.find((k) => /^Max/i.test(k));
  const sohAmtKey = sampleKeys.find((k) => /SOHAmtBirr/i.test(k));
  const expiredAmtKey = sampleKeys.find((k) => /ExpiredAmtBirr/i.test(k));
  const issuedAmtKey = sampleKeys.find((k) => /IssuedAmtBirr/i.test(k));

  return apiStock.map((r) => {
    const soh = Number(r[sohKey]) || 0;
    const amc = Number(r[amcKey]) || 0;
    const mos = mosKey ? (Number(r[mosKey]) || 0) : (amc > 0 ? soh / amc : 0);
    const ss = ssKey ? String(r[ssKey] || '') : (soh > 0 ? (amc > 0 && soh / amc < 3 ? 'Below EOP' : 'Normal') : 'Stocked Out');
    return {
      ProductCN: String(r[productCNKey] || ''),
      SS: ss,
      SOH: soh,
      AMC: amc,
      MOS: mos,
      QuantityPurchaseOrder: Number(r[poKey]) || 0,
      GIT: 0,
      Min: minKey ? Number(r[minKey]) || 0 : 0,
      Max: maxKey ? Number(r[maxKey]) || 0 : 0,
      SOHAmtBirr: sohAmtKey ? Number(r[sohAmtKey]) || 0 : 0,
      ExpiredAmtBirr: expiredAmtKey ? Number(r[expiredAmtKey]) || 0 : 0,
      IssuedAmtBirr: issuedAmtKey ? Number(r[issuedAmtKey]) || 0 : 0,
    };
  });
}

function processHubData(hubSoh) {
  if (!hubSoh.length) return null;
  const productSet = new Set<string>();
  const siteSet = new Set<string>();
  const siteProductMap: any = {};
  const ssMap: any = {};
  hubSoh.forEach((r) => {
    const site = (r.Environment || '').trim();
    const product = (r.ItemName || r.ProductCN || '').trim();
    if (!site || !product) return;
    siteSet.add(site);
    productSet.add(product);
    if (!siteProductMap[site]) siteProductMap[site] = {};
    siteProductMap[site][product] = Number(r.SOH) || 0;
    if (!ssMap[site]) ssMap[site] = {};
    ssMap[site][product] = String(r.SS || 'Normal');
  });
  const products = Array.from(productSet).sort();
  const sites = Array.from(siteSet).sort();
  const rows = sites.map((site) => {
    const row = { Site: site };
    products.forEach((p) => { row[p] = siteProductMap[site]?.[p] || 0; });
    return row;
  });
  return { products, rows, statusMap: ssMap };
}

function processPurchaseOrders(data) {
  if (!data.length) return [];
  const sampleKeys = Object.keys(data[0]);
  const poKey = sampleKeys.find((k) => /^PurchaseOrderNumber|^PONumber/i.test(k))
    || sampleKeys.find((k) => /^PO_Number/i.test(k))
    || 'PurchaseOrderNumber';
  const productKey = sampleKeys.find((k) => /^ProductCN/i.test(k))
    || sampleKeys.find((k) => /^ItemName|^ProductName/i.test(k))
    || 'ProductCN';
  const donorKey = sampleKeys.find((k) => /^Donor|^FundingSource|^Source/i.test(k))
    || 'Donor';
  const orderedKey = sampleKeys.find((k) => /^OrderQuantity|^OrderedQuantity|^QuantityOrdered/i.test(k))
    || 'OrderQuantity';
  const nextDelKey = sampleKeys.find((k) => /^NextDeliveryQuantity|^NextDelivery|^QuantityToReceive/i.test(k))
    || 'NextDeliveryQuantity';
  const deliveredKey = sampleKeys.find((k) => /^DeliveredQuantity|^QuantityReceived|^ReceivedQuantity/i.test(k))
    || 'DeliveredQuantity';

  return data.map((r) => {
    const ordered = Number(r[orderedKey]) || 0;
    const delivered = Number(r[deliveredKey]) || 0;
    const progress = ordered > 0 ? (delivered / ordered) * 100 : 0;
    return {
      PurchaseOrderNumber: String(r[poKey] || ''),
      ProductCN: String(r[productKey] || ''),
      Donor: String(r[donorKey] || ''),
      OrderQuantity: ordered,
      NextDeliveryQuantity: Number(r[nextDelKey]) || 0,
      DeliveredQuantity: delivered,
      deliveryProgress: progress,
    };
  });
}

function processIssuedItems(data) {
  return (data || []).map((r, i) => ({
    id: i,
    item: String(r.ItemName || r.ProductCN || ''),
    hub: String(r.Hub || r.Environment || ''),
    quantity: Number(r.Quantity) || Number(r.IssuedQuantity) || 0,
    invoice: String(r.InvoiceNo || r.InvoiceNumber || ''),
    date: String(r.FullDate || r.Date || ''),
    region: String(r.Region || r.RegionZoneWoreda || ''),
    amount: Number(r.AmountBirr) || Number(r.AmountReceivedBirr) || 0,
  }));
}

function processOrderFillRate(data) {
  if (!data.length) return [];
  const sampleKeys = Object.keys(data[0]);
  const productKey = sampleKeys.find((k) => /^ProductCN/i.test(k))
    || sampleKeys.find((k) => /^ProductName|^ItemName/i.test(k))
    || 'ProductCN';
  const requestedKey = sampleKeys.find((k) => /^Requested|^QuantityOrdered|^OrderQuantity/i.test(k)) || 'Requested';
  const issuedKey = sampleKeys.find((k) => /^Issued|^QuantityIssued|^IssuedQuantity/i.test(k)) || 'Issued';
  const cofrKey = sampleKeys.find((k) => /^COFR/i.test(k)) || 'COFR';
  const hofrKey = sampleKeys.find((k) => /^HOFR/i.test(k)) || 'HOFR';

  return data.map((r) => ({
    ProductCN: String(r[productKey] || ''),
    Requested: Number(r[requestedKey]) || 0,
    Issued: Number(r[issuedKey]) || 0,
    COFR: Number(r[cofrKey]) || 0,
    HOFR: Number(r[hofrKey]) || 0,
  }));
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

function ChartRowSkeleton() {
  return (
    <div className="flex gap-5 animate-pulse">
      <div className="flex-1 bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <div className="space-y-1.5">
            <div className="h-4 bg-surface-container-high rounded w-44" />
            <div className="h-3 bg-surface-container-high rounded w-60" />
          </div>
          <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
        </div>
        <div className="p-5 flex items-end gap-2" style={{ height: 200 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 bg-surface-container-high rounded-t" style={{ height: `${30 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
      <div className="flex-1 bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <div className="space-y-1.5">
            <div className="h-4 bg-surface-container-high rounded w-40" />
            <div className="h-3 bg-surface-container-high rounded w-36" />
          </div>
          <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
        </div>
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="w-24 h-24 bg-surface-container-high rounded-full" />
        </div>
      </div>
    </div>
  );
}

const CH_SECTIONS = [
  { id: 'ch-kpis',         label: 'Overview' },
  { id: 'ch-stock',        label: 'Stock Status' },
  { id: 'ch-hubs',         label: 'Hub Breakdown' },
  { id: 'ch-procurement',  label: 'Procurement' },
  { id: 'ch-po',           label: 'Purchase Orders' },
  { id: 'ch-receives',     label: 'Recent Receives' },
  { id: 'ch-distribution', label: 'Distribution' },
  { id: 'ch-issued',       label: 'Issued' },
  { id: 'ch-pipeline',     label: 'Pipeline' },
  { id: 'ch-utilization',  label: 'Stock Utilization' },
  { id: 'ch-mos',          label: 'National MOS' },
  { id: 'ch-manufacturers',label: 'Manufacturers' },
  { id: 'ch-countries',    label: 'Countries' },
];

function ChildHealth() {
  const [query,         setQuery]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [siteFilter,    setSiteFilter]    = useState('All');
  const [hubTypeFilter, setHubTypeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('2016');
  const [selectedProduct, setSelectedProduct] = useState('');

  // ── API state ──────────────────────────────────────────────────────────
  const [apiStockRows, setApiStockRows] = useState([]);
  const [apiDistribution, setApiDistribution] = useState([]);
  const [apiOwnership, setApiOwnership] = useState([]);
  const [apiPipeline, setApiPipeline] = useState([]);
  const [apiMosData, setApiMosData] = useState([]);
  const [apiManufacturers, setApiManufacturers] = useState([]);
  const [apiCountries, setApiCountries] = useState([]);
  const [apiRecentReceives, setApiRecentReceives] = useState([]);
  const [apiHubData, setApiHubData] = useState(null);
  const [apiIssuedItems, setApiIssuedItems] = useState([]);
  const [apiStockUtilization, setApiStockUtilization] = useState([]);
  const [apiOrderFillRate, setApiOrderFillRate] = useState([]);
  const [apiPurchaseOrders, setApiPurchaseOrders] = useState([]);
  const [poTab, setPoTab] = useState('Vitas');
  const [issuedFromDate, setIssuedFromDate] = useState('');
  const [issuedToDate, setIssuedToDate] = useState('');
  const [mosSite, setMosSite] = useState('');
  const [loadingOwnership, setLoadingOwnership] = useState(false);
  const [apiProcurerItems, setApiProcurerItems] = useState([]);
  const [apiProcurerChart, setApiProcurerChart] = useState([]);
  const [loadingProcurer, setLoadingProcurer] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [error, setError] = useState(null);
  const [ownershipYear, setOwnershipYear] = useState('2016');
  const [apiFundingSource, setApiFundingSource] = useState([]);
  const [loadingFunding, setLoadingFunding] = useState(false);
  const [fundingYear, setFundingYear] = useState('2016');
  const [refreshing, setRefreshing] = useState({});

  const PROGRAM_CODE = 'Child Health';

  const fetchProcurerChart = useCallback(async (year) => {
    setLoadingProcurer(true);
    try {
      const res = await POD_WebApi.getItemProcurer({
        ModeCode: 'HPR', ProgramCode: 'CH', FiscalYear: year,
      })
      setApiProcurerChart(res?.data?.Data || []);
    } catch {
      setApiProcurerChart([]);
    } finally {
      setLoadingProcurer(false);
    }
  }, []);

  // ── Tier 1: Critical data (fires immediately) ──────────────────────────
  const fetchTier1 = useCallback(async () => {
    setError(null);
    try {
      const res = await IUBVIUI_WebApi.getProgramProducts({
        ModeCode: 'HPR', EnvironmentTypeCode: 'PFSAH', OrderBy: 'ProductCN', ProgramCode: 'CH',
      });
      setApiStockRows(processStockRows(res?.data?.Data || []));
    } catch (err) {
      setError(err.message || 'Failed to load stock data');
    } finally {
      setPageReady(true);
    }
  }, []);

  // ── Tier 2: Deferred data (fires after 300ms, staggered by 50ms per section) ──
  const [sectionLoaded, setSectionLoaded] = useState({});
  const markLoaded = useCallback((key) => {
    setSectionLoaded(prev => ({ ...prev, [key]: true }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {

      const stagger = (ms, fn) => setTimeout(fn, ms);

      // Hub — 0ms
      stagger(0, () => {
        SS_WebApi.getEnvironmentSOHByDate({
          ModeCode: 'HPR', EnvironmentGroupCode: 'HUB', ProgramCode: 'CH',
          OrderBy: 'Environment ASC', TransactionDate: '6/26/2026',
        }).then(res => {
          const d = res?.data?.Data || [];
          const result = processHubData(d);
          if (result) setApiHubData(result);
        }).catch(() => {}).finally(() => markLoaded('hub'));
      });

      // Procurement — 50ms
      stagger(50, () => {
        POD_WebApi.getItemProcurerPerItem({
          FiscalYear: '2016', ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiProcurerItems(d);
        }).catch(() => {}).finally(() => markLoaded('procurement'));
      });

      // Recent Receives — 100ms
      stagger(100, () => {
        MainDashboard_WebApi.getReceiveTrend({
          ModeCode: 'HPR', EnvironmentCode: 'CNPH', ProgramCode: 'CH',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiRecentReceives(d);
        }).catch(() => {}).finally(() => markLoaded('receives'));
      });

      // Distribution — 150ms
      stagger(150, () => {
        OIH_WebApi.getDistributionByFacilityTypePerItem({
          FiscalYear: '2016', ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiDistribution(d);
        }).catch(() => {}).finally(() => markLoaded('distribution'));
      });

      // Pipeline — 200ms
      stagger(200, () => {
        POHRIHRCH_WebApi.getCenterPipeline3({
          ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiPipeline(d);
        }).catch(() => {}).finally(() => markLoaded('pipeline'));
      });

      // Order Fill Rate — 250ms
      stagger(250, () => {
        FR_WebApi.getOrderFillRate({ ModeCode: 'HPR', ProgramCode: 'CH' }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiOrderFillRate(processOrderFillRate(d));
        }).catch(() => {}).finally(() => markLoaded('orderFillRate'));
      });

      // Stock Utilization — 300ms
      stagger(300, () => {
        SS_WebApi.getNationalstockutilization({
          ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiStockUtilization(d);
        }).catch(() => {}).finally(() => markLoaded('stockUtilization'));
      });

      // MOS — 350ms
      stagger(350, () => {
        SS_WebApi.getMOSShareBySite({
          ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN', EnvironmentGroupCode: 'HUB',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiMosData(d);
        }).catch(() => {}).finally(() => markLoaded('mos'));
      });

      // Manufacturers — 400ms
      stagger(400, () => {
        RCD_WebApi.getProgramManufacturer({
          ModeCode: 'HPR', FiscalYear: '2016', OrderBy: 'Manufacturer', ProgramCode: 'CH',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiManufacturers(d);
        }).catch(() => {}).finally(() => markLoaded('manufacturers'));
      });

      // Countries — 450ms
      stagger(450, () => {
        RCD_WebApi.getItemCountry({
          ModeCode: 'HPR', FiscalYear: '2016', ProgramCode: 'CH',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiCountries(d);
        }).catch(() => {}).finally(() => markLoaded('countries'));
      });

      // Issued — mark ready immediately (user-driven dates)
      markLoaded('issued');
    }, 300);
    return () => clearTimeout(timer);
  }, [markLoaded]);

  // Tier 1 fires immediately on mount
  useEffect(() => { fetchTier1(); }, [fetchTier1]);

  // ── Tier 2 chart fetches (staggered after their parent section API) ────
  useEffect(() => {
    const timer = setTimeout(() => fetchProcurerChart(yearFilter), 400);
    return () => clearTimeout(timer);
  }, [yearFilter, fetchProcurerChart]);

  const fetchOwnershipChart = useCallback(async (year) => {
    setLoadingOwnership(true);
    try {
      const res = await OIH_WebApi.getDistributionByOwnershipType({
        ModeCode: 'HPR', ProgramCode: 'CH', FiscalYear: year,
      });
      setApiOwnership(res?.data?.Data || []);
    } catch {
      setApiOwnership([]);
    } finally {
      setLoadingOwnership(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchOwnershipChart(ownershipYear), 550);
    return () => clearTimeout(timer);
  }, [ownershipYear, fetchOwnershipChart]);

  const fetchFundingChart = useCallback(async (year) => {
    setLoadingFunding(true);
    try {
      const res = await POD_WebApi.getItemFundingSourceAndProcurer({
        ModeCode: 'HPR', ProgramCode: 'CH', FiscalYear: year,
      });
      setApiFundingSource(res?.data?.Data || []);
    } catch {
      setApiFundingSource([]);
    } finally {
      setLoadingFunding(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchFundingChart(fundingYear), 600);
    return () => clearTimeout(timer);
  }, [fundingYear, fetchFundingChart]);

  const fetchIssuedItems = useCallback(async (from, to) => {
    if (!from || !to) return;
    try {
      const res = await OIH_WebApi.getItemDistributionHub2Facility({
        ModeCode: 'HPR', PageSize: 100, Page: 1, ProgramCode: 'CH', From: from, To: to,
      });
      setApiIssuedItems(processIssuedItems(res?.data?.Data || []));
    } catch {
      setApiIssuedItems([]);
    }
  }, []);

  useEffect(() => { fetchIssuedItems(issuedFromDate, issuedToDate) }, [issuedFromDate, issuedToDate, fetchIssuedItems]);

  // ── Individual refresh callbacks (one per section) ──────────────────────
  const withRefresh = (key, fn) => async (...args) => {
    setRefreshing((prev) => ({ ...prev, [key]: true }));
    try { await fn(...args); } catch { /* handled inside */ }
    setRefreshing((prev) => ({ ...prev, [key]: false }));
  };

  const refreshStock = withRefresh('stock', async () => {
    const res = await IUBVIUI_WebApi.getProgramProducts({
      ModeCode: 'HPR', EnvironmentTypeCode: 'PFSAH', OrderBy: 'ProductCN', ProgramCode: 'CH',
    });
    setApiStockRows(processStockRows(res?.data?.Data || []));
  });

  const refreshHub = withRefresh('hub', async () => {
    const res = await SS_WebApi.getEnvironmentSOHByDate({
      ModeCode: 'HPR', EnvironmentGroupCode: 'HUB', ProgramCode: 'CH',
      OrderBy: 'Environment ASC', TransactionDate: '6/26/2026',
    });
    const result = processHubData(res?.data?.Data || []);
    if (result) setApiHubData(result);
  });

  const refreshReceives = withRefresh('receives', async () => {
    const res = await MainDashboard_WebApi.getReceiveTrend({
      ModeCode: 'HPR', EnvironmentCode: 'CNPH', ProgramCode: 'CH',
    });
    setApiRecentReceives(res?.data?.Data || []);
  });

  const refreshDistribution = withRefresh('distribution', async () => {
    const res = await OIH_WebApi.getDistributionByFacilityTypePerItem({
      FiscalYear: '2016', ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
    });
    setApiDistribution(res?.data?.Data || []);
  });

  const refreshPipeline = withRefresh('pipeline', async () => {
    const res = await POHRIHRCH_WebApi.getCenterPipeline3({
      ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
    });
    setApiPipeline(res?.data?.Data || []);
  });

  const refreshMos = withRefresh('mos', async () => {
    const res = await SS_WebApi.getMOSShareBySite({
      ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN', EnvironmentGroupCode: 'HUB',
    });
    setApiMosData(res?.data?.Data || []);
  });

  const refreshManufacturers = withRefresh('manufacturers', async () => {
    const res = await RCD_WebApi.getProgramManufacturer({
      ModeCode: 'HPR', FiscalYear: '2016', OrderBy: 'Manufacturer', ProgramCode: 'CH',
    });
    setApiManufacturers(res?.data?.Data || []);
  });

  const refreshCountries = withRefresh('countries', async () => {
    const res = await RCD_WebApi.getItemCountry({
      ModeCode: 'HPR', FiscalYear: '2016', ProgramCode: 'CH',
    });
    setApiCountries(res?.data?.Data || []);
  });

  const refreshStockUtilization = withRefresh('stockUtilization', async () => {
    const res = await SS_WebApi.getNationalstockutilization({
      ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
    });
    setApiStockUtilization(res?.data?.Data || []);
  });

  const refreshOrderFillRate = withRefresh('orderFillRate', async () => {
    const res = await FR_WebApi.getOrderFillRate({
      ModeCode: 'HPR', ProgramCode: 'CH',
    });
    setApiOrderFillRate(processOrderFillRate(res?.data?.Data || []));
  });

  const refreshPurchaseOrders = withRefresh('purchaseOrders', async (tab) => {
    const currentTab = tab || poTab;
    if (currentTab === 'Vitas') {
      const res = await RCD_WebApi.getProgramPipeline({
        ModeCode: 'HPR', ProgramCode: 'CH',
      });
      setApiPurchaseOrders(processPurchaseOrders(res?.data?.Data || []));
    } else {
      const res = await RCD_WebApi.getSAPProgramPipeline({
        ModeCode: 'HPR', ProgramCode: 'CH',
      });
      setApiPurchaseOrders(processPurchaseOrders(res?.data?.Data || []));
    }
  });

  const refreshIssuedItems = withRefresh('issued', async () => {
    if (!issuedFromDate || !issuedToDate) return;
    const res = await OIH_WebApi.getItemDistributionHub2Facility({
      ModeCode: 'HPR', PageSize: 100, Page: 1, ProgramCode: 'CH', From: issuedFromDate, To: issuedToDate,
    });
    setApiIssuedItems(processIssuedItems(res?.data?.Data || []));
  });

  const refreshProcurer = withRefresh('procurer', async () => {
    const res = await POD_WebApi.getItemProcurerPerItem({
      FiscalYear: yearFilter, ModeCode: 'HPR', ProgramCode: 'CH', OrderBy: 'ProductCN',
    });
    setApiProcurerItems(res?.data?.Data || []);
  });

  const refreshProcurerChart = withRefresh('procurerChart', async () => {
    const res = await POD_WebApi.getItemProcurer({
      ModeCode: 'HPR', ProgramCode: 'CH', FiscalYear: yearFilter,
    });
    setApiProcurerChart(res?.data?.Data || []);
  });

  const refreshOwnershipChart = withRefresh('ownership', async () => {
    const res = await OIH_WebApi.getDistributionByOwnershipType({
      ModeCode: 'HPR', ProgramCode: 'CH', FiscalYear: ownershipYear,
    });
    setApiOwnership(res?.data?.Data || []);
  });

  const refreshFundingChart = withRefresh('funding', async () => {
    const res = await POD_WebApi.getItemFundingSourceAndProcurer({
      ModeCode: 'HPR', ProgramCode: 'CH', FiscalYear: fundingYear,
    });
    setApiFundingSource(res?.data?.Data || []);
  });

  // Fetch purchase orders on mount and when tab changes
  useEffect(() => {
    refreshPurchaseOrders(poTab).then(() => markLoaded('purchaseOrders'));
  }, [poTab]);

  // ── API data, no CSV fallback ────────────────────────────────────────────
  const stockRows = apiStockRows;
  const hubData = apiHubData || { products: [], rows: [] };
  const purchaseOrders = apiPurchaseOrders;
  const receives = apiRecentReceives;

  const products = useMemo(() => stockRows.map((r) => r.ProductCN).sort(), [stockRows]);

  const filteredStock = useMemo(() => (
    stockRows.filter((r) => (
      includesQuery(r, query) &&
      (!statusFilter  || r.SS        === statusFilter)  &&
      (!productFilter || r.ProductCN === productFilter)
    ))
  ), [stockRows, query, statusFilter, productFilter]);

  const filteredPOs = useMemo(() => (
    purchaseOrders.filter((r) => (
      includesQuery(r, query) &&
      (!productFilter || r.ProductCN === productFilter)
    ))
  ), [purchaseOrders, query, productFilter]);

  const filteredReceives = useMemo(() => (
    receives.filter((r) => (
      includesQuery(r, query) &&
      (!productFilter || r.ProductCN === productFilter)
    ))
  ), [receives, query, productFilter]);

  const focusedHubProducts = useMemo(() => {
    if (productFilter && hubData.products.includes(productFilter)) return [productFilter];
    return hubData.products;
  }, [hubData.products, productFilter]);

  const hubSites = useMemo(() => {
    const s = new Set<string>(hubData.rows.map((r: any) => r.Site?.trim()).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [hubData.rows]);

  const filteredHubRows = useMemo(() => {
    let result = hubData.rows;
    if (siteFilter !== 'All')    result = result.filter((r) => r.Site?.trim() === siteFilter);
    if (hubTypeFilter !== 'All') result = result.filter((r) => {
      const site = r.Site?.trim() || '';
      if (hubTypeFilter === 'Hub')    return  site.includes('Hub');
      if (hubTypeFilter === 'Center') return !site.includes('Hub');
      return true;
    });
    return result;
  }, [hubData.rows, siteFilter, hubTypeFilter]);

  const kpis = useMemo(() => ({
    totalSoh:       stockRows.reduce((s, r) => s + r.SOH, 0),
    sohAmt:         stockRows.reduce((s, r) => s + (r.SOHAmtBirr || 0), 0),
    issuedAmt:      stockRows.reduce((s, r) => s + (r.IssuedAmtBirr || 0), 0),
    expiredAmt:     stockRows.reduce((s, r) => s + (r.ExpiredAmtBirr || 0), 0),
    nearExpiryAmt:  stockRows.filter((r) => r.MOS > 0 && r.MOS < 3)
                      .reduce((s, r) => s + (r.SOHAmtBirr || 0), 0),
    atRisk:         stockRows.filter((r) => r.SS === 'Below EOP' || r.SS === 'Stocked Out' || r.SS === 'Excess').length,
    git:            stockRows.reduce((s, r) => s + r.GIT, 0),
    poQuantity:     purchaseOrders.reduce((s, r) => s + r.NextDeliveryQuantity, 0),
    receivedValue:  receives.reduce((s, r) => s + r.AmountReceivedBirr, 0),
  }), [stockRows, purchaseOrders, receives]);

  const donorChart = useMemo(() => {
    const data = apiProcurerChart.length > 0 ? apiProcurerChart : [];
    if (data.length === 0) return [];

    const sampleKeys = Object.keys(data[0]).filter((k) => k !== 'RowNumber');

    // find the Birr/amount field
    const birrKey = sampleKeys.find((k) => /birr|amount/i.test(k));
    // find the procurer label field
    const labelKey = sampleKeys.find((k) => /^Procurer/i.test(k))
      || sampleKeys.find((k) => /Agent|Donor|Name/i.test(k))
      || sampleKeys.find((k) => typeof data[0][k] === 'string')
      || sampleKeys[0];

    if (typeof data[0][labelKey] === 'string') {
      const map: Record<string, number> = {};
      data.forEach((r: any) => {
        const l = r[labelKey] || 'Unknown';
        map[l] = (map[l] || 0) + (birrKey ? Number(r[birrKey]) || 0 : 1);
      });
      return Object.entries(map)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    }

    return [];
  }, [apiProcurerChart]);

  const procurementByAgent = useMemo(() => {
    const data = apiProcurerItems.length > 0 ? apiProcurerItems : [];
    const procurerKeys = [...new Set(data.flatMap((r) => Object.keys(r).filter((k) => k !== 'ProductCN' && k !== 'RowNumber' && typeof r[k] === 'number')))];

    return data.map((r) => ({
      label: r.ProductCN,
      segments: procurerKeys
        .map((k) => ({ label: k, value: r[k] || 0 }))
        .filter((s) => s.value > 0),
    })).filter((item) => item.segments.length > 0);
  }, [apiProcurerItems]);

  const itemDistribution = useMemo(() => {
    const data = apiDistribution.length > 0 ? apiDistribution : [];
    return data.map((r) => ({
      label: r.ProductCN,
      segments: ['HealthCenter', 'Hospital', 'Woreda', 'Others']
        .map((t) => ({ label: t, value: r[t] || 0 }))
        .filter((s) => s.value > 0),
    }));
  }, [apiDistribution]);

  const pipelineByDonor = useMemo(() => {
    const data = apiPipeline.length > 0 ? apiPipeline : [];
    const indicatorKeys = ['PurchaseOrdered', 'BelowMax', 'AboveMax', 'ProjectedDaysOutOfStock', 'InvoicedM'];

    return data.map((r) => ({
      label: r.ProductCN,
      segments: indicatorKeys
        .filter((k) => k in r)
        .map((k) => ({ label: k, value: Number(r[k]) || 0 }))
        .filter((s) => s.value > 0),
    })).filter((item) => item.segments.length > 0);
  }, [apiPipeline]);

  const orderFillRateRows = useMemo(() => {
    const data = apiOrderFillRate;
    return data.slice(0, 14).map((r) => ({
      ProductCN: r.ProductCN,
      COFR: r.COFR,
      HOFR: r.HOFR,
    }));
  }, [apiOrderFillRate]);

  const [fillRateTooltip, setFillRateTooltip] = useState(null);
  const fillRateRootRef = useRef(null);

  const stockUtilization = useMemo(() => {
    const data = apiStockUtilization.length > 0 ? apiStockUtilization : filteredStock;
    return data.slice(0, 14).map((row) => ({
      label: row.ProductCN || row.ProductName || 'Unknown',
      segments: [
        { label: 'SOHAmtBirr',     value: row.SOHAmtBirr || 0 },
        { label: 'IssuedAmtBirr',  value: row.IssuedAmtBirr || 0 },
        { label: 'ExpiredAmtBirr', value: row.ExpiredAmtBirr || 0 },
      ].filter((s) => s.value > 0),
    })).filter((item) => item.segments.length > 0);
  }, [apiStockUtilization, filteredStock]);

  const mosSiteLabels = {
    ADPH: 'Adama',
    BDPH: 'Bahir Dar',
    CNPH: 'Home Office',
    DSPH: 'Dessie',
    DDPH: 'Dire Dawa',
    GNPH: 'Gondar',
    AAPH: 'Addis Ababa',
    HWPH: 'Hawassa',
    JMPH: 'Jimma',
    MKPH: 'Mekele',
    NBPH: 'Negele Borena',
    NKPH: 'Nekemte',
    SHPH: 'Shire',
    GAPH: 'Gambella',
    ASPH: 'Assosa',
    AMPH: 'Arba Minch',
    SEPH: 'Semera',
    JGPH: 'Jigjiga',
    AA2PH: 'Addis Ababa [2]',
    KDPH: 'Kebri Dehar',
  };

  const mosPhKeys = useMemo(() => {
    const sample = apiMosData[0];
    if (!sample) return [];
    return Object.keys(sample).filter((k) => /ph$/i.test(k) && typeof sample[k] === 'number').sort();
  }, [apiMosData]);

  const mosSiteOptions = useMemo(() =>
    mosPhKeys.map((k) => ({
      value: k,
      label: mosSiteLabels[k.toUpperCase()] || k.replace(/ph$/i, '').toUpperCase(),
    })),
  [mosPhKeys]);

  // default to first ph key once data loads
  useEffect(() => {
    if (!mosSite && mosPhKeys.length > 0) setMosSite(mosPhKeys[0]);
  }, [mosPhKeys, mosSite]);

  const mosChart = useMemo(() => {
    const data = apiMosData.length > 0 ? apiMosData : [];
    if (data.length === 0 || !mosSite) return [];

    // group by ProductCN, pick the selected ph value
    const map: Record<string, number> = {};
    data.forEach((r: any) => {
      const label = r.ProductCN || r.ProductName || 'Unknown';
      const val = Number(r[mosSite]) || 0;
      if (!map[label] || val > map[label]) map[label] = val;
    });

    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [apiMosData, mosSite]);

  const ownershipChart = useMemo(() => {
    const data = apiOwnership.length > 0 ? apiOwnership : [];
    if (data.length === 0) return [];

    const ignore = new Set(['RowNumber', 'FiscalYear', 'ProductCN', 'ProductName', 'Total']);
    // find the ownership type label field (string field with type/owner names)
    const labelKey = Object.keys(data[0]).find((k) =>
      /ownership|ownertype|type|owner/i.test(k) && typeof data[0][k] === 'string'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'string' && !ignore.has(k)
    );
    // find the birr/amount field for the value
    const valueKey = Object.keys(data[0]).find((k) =>
      /birr|amount/i.test(k) && typeof data[0][k] === 'number'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'number' && !ignore.has(k)
    );

    if (labelKey && valueKey) {
      return data
        .map((r) => ({ label: String(r[labelKey]), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.value > 0);
    }

    return [];
  }, [apiOwnership]);

  const fundingChart = useMemo(() => {
    const data = apiFundingSource.length > 0 ? apiFundingSource : [];
    if (data.length === 0) return [];

    const ignore = new Set(['RowNumber', 'FiscalYear', 'ProductCN', 'Total']);
    // find donor/funding-source label field
    const labelKey = Object.keys(data[0]).find((k) =>
      /donor|funding|source|funder|procurer/i.test(k) && typeof data[0][k] === 'string'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'string' && !ignore.has(k)
    );
    // find the birr/amount field for the value
    const valueKey = Object.keys(data[0]).find((k) =>
      /birr|amount/i.test(k) && typeof data[0][k] === 'number'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'number' && !ignore.has(k)
    );

    if (labelKey && valueKey) {
      return data
        .map((r) => ({ label: String(r[labelKey]), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.value > 0);
    }

    return [];
  }, [apiFundingSource]);

  const manufacturerRows = useMemo(() => {
    const data = apiManufacturers;
    if (data.length === 0) return [];
    const sampleKeys = Object.keys(data[0]).filter((k) => k !== 'RowNumber');
    const birrKey = sampleKeys.find((k) => /birr|amount|value|etb/i.test(k));
    const labelKey = sampleKeys.find((k) => /^[Mm]anufacturer/i.test(k))
      || sampleKeys.find((k) => typeof data[0][k] === 'string')
      || sampleKeys[0];
    const total = data.reduce((s, r) => s + (birrKey ? Number(r[birrKey]) || 0 : 0), 0);
    return data
      .map((r) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: birrKey ? Number(r[birrKey]) || 0 : 1,
        share: total > 0 ? `${((Number(r[birrKey]) / total) * 100).toFixed(1)}%` : '0%',
      }))
      .filter((r) => r.value > 0);
  }, [apiManufacturers]);

  const countryRows = useMemo(() => {
    const data = apiCountries;
    if (data.length === 0) return [];
    const sampleKeys = Object.keys(data[0]).filter((k) => k !== 'RowNumber');
    const birrKey = sampleKeys.find((k) => /birr|amount|value|etb/i.test(k));
    const labelKey = sampleKeys.find((k) => /^[Cc]ountry/i.test(k))
      || sampleKeys.find((k) => typeof data[0][k] === 'string')
      || sampleKeys[0];
    const total = data.reduce((s, r) => s + (birrKey ? Number(r[birrKey]) || 0 : 0), 0);
    return data
      .map((r) => ({
        label: String(r[labelKey] || 'Unknown'),
        value: birrKey ? Number(r[birrKey]) || 0 : 1,
        share: total > 0 ? `${((Number(r[birrKey]) / total) * 100).toFixed(1)}%` : '0%',
      }))
      .filter((r) => r.value > 0);
  }, [apiCountries]);

  const leftChart = useMemo(() => {
    if (orderFillRateRows.length === 0) {
      return <div className="flex items-center justify-center text-on-surface-variant text-body-sm" style={{ height: 260 }}>No order fill rate data</div>;
    }
    return (
      <div className="px-4 pt-3 pb-2 select-none" ref={fillRateRootRef} style={{ position: 'relative' }}>
        <div className="flex gap-0 pl-2" style={{ position: 'relative' }}>
          <div className="flex-1 relative" style={{ height: 264 }}>
            {[0, 20, 40, 60, 80, 100].map((tick) => (
              <div key={tick} className="absolute left-0 right-0 border-t" style={{ bottom: `calc(24px + ${tick}%)`, borderColor: tick === 0 ? '#CFD8DC' : '#EAEEF0' }} />
            ))}
            <div className="absolute left-0 right-0 bottom-6 flex items-end gap-1" style={{ height: 200 }}>
              {orderFillRateRows.map((r) => {
                const cofrPct = Math.min(r.COFR * 100, 100);
                const hofrPct = Math.min(r.HOFR * 100, 100);
                return (
                  <div key={r.ProductCN} className="flex-1 min-w-0 flex flex-col items-center gap-0.5" style={{ height: '100%' }}>
                    <div className="w-full flex-1 flex flex-col justify-end items-center relative">
                      <div
                        className="w-[60%] rounded-t transition-all duration-200 cursor-crosshair"
                        style={{ height: `${Math.max(cofrPct, cofrPct > 0 ? 2 : 0)}%`, backgroundColor: '#4A9598' }}
                        onMouseEnter={(e) => {
                          const rect = fillRateRootRef.current?.getBoundingClientRect();
                          const barRect = e.currentTarget.getBoundingClientRect();
                          if (rect) setFillRateTooltip({ x: barRect.left - rect.left + barRect.width / 2, y: barRect.top - rect.top, label: r.ProductCN, metric: 'COFR', value: cofrPct, pct: `${cofrPct.toFixed(1)}%` });
                        }}
                        onMouseLeave={() => setFillRateTooltip(null)}
                      />
                    </div>
                    <div className="w-full flex-1 flex flex-col justify-end items-center relative">
                      <div
                        className="w-[60%] rounded-t transition-all duration-200 cursor-crosshair"
                        style={{ height: `${Math.max(hofrPct, hofrPct > 0 ? 2 : 0)}%`, backgroundColor: '#D97706' }}
                        onMouseEnter={(e) => {
                          const rect = fillRateRootRef.current?.getBoundingClientRect();
                          const barRect = e.currentTarget.getBoundingClientRect();
                          if (rect) setFillRateTooltip({ x: barRect.left - rect.left + barRect.width / 2, y: barRect.top - rect.top, label: r.ProductCN, metric: 'HOFR', value: hofrPct, pct: `${hofrPct.toFixed(1)}%` });
                        }}
                        onMouseLeave={() => setFillRateTooltip(null)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute left-0 right-0 bottom-0 flex gap-1" style={{ height: 24 }}>
              {orderFillRateRows.map((r) => (
                <div key={r.ProductCN} className="flex-1 min-w-0 flex items-end justify-center" style={{ height: 24 }}>
                  <p className="text-[9px] font-semibold text-on-surface-variant truncate w-full text-center leading-tight">{r.ProductCN}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-5 mt-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: '#4A9598' }} />COFR</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: '#D97706' }} />HOFR</span>
        </div>
        {fillRateTooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-[#00373B] text-white rounded-lg shadow-lg px-3 py-2 text-xs"
            style={{ left: Math.min(Math.max(fillRateTooltip.x - 80, 0), 500), top: Math.max(fillRateTooltip.y - 36, 0) }}
          >
            <div className="font-bold text-[#86BFC5] mb-1 truncate max-w-[200px]">{fillRateTooltip.label}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: fillRateTooltip.metric === 'COFR' ? '#4A9598' : '#D97706' }} />
              <span className="font-semibold">{fillRateTooltip.metric}:</span>
              <span>{fillRateTooltip.pct}</span>
            </div>
          </div>
        )}
      </div>
    );
  }, [orderFillRateRows, fillRateTooltip]);

  const hasFilters = Boolean(query.trim() || statusFilter || productFilter);
  const clearFilters = () => { setQuery(''); setStatusFilter(''); setProductFilter(''); };
  const selectedStockRow = useMemo(
    () => stockRows.find((row) => row.ProductCN === selectedProduct),
    [stockRows, selectedProduct],
  );

  if (error && !pageReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <i className="fa-solid fa-circle-exclamation text-2xl text-error" />
        </div>
        <h2 className="text-headline-sm font-bold text-on-surface">Failed to Load Data</h2>
        <p className="text-body-md text-on-surface-variant max-w-md">{error}</p>
        <button onClick={fetchTier1} className="px-4 py-2 bg-primary text-white rounded-lg text-body-md hover:bg-primary-hover transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (selectedProduct && selectedStockRow) {
    return (
      <ProgramItemDetail
        programName="Child Health"
        productName={selectedProduct}
        itemOptions={stockRows.map((row) => ({ label: row.ProductCN, status: row.SS }))}
        stockRow={selectedStockRow}
        purchaseOrders={purchaseOrders}
        recentReceives={receives}
        hubRows={hubData.rows}
        onBack={() => setSelectedProduct('')}
        onSelectItem={setSelectedProduct}
      />
    );
  }

  return (
    <div className="space-y-5">

      <SectionNavigator sections={CH_SECTIONS} />

      {/* ── Overview: KPI cards + filters ────────────────────────────────── */}
      <section id="ch-kpis" className="space-y-5">
        <div className="grid grid-cols-6 gap-3">
          <KPICard variant="detailed" icon="fa-boxes-stacked"        iconBg="bg-success/10"     iconColor="text-success"     label="SOH"       value="2.5M"                          subtitle={pageReady ? `${stockRows.length} SKUs` : '—'} />
          <KPICard variant="detailed" icon="fa-truck-ramp-box"       iconBg="bg-[#4A8EA5]/10"   iconColor="text-[#4A8EA5]"   label="Issued"    value="3.8M"                          subtitle="total issued" />
          <KPICard variant="detailed" icon="fa-layer-group"          iconBg="bg-surface-container" iconColor="text-primary" label="Planned"   value="966.4K"                        subtitle={pageReady ? `${purchaseOrders.length} PO lines` : '—'} />
          <KPICard variant="detailed" icon="fa-route"                iconBg="bg-success/10"     iconColor="text-success"     label="GIT"       value="0"                             subtitle="in transit" />
          <KPICard variant="detailed" icon="fa-circle-exclamation"   iconBg="bg-error/10"       iconColor="text-error"       label="Expired"   value="47.9K"                         subtitle="expired value" />
          <KPICard variant="detailed" icon="fa-clock-rotate-left"    iconBg="bg-warning/10"     iconColor="text-warning"     label="Near Exp." value="4.6K"                          subtitle="MOS &lt; 3 months" />
        </div>
        <ProgramFilters
          query={query}           onQueryChange={setQuery}
          status={statusFilter}   onStatusChange={setStatusFilter}
          product={productFilter} onProductChange={setProductFilter}
          products={products}
          hasFilters={hasFilters} onClear={clearFilters}
        />
      </section>

      {/* ── Stock Status National ─────────────────────────────────────────── */}
      <section id="ch-stock">
        <ProgramPanel
          title="Stock Status National"
          subtitle={pageReady ? `${filteredStock.length} of ${stockRows.length} products` : ''}
          action={pageReady ? <div className="flex items-center gap-2"><IconButton variant="info" contentId="program-national-stock" /><IconButton variant="refresh" onClick={refreshStock} loading={refreshing['stock']} /></div> : undefined}
        >
          {pageReady ? <NationalStockTable rows={filteredStock} onSelectItem={setSelectedProduct} /> : <PanelSkeleton rows={6} height="h-56" />}
        </ProgramPanel>
      </section>

      {/* ── Hub Breakdown ────────────────────────────────────────────────── */}
      <section id="ch-hubs">
        {!sectionLoaded['hub'] ? <PanelSkeleton /> : (
        <ProgramPanel
          title="Stock on Hand — Regional Hubs Breakdown"
          subtitle={
            productFilter
              ? `${productFilter} across ${filteredHubRows.length} locations`
              : `${focusedHubProducts.length} products × ${filteredHubRows.length} locations`
          }
          action={(
            <div className="flex items-center gap-2">
              <IconButton variant="refresh" onClick={refreshHub} loading={refreshing['hub']} />
              <IconButton variant="info" contentId="program-hub-heatmap" />
              <div className="relative">
                <select
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="appearance-none h-9 min-w-[120px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  {hubSites.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={hubTypeFilter}
                  onChange={(e) => setHubTypeFilter(e.target.value)}
                  className="appearance-none h-9 min-w-[110px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Hub">Hub</option>
                  <option value="Center">Center</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
              </div>
            </div>
          )}
        >
          <HubHeatmap rows={filteredHubRows} products={focusedHubProducts} statusMap={hubData.statusMap} />
        </ProgramPanel>
        )}
      </section>

      {/* ── Item Procurement By Agent + Procurement Agents pie ───────────── */}
      <section id="ch-procurement">
        {!sectionLoaded['procurement'] ? <ChartRowSkeleton /> : (
        <ProgramChartRow
          leftTitle="Item Procurement By Agent"
          leftSubtitle="PO line count by funding source per product"
          leftAction={<IconButton variant="refresh" onClick={refreshProcurer} loading={refreshing['procurer']} />}
          leftChart={<ProgramStackedBarChart data={procurementByAgent} normalized yLabel="Count" />}
          rightTitle="Procurement Agents"
          rightSubtitle={`Birr value share (${yearFilter})`}
          rightData={donorChart}
          rightLoading={loadingProcurer}
          rightAction={<><IconButton variant="refresh" onClick={refreshProcurerChart} loading={refreshing['procurerChart']} /><IconButton variant="info" contentId="program-procurement-agents" /></>}
          rightExtra={(
            <div className="flex items-center gap-2">
              <label className="text-caption text-on-surface-variant whitespace-nowrap">Year:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-8 min-w-[100px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
                aria-label="Filter by fiscal year"
              >
                {['2016','2015','2014','2013','2012','2011','2010','2009','2008'].reverse().map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          )}
        />
        )}
      </section>

      {/* ── Purchase Order table ─────────────────────────────────────────── */}
      <section id="ch-po">
        {!sectionLoaded['purchaseOrders'] ? <PanelSkeleton /> : (
        <ProgramPanel
          title="Purchase Order — Incoming Shipments"
          subtitle={`${filteredPOs.length} open delivery records`}
          action={(
            <div className="flex items-center gap-1.5">
              <IconButton variant="refresh" onClick={() => refreshPurchaseOrders(poTab)} loading={refreshing['purchaseOrders']} />
              <IconButton variant="info" contentId="program-purchase-order" />
            </div>
          )}
        >
          <div className="flex items-center gap-0 px-5 pt-3 pb-1">
            {['Vitas', 'ERP'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setPoTab(tab); refreshPurchaseOrders(tab); }}
                className={`px-4 py-1.5 text-label-sm rounded-t-lg border border-b-0 -mb-px transition-colors ${
                  poTab === tab
                    ? 'bg-white border-outline-variant text-primary font-semibold'
                    : 'bg-surface-container border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <PurchaseOrderTable rows={filteredPOs.slice(0, 12)} />
        </ProgramPanel>
        )}
      </section>

      {/* ── Recent Receives ──────────────────────────────────────────────── */}
      <section id="ch-receives">
        {!sectionLoaded['receives'] ? <PanelSkeleton /> : (
        <ProgramPanel
          title="Recent Receives"
          subtitle={`${filteredReceives.length} receipt records · ${formatNumber(kpis.receivedValue)} ETB`}
          action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-recent-receives" /><IconButton variant="refresh" onClick={refreshReceives} loading={refreshing['receives']} /></div>}
        >
          <RecentReceivesTable rows={filteredReceives.slice(0, 10)} />
        </ProgramPanel>
        )}
      </section>

      {/* ── Item Distribution + Facility Type pie ────────────────────────── */}
      <section id="ch-distribution">
        {!sectionLoaded['distribution'] ? <ChartRowSkeleton /> : (
        <ProgramChartRow
          leftTitle="Item Distribution by Facility Type"
          leftSubtitle="Products distributed across health center, hospital, woreda, and other facilities"
          leftAction={<IconButton variant="refresh" onClick={refreshDistribution} loading={refreshing['distribution']} />}
          leftChart={<ProgramStackedBarChart data={itemDistribution} />}
          rightTitle="Distribution by Facility Type"
          rightSubtitle="Share by facility type"
          rightData={(() => {
            const types = ['HealthCenter', 'Hospital', 'Woreda', 'Others'];
            const totals = types.map((t) => ({
              label: t.replace(/([A-Z])/g, ' $1').trim(),
              value: apiDistribution.reduce((s, r) => s + (r[t] || 0), 0),
            }));
            return totals.filter((t) => t.value > 0);
          })()}
          rightAction={<IconButton variant="info" contentId="program-facility-distribution" />}
        />
        )}
      </section>

      {/* ── Issued Items ─────────────────────────────────────────────────── */}
      <section id="ch-issued">
        {!sectionLoaded['issued'] ? <PanelSkeleton rows={3} /> : (
        <ProgramPanel title="Issued — Facility" subtitle="Issued items by flow type and month" action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-issued-items" /><IconButton variant="refresh" onClick={refreshIssuedItems} loading={refreshing['issued']} /></div>}>
          <IssuedItemsTable rows={apiIssuedItems} fromDate={issuedFromDate} toDate={issuedToDate} onFromChange={setIssuedFromDate} onToChange={setIssuedToDate} />
        </ProgramPanel>
        )}
      </section>

      {/* ── Pipeline: Incoming Shipment + Ownership + Quantity + Funding ─── */}
      <section id="ch-pipeline" className="space-y-5">
        {!sectionLoaded['pipeline'] ? (<><ChartRowSkeleton /><ChartRowSkeleton /></>) : (
        <>
        <ProgramChartRow
          leftTitle="Pipeline Incoming Shipment"
          leftSubtitle="Center pipeline by product — PurchaseOrdered, BelowMax, AboveMax, ProjectedDaysOutOfStock, InvoicedM"
          leftAction={<IconButton variant="refresh" onClick={refreshPipeline} loading={refreshing['pipeline']} />}
          leftChart={<ProgramStackedBarChart data={pipelineByDonor} />}
          rightTitle="Distribution by Ownership Type"
          rightSubtitle={`Ownership share (${ownershipYear})`}
          rightData={ownershipChart}
          rightLoading={loadingOwnership}
          rightAction={<><IconButton variant="refresh" onClick={refreshOwnershipChart} loading={refreshing['ownership']} /><IconButton variant="info" contentId="program-ownership-distribution" /></>}
          rightExtra={(
            <div className="flex items-center gap-2">
              <label className="text-caption text-on-surface-variant whitespace-nowrap">Year:</label>
              <select
                value={ownershipYear}
                onChange={(e) => setOwnershipYear(e.target.value)}
                className="h-8 min-w-[100px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
                aria-label="Filter by fiscal year"
              >
                {['2016','2015','2014','2013','2012','2011','2010','2009','2008'].reverse().map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          )}
        />
        <ProgramChartRow
          leftTitle="Order Fill Rate"
          leftSubtitle="COFR (Customer) and HOFR (Hub) fill rates by product"
          leftAction={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-order-fill-rate" /><IconButton variant="refresh" onClick={refreshOrderFillRate} loading={refreshing['orderFillRate']} /></div>}
          leftChart={leftChart}
          rightTitle="Funding Source"
          rightSubtitle={`Donor share (${fundingYear})`}
          rightData={fundingChart}
          rightLoading={loadingFunding}
          rightAction={<><IconButton variant="refresh" onClick={refreshFundingChart} loading={refreshing['funding']} /><IconButton variant="info" contentId="program-funding-source" /></>}
          rightExtra={(
            <div className="flex items-center gap-2">
              <label className="text-caption text-on-surface-variant whitespace-nowrap">Year:</label>
              <select
                value={fundingYear}
                onChange={(e) => setFundingYear(e.target.value)}
                className="h-8 min-w-[100px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
                aria-label="Filter by fiscal year"
              >
                {['2016','2015','2014','2013','2012','2011','2010','2009','2008'].reverse().map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          )}
        />
        </>
        )}
      </section>

      {/* ── Stock Utilization ─────────────────────────────────────────────── */}
      <section id="ch-utilization">
        {!sectionLoaded['stockUtilization'] ? <PanelSkeleton /> : (
        <ProgramPanel title="Stock Utilization National" subtitle="SOHAmtBirr, IssuedAmtBirr, and ExpiredAmtBirr by product" action={<IconButton variant="refresh" onClick={refreshStockUtilization} loading={refreshing['stockUtilization']} />}>
          <ProgramStackedBarChart data={stockUtilization} height={260} />
        </ProgramPanel>
        )}
      </section>

      {/* ── National MOS ─────────────────────────────────────────────────── */}
      <section id="ch-mos">
        {!sectionLoaded['mos'] ? <PanelSkeleton /> : (
        <ProgramPanel title="National MOS" subtitle={`MOS by site — ${mosSiteLabels[mosSite?.toUpperCase()] || mosSite || 'select a site'}`} action={<IconButton variant="refresh" onClick={refreshMos} loading={refreshing['mos']} />}>
          <div className="flex items-center gap-3 px-5 pt-3 pb-1">
            <label className="text-label-sm text-on-surface-variant whitespace-nowrap">Site:</label>
            <select
              value={mosSite}
              onChange={(e) => setMosSite(e.target.value)}
              className="h-9 min-w-[120px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
              aria-label="Select MOS site"
            >
              {mosSiteOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <ProgramBarChart data={mosChart} valueFormatter={(v) => Number(v).toFixed(1)} />
        </ProgramPanel>
        )}
      </section>

      {/* ── Manufacturers ─────────────────────────────────────────────────── */}
      <section id="ch-manufacturers">
        {!sectionLoaded['manufacturers'] ? <PanelSkeleton /> : (
        <ProgramPanel title="Manufacturers" subtitle="Recent received value by manufacturer" action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-mini-table" /><IconButton variant="refresh" onClick={refreshManufacturers} loading={refreshing['manufacturers']} /></div>}>
          <BaseTable
            columns={[
              { key: 'label', label: 'Manufacturer' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={manufacturerRows}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
        )}
      </section>

      {/* ── Countries ─────────────────────────────────────────────────────── */}
      <section id="ch-countries">
        {!sectionLoaded['countries'] ? <PanelSkeleton /> : (
        <ProgramPanel title="Countries" subtitle="Recent received value by country" action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-mini-table" /><IconButton variant="refresh" onClick={refreshCountries} loading={refreshing['countries']} /></div>}>
          <BaseTable
            columns={[
              { key: 'label', label: 'Country' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={countryRows}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
        )}
      </section>

    </div>
  );
}

export default ChildHealth;
