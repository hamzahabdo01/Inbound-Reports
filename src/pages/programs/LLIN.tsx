import { useMemo, useState, useEffect, useCallback } from 'react';
import KPICard from '../../components/KPICard';
import ProgramPanel from '../../components/program/ProgramPanel';
import SectionNavigator from '../../components/SectionNavigator';
import BaseTable from '../../components/BaseTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PieChart from '../../components/PieChart';
import IconButton from '../../components/IconButton';
import { SS_WebApi, OIH_WebApi, POD_WebApi, BinCard_WebApi, IUBVIUI_WebApi, LookUp } from '../../api/fanos.ts';

const formatCompact = (v) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
const formatNumber = (v) => new Intl.NumberFormat('en').format(v || 0);

const LLIN_SECTIONS = [
  { id: 'llin-overview',   label: 'Overview' },
  { id: 'llin-issued',     label: 'Issued' },
  { id: 'llin-stock',      label: 'Stock Status' },
  { id: 'llin-distribution',label: 'Planned vs Actual' },
  { id: 'llin-po',         label: 'Purchase Orders' },
  { id: 'llin-mini',       label: 'Mini Tables' },
  { id: 'llin-procurement',label: 'Charts' },
];

const COLORS = ['#0B4F54', '#86BFC5', '#216E6A', '#4A9598', '#515F74', '#D97706'];

function PanelSkeleton({ rows = 4, height = 'h-48' }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)] animate-pulse">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-surface-container-high rounded w-48" />
          <div className="h-3 bg-surface-container-high rounded w-32" />
        </div>
        <div className="flex items-center gap-2">
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

function processStockRows(apiStock) {
  if (!apiStock.length) return [];
  const sampleKeys = Object.keys(apiStock[0]);
  const productCNKey = sampleKeys.find((k) => /^ProductCN$/i.test(k))
    || sampleKeys.find((k) => /^ItemName$/i.test(k))
    || 'ProductCN';
  const sohKey = sampleKeys.find((k) => /^SOH|StockOnHand|CurrentStock/i.test(k)) || 'SOH';
  const amcKey = sampleKeys.find((k) => /^AMC|AverageMonthlyConsumption/i.test(k)) || 'AMC';
  const poKey = sampleKeys.find((k) => /^QuantityPurchaseOrder|Planned|OrderQuantity/i.test(k)) || 'QuantityPurchaseOrder';
  const ssKey = sampleKeys.find((k) => /^SS|StockStatus|Status/i.test(k));
  const mosKey = sampleKeys.find((k) => /^MOS|MonthOfStock/i.test(k));
  const minKey = sampleKeys.find((k) => /^Min/i.test(k));
  const maxKey = sampleKeys.find((k) => /^Max/i.test(k));
  const productSNKey = sampleKeys.find((k) => /^ProductSN|SN|ProductID/i.test(k));

  return apiStock.map((r) => {
    const soh = Number(r[sohKey]) || 0;
    const amc = Number(r[amcKey]) || 0;
    const mos = mosKey ? (Number(r[mosKey]) || 0) : (amc > 0 ? soh / amc : 0);
    const ss = ssKey ? String(r[ssKey] || '') : (soh > 0 ? (amc > 0 && soh / amc < 3 ? 'Below EOP' : 'Normal') : 'Stocked Out');
    return {
      ProductCN: String(r[productCNKey] || ''),
      ProductSN: productSNKey ? Number(r[productSNKey]) || 0 : 0,
      SS: ss,
      SOH: soh,
      AMC: amc,
      MOS: mos,
      QuantityPurchaseOrder: Number(r[poKey]) || 0,
      GIT: 0,
      Min: minKey ? Number(r[minKey]) || 0 : 0,
      Max: maxKey ? Number(r[maxKey]) || 0 : 0,
    };
  });
}

function processPurchaseOrders(data) {
  if (!data.length) return [];
  const sampleKeys = Object.keys(data[0]);
  const poKey = sampleKeys.find((k) => /^PONumber|PurchaseOrderNumber|^PO_/i.test(k)) || 'PONumber';
  const orderedKey = sampleKeys.find((k) => /^QuantityPurchaseOrder/i.test(k)) || 'Ordered';
  const shippedKey = sampleKeys.find((k) => /^QuantityInvoiced/i.test(k)) || 'Shipped';
  const receivedKey = sampleKeys.find((k) => /^QuantityReceived/i.test(k)) || 'Received';
  const supplierKey = sampleKeys.find((k) => /^Supplier|Vendor|Manufacturer/i.test(k)) || 'Supplier';
  return data.map((r) => {
    const ordered = Number(r[orderedKey]) || 0;
    const shipped = Number(r[shippedKey]) || 0;
    const received = Number(r[receivedKey]) || 0;
    const pending = Math.max(ordered - received, 0);
    const completed = ordered > 0 ? ((received / ordered) * 100).toFixed(0) : '0';
    return {
      po: String(r[poKey] || ''),
      supplier: String(r[supplierKey] || ''),
      ordered,
      shipped,
      received,
      pending,
      completed: `${completed}%`,
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

function processMiniTableData(data, labelKey, valueKey) {
  if (!data.length) return [];
  const sampleKeys = Object.keys(data[0]);
  const lk = labelKey || sampleKeys.find((k) => typeof data[0][k] === 'string' && !/row|id|sn|code/i.test(k)) || sampleKeys[0];
  const vk = valueKey || sampleKeys.find((k) => typeof data[0][k] === 'number') || sampleKeys[1];
  const total = data.reduce((s, r) => s + (Number(r[vk]) || 0), 0);
  return data.map((r) => ({
    label: String(r[lk] || ''),
    value: Number(r[vk]) || 0,
    share: total > 0 ? `${((Number(r[vk]) / total) * 100).toFixed(1)}%` : '0%',
  })).filter((r) => r.value > 0);
}

function LlinProgram() {
  const [pageReady, setPageReady] = useState(false);
  const [error, setError] = useState(null);
  const [sectionLoaded, setSectionLoaded] = useState({});
  const [refreshing, setRefreshing] = useState({});
  const markLoaded = useCallback((key) => {
    setSectionLoaded(prev => ({ ...prev, [key]: true }));
  }, []);

  // ── API state ──────────────────────────────────────────────────────────
  const [apiStockRows, setApiStockRows] = useState([]);
  const [apiIssuedItems, setApiIssuedItems] = useState([]);
  const [apiDistribution, setApiDistribution] = useState([]);
  const [apiPurchaseOrders, setApiPurchaseOrders] = useState([]);
  const [apiManufacturers, setApiManufacturers] = useState([]);
  const [apiUnitSOH, setApiUnitSOH] = useState([]);
  const [apiAccountSOH, setApiAccountSOH] = useState([]);
  const [apiActivitySOH, setApiActivitySOH] = useState([]);
  const [apiFundingSource, setApiFundingSource] = useState([]);
  const [apiFacilityDistribution, setApiFacilityDistribution] = useState([]);
  const [issuedFromDate, setIssuedFromDate] = useState('');
  const [issuedToDate, setIssuedToDate] = useState('');
  const [distributionPage, setDistributionPage] = useState(1);
  const ROWS_PER_PAGE = 10;
  const [selectedProductSN, setSelectedProductSN] = useState(3215);
  const [yearsList, setYearsList] = useState([]);
  const [distributionYear, setDistributionYear] = useState('2016');
  const [fundingYear, setFundingYear] = useState('2016');
  const [facilityYear, setFacilityYear] = useState('2014');

  const PROGRAM_CODE = 'LLIN';

  // ── Tier 1: Critical data (fires immediately) ──────────────────────────
  const fetchTier1 = useCallback(async () => {
    setError(null);
    try {
      const res = await IUBVIUI_WebApi.getProgramProducts({
        ModeCode: 'HPR', EnvironmentTypeCode: 'PFSAH', OrderBy: 'ProductCN', ProgramCode: PROGRAM_CODE,
      });
      const processed = processStockRows(res?.data?.Data || []);
      setApiStockRows(processed);
      // Pick first product SN if available
      if (processed.length > 0 && processed[0].ProductSN) {
        setSelectedProductSN(processed[0].ProductSN);
      }
    } catch (err) {
      setError(err.message || 'Failed to load stock data');
    } finally {
      setPageReady(true);
    }
  }, []);

  useEffect(() => { fetchTier1(); }, [fetchTier1]);

  // ── Fetch fiscal year list ─────────────────────────────────────────────
  useEffect(() => {
    LookUp.getFiscalYearList().then(res => {
      const list = (res?.data?.Data || []).map(y => y.FiscalYear).filter(Boolean);
      if (list.length > 0) {
        setYearsList(list);
        const current = list.find((y) => y === '2016') || list[0];
        setDistributionYear(current);
        setFundingYear(current);
        setFacilityYear(current);
      }
    }).catch(() => {});
  }, []);

  // ── Tier 2: Deferred data (staggered) ──────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const stagger = (ms, fn) => setTimeout(fn, ms);

      // Issued — 0ms
      stagger(0, () => {
        OIH_WebApi.getItemDistributionCenterToHubByProgram({
          ModeCode: 'RDF', ProgramCode: PROGRAM_CODE,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiIssuedItems(processIssuedItems(d));
        }).catch(() => {}).finally(() => markLoaded('issued'));
      });

      // Planned vs Actual — 50ms
      stagger(50, () => {
        OIH_WebApi.getDPlanVsIssued({
          ModeCode: 'HPR', Year: distributionYear, ProgramCode: PROGRAM_CODE, FiscalYear: distributionYear,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiDistribution(d);
        }).catch(() => {}).finally(() => markLoaded('distribution'));
      });

      // Purchase Orders — 100ms
      stagger(100, () => {
        SS_WebApi.getPoRiRcByDP({
          ModeCode: 'HPR', ProgramCode: PROGRAM_CODE,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiPurchaseOrders(processPurchaseOrders(d));
        }).catch(() => {}).finally(() => markLoaded('purchaseOrders'));
      });

      // Manufacturer Mini Table — 150ms
      stagger(150, () => {
        BinCard_WebApi.getManufacturerSOH({
          ModeCode: 'HPR', ProgramCode: PROGRAM_CODE, ProductSN: String(selectedProductSN), OrderBy: 'SOH DESC',
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiManufacturers(processMiniTableData(d));
        }).catch(() => {}).finally(() => markLoaded('manufacturer'));
      });

      // Unit Mini Table — 200ms
      stagger(200, () => {
        SS_WebApi.getSS_UnitSOH({
          ModeCode: 'HPR', ProgramCode: PROGRAM_CODE, ProductSN: String(selectedProductSN),
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiUnitSOH(processMiniTableData(d));
        }).catch(() => {}).finally(() => markLoaded('unit'));
      });

      // Account Mini Table — 250ms
      stagger(250, () => {
        SS_WebApi.getSOHbyIWACC({
          ModeCode: 'HPR', ProductSN: String(selectedProductSN), OrderBy: 'SOH DESC', ProgramCode: PROGRAM_CODE,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiAccountSOH(processMiniTableData(d));
        }).catch(() => {}).finally(() => markLoaded('account'));
      });

      // Activity Mini Table — 300ms
      stagger(300, () => {
        SS_WebApi.getSOHbyIWAct({
          ModeCode: 'HPR', ProductSN: String(selectedProductSN), OrderBy: 'SOH DESC', ProgramCode: PROGRAM_CODE,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiActivitySOH(processMiniTableData(d));
        }).catch(() => {}).finally(() => markLoaded('activity'));
      });

      // Funding Source — 350ms
      stagger(350, () => {
        POD_WebApi.getItemFundingSourceAndProcurer({
          ModeCode: 'HPR', ProgramCode: PROGRAM_CODE, FiscalYear: fundingYear,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiFundingSource(d);
        }).catch(() => {}).finally(() => markLoaded('funding'));
      });

      // Distribution by Facility Type — 400ms
      stagger(400, () => {
        OIH_WebApi.getDistributionByFacilityType({
          ModeCode: 'HPR', ProgramCode: PROGRAM_CODE, FiscalYear: facilityYear,
        }).then(res => {
          const d = res?.data?.Data || [];
          if (d.length > 0) setApiFacilityDistribution(d);
        }).catch(() => {}).finally(() => markLoaded('facility'));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [markLoaded, selectedProductSN]);

  // ── Refresh callbacks ──────────────────────────────────────────────────
  const withRefresh = (key, fn) => async (...args) => {
    setRefreshing((prev) => ({ ...prev, [key]: true }));
    try { await fn(...args); } catch { /* handled inside */ }
    setRefreshing((prev) => ({ ...prev, [key]: false }));
  };

  const refreshStock = withRefresh('stock', async () => {
    const res = await IUBVIUI_WebApi.getProgramProducts({
      ModeCode: 'HPR', EnvironmentTypeCode: 'PFSAH', OrderBy: 'ProductCN', ProgramCode: PROGRAM_CODE,
    });
    const processed = processStockRows(res?.data?.Data || []);
    setApiStockRows(processed);
    if (processed.length > 0 && processed[0].ProductSN) {
      setSelectedProductSN(processed[0].ProductSN);
    }
  });

  const refreshIssued = withRefresh('issued', async () => {
    const res = await OIH_WebApi.getItemDistributionCenterToHubByProgram({
      ModeCode: 'RDF', ProgramCode: PROGRAM_CODE,
    });
    setApiIssuedItems(processIssuedItems(res?.data?.Data || []));
  });

  const refreshDistribution = withRefresh('distribution', async (year) => {
    const yr = year || distributionYear;
    const res = await OIH_WebApi.getDPlanVsIssued({
      ModeCode: 'HPR', Year: yr, ProgramCode: PROGRAM_CODE, FiscalYear: yr,
    });
    setApiDistribution(res?.data?.Data || []);
  });

  const handleDistributionYearChange = (e) => {
    const yr = e.target.value;
    setDistributionYear(yr);
    setDistributionPage(1);
    refreshDistribution(yr);
  };

  const refreshPOs = withRefresh('po', async () => {
    const res = await SS_WebApi.getPoRiRcByDP({
      ModeCode: 'HPR', ProgramCode: PROGRAM_CODE,
    });
    setApiPurchaseOrders(processPurchaseOrders(res?.data?.Data || []));
  });

  const refreshFunding = withRefresh('funding', async (year) => {
    const yr = year || fundingYear;
    const res = await POD_WebApi.getItemFundingSourceAndProcurer({
      ModeCode: 'HPR', ProgramCode: PROGRAM_CODE, FiscalYear: yr,
    });
    setApiFundingSource(res?.data?.Data || []);
  });

  const refreshFacility = withRefresh('facility', async (year) => {
    const yr = year || facilityYear;
    const res = await OIH_WebApi.getDistributionByFacilityType({
      ModeCode: 'HPR', ProgramCode: PROGRAM_CODE, FiscalYear: yr,
    });
    setApiFacilityDistribution(res?.data?.Data || []);
  });

  const handleFundingYearChange = (e) => {
    const yr = e.target.value;
    setFundingYear(yr);
    refreshFunding(yr);
  };

  const handleFacilityYearChange = (e) => {
    const yr = e.target.value;
    setFacilityYear(yr);
    refreshFacility(yr);
  };

  // ── Derived data ───────────────────────────────────────────────────────
  const stockRows = apiStockRows;
  const products = useMemo(() => stockRows.map((r) => r.ProductCN).sort(), [stockRows]);

  const kpis = useMemo(() => {
    const totalSoh = stockRows.reduce((s, r) => s + r.SOH, 0);
    const totalOrdered = apiPurchaseOrders.reduce((s, r) => s + r.ordered, 0);
    const totalShipped = apiPurchaseOrders.reduce((s, r) => s + r.shipped, 0);
    const totalReceived = apiPurchaseOrders.reduce((s, r) => s + r.received, 0);
    const totalPending = apiPurchaseOrders.reduce((s, r) => s + r.pending, 0);
    return { totalSoh, totalOrdered, totalShipped, totalReceived, totalPending };
  }, [stockRows, apiPurchaseOrders]);

  // Planned vs Actual rows
  const plannedVsActualRows = useMemo(() => {
    if (apiDistribution.length === 0) return [];
    const sampleKeys = Object.keys(apiDistribution[0]);
    const districtKey = sampleKeys.find((k) => /^District$/i.test(k));
    const zoneKey = sampleKeys.find((k) => /^Zone$/i.test(k));
    const plannedKey = sampleKeys.find((k) => /^Planned|Plan$/i.test(k)) || 'Planned';
    const actualKey = sampleKeys.find((k) => /^Actual|Issued$/i.test(k)) || 'Actual';
    return apiDistribution.map((r) => ({
      region: String(r[districtKey] || ''),
      zone: String(r[zoneKey] || ''),
      woreda: String(r[districtKey] || ''),
      planned: Number(r[plannedKey]) || 0,
      actual: Number(r[actualKey]) || 0,
    }));
  }, [apiDistribution]);

  // Funding Source chart
  const fundingChart = useMemo(() => {
    if (apiFundingSource.length === 0) return [];
    const data = apiFundingSource;
    const ignore = new Set(['RowNumber', 'FiscalYear', 'ProductCN', 'Total']);
    const labelKey = Object.keys(data[0]).find((k) =>
      /donor|funding|source|funder|procurer/i.test(k) && typeof data[0][k] === 'string'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'string' && !ignore.has(k)
    );
    const valueKey = Object.keys(data[0]).find((k) =>
      /birr|amount|value|count|total|quantity/i.test(k) && typeof data[0][k] === 'number'
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

  // Facility Type chart
  const facilityTypeChart = useMemo(() => {
    if (apiFacilityDistribution.length === 0) return [];
    const data = apiFacilityDistribution;
    const ignore = new Set(['RowNumber', 'FiscalYear', 'ProductCN']);
    const labelKey = Object.keys(data[0]).find((k) =>
      /type|facility|category/i.test(k) && typeof data[0][k] === 'string'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'string' && !ignore.has(k)
    );
    const valueKey = Object.keys(data[0]).find((k) =>
      /amount|birr|value|total/i.test(k) && typeof data[0][k] === 'number'
    ) || Object.keys(data[0]).find((k) =>
      typeof data[0][k] === 'number' && !ignore.has(k)
    );
    if (labelKey && valueKey) {
      return data
        .map((r) => ({ label: String(r[labelKey]), value: Number(r[valueKey]) || 0 }))
        .filter((r) => r.value > 0);
    }
    return [];
  }, [apiFacilityDistribution]);

  // ── Error state (before any data) ──────────────────────────────────────
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

  return (
    <div className="space-y-5">

      <SectionNavigator sections={LLIN_SECTIONS} />

      {/* ── Overview: KPI cards ──────────────────────────────────────────── */}
      <section id="llin-overview">
        <div className="grid grid-cols-4 gap-3">
          <KPICard variant="detailed" icon="fa-boxes-stacked"      iconBg="bg-success/10"     iconColor="text-success"     label="SOH"     value="101.7K"     subtitle={pageReady ? `${stockRows.length} SKUs` : '—'} />
          <KPICard variant="detailed" icon="fa-cart-shopping"       iconBg="bg-surface-container" iconColor="text-primary" label="Ordered" value="0" subtitle="total PO quantity" />
          <KPICard variant="detailed" icon="fa-route"          iconBg="bg-[#4A8EA5]/10"   iconColor="text-[#4A8EA5]"   label="GIT" value="0" subtitle="in transit" />
          <KPICard variant="detailed" icon="fa-circle-exclamation"  iconBg="bg-warning/10"     iconColor="text-warning"     label="Damaged" value="10.9K"                        subtitle="reported damage" />
        </div>
      </section>

      {/* ── Issued — Center to Hub ──────────────────────────────────────── */}
      <section id="llin-issued">
        {!sectionLoaded['issued'] ? <PanelSkeleton rows={3} /> : (
        <ProgramPanel
          title="Issued — Center to Hub"
          subtitle="Issued items by flow type and month"
          action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-issued-items" /><IconButton variant="refresh" onClick={refreshIssued} loading={refreshing['issued']} /></div>}
        >
          <IssuedItemsTable rows={apiIssuedItems} fromDate={issuedFromDate} toDate={issuedToDate} onFromChange={setIssuedFromDate} onToChange={setIssuedToDate} />
        </ProgramPanel>
        )}
      </section>

      {/* ── Stock Status ────────────────────────────────────────────────── */}
      <section id="llin-stock">
        <ProgramPanel
          title="Stock Status"
          subtitle={pageReady ? `${stockRows.length} products` : ''}
          action={pageReady ? <div className="flex items-center gap-2"><IconButton variant="info" contentId="program-mini-table" /><IconButton variant="refresh" onClick={refreshStock} loading={refreshing['stock']} /></div> : undefined}
        >
          {pageReady ? (
          <BaseTable
            columns={[
              { key: 'ProductCN', label: 'Item' },
              { key: 'SS', label: 'Status', render: (row) => (
                <span className="inline-flex rounded bg-warning/15 px-2.5 py-1 text-[11px] font-bold text-warning">{row.SS}</span>
              )},
              { key: 'SOH', label: 'SOH', render: (row) => formatNumber(row.SOH) },
              { key: 'MOS', label: 'MOS', render: (row) => row.MOS.toFixed(1) },
              { key: 'AMC', label: 'AMC', render: (row) => formatNumber(row.AMC) },
              { key: 'Min', label: 'Min', render: (row) => formatNumber(row.Min) },
              { key: 'Max', label: 'Max', render: (row) => formatNumber(row.Max) },
              { key: 'QuantityPurchaseOrder', label: 'Planned', render: (row) => formatNumber(row.QuantityPurchaseOrder) },
              { key: 'GIT', label: 'GIT', render: (row) => formatNumber(row.GIT) },
            ]}
            rows={stockRows}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.ProductCN || index}
            rowClassName="hover:bg-surface-container-low"
          />
          ) : <PanelSkeleton rows={6} height="h-56" />}
        </ProgramPanel>
      </section>

      {/* ── Distribution: Planned vs Actual ─────────────────────────────── */}
      <section id="llin-distribution">
        {!sectionLoaded['distribution'] ? <PanelSkeleton /> : (
        <ProgramPanel
          title="Distribution: Planned vs Actual"
          subtitle={`${apiDistribution.length} distribution records`}
          action={<div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-caption text-on-surface-variant whitespace-nowrap">Year:</label>
              <select
                value={distributionYear}
                onChange={handleDistributionYearChange}
                className="h-8 min-w-[100px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
                aria-label="Filter distribution by fiscal year"
              >
                {yearsList.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
              </select>
            </div>
            <IconButton variant="refresh" onClick={refreshDistribution} loading={refreshing['distribution']} />
          </div>}
        >
          {apiDistribution.length > 0 ? (
            <BaseTable
              pagination={{
                page: distributionPage,
                rowsPerPage: ROWS_PER_PAGE,
                total: plannedVsActualRows.length,
                totalPages: Math.ceil(plannedVsActualRows.length / ROWS_PER_PAGE),
                onChange: (page) => setDistributionPage(page),
              }}
              columns={[
                { key: 'region', label: 'Region' },
                { key: 'zone', label: 'Zone' },
                { key: 'woreda', label: 'Woreda' },
                { key: 'planned', label: 'Planned Qty.', render: (row) => formatNumber(row.planned) },
                { key: 'actual', label: 'Actual Qty.', render: (row) => formatNumber(row.actual) },
                { key: 'fillRate', label: 'Fill rate', render: (row) => {
                  const rate = row.planned > 0 ? ((row.actual / row.planned) * 100) : 0;
                  return (
                    <span className={`inline-flex rounded px-2.5 py-1 text-[11px] font-bold ${
                      rate >= 80 ? 'bg-success/15 text-success' :
                      rate >= 50 ? 'bg-warning/15 text-warning' :
                      'bg-error/15 text-error'
                    }`}>
                      {rate.toFixed(1)}%
                    </span>
                  );
                }},
              ]}
              rows={plannedVsActualRows}
              headerBg="bg-[#CFD8DC]"
              minWidth="520px"
              rowKey={(row, index) => row.label || index}
              rowClassName="hover:bg-surface-container-low"
            />
          ) : (
            <div className="flex items-center justify-center text-on-surface-variant text-body-sm" style={{ height: 200 }}>
              No distribution data
            </div>
          )}
        </ProgramPanel>
        )}
      </section>

      {/* ── Purchase Orders and Shipments ───────────────────────────────── */}
      <section id="llin-po">
        {!sectionLoaded['purchaseOrders'] ? <PanelSkeleton /> : (
        <ProgramPanel
          title="Purchase Orders and Shipments"
          subtitle={`${apiPurchaseOrders.length} PO records`}
          action={<div className="flex items-center gap-2"><IconButton variant="info" contentId="program-mini-table" /><IconButton variant="refresh" onClick={refreshPOs} loading={refreshing['po']} /></div>}
        >
          <BaseTable
            columns={[
              { key: 'po', label: 'PO Number' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'ordered', label: 'Ordered', render: (row) => formatNumber(row.ordered) },
              { key: 'shipped', label: 'Shipped', render: (row) => formatNumber(row.shipped) },
              { key: 'received', label: 'Received', render: (row) => formatNumber(row.received) },
              { key: 'pending', label: 'Pending', render: (row) => formatNumber(row.pending) },
              { key: 'completed', label: 'Completed', render: (row) => (
                <span className="inline-flex rounded bg-[#2563EB] px-2 py-1 text-[11px] font-bold text-white">{row.completed}</span>
              )},
            ]}
            rows={apiPurchaseOrders}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.po || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
        )}
      </section>

      {/* ── Mini Tables ─────────────────────────────────────────────────── */}
      <section id="llin-mini">
        <div className="grid grid-cols-2 gap-5">
          <ProgramPanel title="Manufacturer Summary" action={<IconButton variant="info" contentId="program-mini-table" />}>
            {sectionLoaded['manufacturer'] ? (
            <BaseTable
              columns={[
                { key: 'label', label: 'Manufacturer' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share' },
              ]}
              rows={apiManufacturers}
              headerBg="bg-[#CFD8DC]"
              minWidth="280px"
              rowKey={(row, index) => row.label || index}
              rowClassName="hover:bg-surface-container-low"
            />
            ) : <div className="h-32 flex items-center justify-center text-on-surface-variant text-body-sm">Loading...</div>}
          </ProgramPanel>
          <ProgramPanel title="Unit SOH" action={<IconButton variant="info" contentId="program-mini-table" />}>
            {sectionLoaded['unit'] ? (
            <BaseTable
              columns={[
                { key: 'label', label: 'Unit' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
              ]}
              rows={apiUnitSOH}
              headerBg="bg-[#CFD8DC]"
              minWidth="280px"
              rowKey={(row, index) => row.label || index}
              rowClassName="hover:bg-surface-container-low"
            />
            ) : <div className="h-32 flex items-center justify-center text-on-surface-variant text-body-sm">Loading...</div>}
          </ProgramPanel>
          <ProgramPanel title="Account Breakdown" action={<IconButton variant="info" contentId="program-mini-table" />}>
            {sectionLoaded['account'] ? (
            <BaseTable
              columns={[
                { key: 'label', label: 'Account' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share' },
              ]}
              rows={apiAccountSOH}
              headerBg="bg-[#CFD8DC]"
              minWidth="280px"
              rowKey={(row, index) => row.label || index}
              rowClassName="hover:bg-surface-container-low"
            />
            ) : <div className="h-32 flex items-center justify-center text-on-surface-variant text-body-sm">Loading...</div>}
          </ProgramPanel>
          <ProgramPanel title="Activity SOH" action={<IconButton variant="info" contentId="program-mini-table" />}>
            {sectionLoaded['activity'] ? (
            <BaseTable
              columns={[
                { key: 'label', label: 'Activity' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
              ]}
              rows={apiActivitySOH}
              headerBg="bg-[#CFD8DC]"
              minWidth="280px"
              rowKey={(row, index) => row.label || index}
              rowClassName="hover:bg-surface-container-low"
            />
            ) : <div className="h-32 flex items-center justify-center text-on-surface-variant text-body-sm">Loading...</div>}
          </ProgramPanel>
        </div>
      </section>

      {/* ── Funding Source + Distribution by Facility Type ──────────────── */}
      <section id="llin-procurement">
        <div className="grid grid-cols-2 gap-5">
          <section>
          {!sectionLoaded['funding'] ? <PanelSkeleton /> : (
          <ProgramPanel
            title="Funding Source"
            subtitle="Procurement funding share"
            action={<div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-caption text-on-surface-variant whitespace-nowrap">Year:</label>
                <select
                  value={fundingYear}
                  onChange={handleFundingYearChange}
                  className="h-8 min-w-[100px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
                  aria-label="Filter funding source by fiscal year"
                >
                  {yearsList.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
                </select>
              </div>
              <IconButton variant="refresh" onClick={refreshFunding} loading={refreshing['funding']} />
              <IconButton variant="info" contentId="program-funding-source" />
            </div>}
          >
            <div className="flex h-64 items-center justify-center">
              {fundingChart.length > 0 ? (
                <div className="w-[320px]">
                  <PieChart data={fundingChart.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} totalLabel="Funding source" />
                </div>
              ) : (
                <span className="text-on-surface-variant text-body-sm">No funding data</span>
              )}
            </div>
          </ProgramPanel>
          )}
          </section>
          <section>
          {!sectionLoaded['facility'] ? <PanelSkeleton /> : (
          <ProgramPanel
            title="Distribution by Facility Type"
            subtitle="Receipt by facility type"
            action={<div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-caption text-on-surface-variant whitespace-nowrap">Year:</label>
                <select
                  value={facilityYear}
                  onChange={handleFacilityYearChange}
                  className="h-8 min-w-[100px] rounded-lg border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10"
                  aria-label="Filter facility distribution by fiscal year"
                >
                  {yearsList.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
                </select>
              </div>
              <IconButton variant="refresh" onClick={refreshFacility} loading={refreshing['facility']} />
              <IconButton variant="info" contentId="program-facility-distribution" />
            </div>}
          >
            {facilityTypeChart.length > 0 ? (
              <div className="flex h-64 items-center justify-center">
                <div className="w-[320px]">
                  <PieChart data={facilityTypeChart.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} totalLabel="Facility distribution" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-on-surface-variant text-body-sm" style={{ height: 200 }}>
                No facility distribution data
              </div>
            )}
          </ProgramPanel>
          )}
          </section>
        </div>
      </section>

    </div>
  );
}

export default LlinProgram;
