import { useMemo, useState } from 'react';
import KPICard from '../../components/KPICard';
import ProgramFilters from '../../components/program/ProgramFilters';
import ProgramPanel from '../../components/program/ProgramPanel';
import ProgramChartRow from '../../components/program/ProgramChartRow';
import SectionNavigator from '../../components/SectionNavigator';
import NationalStockTable from '../../components/program/NationalStockTable';
import HubHeatmap from '../../components/program/HubHeatmap';
import ProgramBarChart from '../../components/program/ProgramBarChart';
import ProgramStackedBarChart from '../../components/program/ProgramStackedBarChart';
import ProgramMiniTable from '../../components/program/ProgramMiniTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PurchaseOrderTable from '../../components/program/PurchaseOrderTable';
import RecentReceivesTable from '../../components/program/RecentReceivesTable';
import PieChart from '../../components/PieChart';
import InfoButton from '../../components/InfoButton';
import ProgramItemDetail from '../../components/program/ProgramItemDetail';
import { parseCSV, parseQuantity } from '../../utils/csvParser';
import stockStatusCsv from '../../data/drought/Stock Status_National.csv?raw';
import zoneBreakdownCsv from '../../data/drought/Stock on Hand_Regional Zones.csv?raw';
import purchaseOrdersCsv from '../../data/drought/Purchase Orders_Drought Relief.csv?raw';
import recentReceivesCsv from '../../data/drought/Recent Receives.csv?raw';

const formatCompact = (v) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
const formatNumber = (v) => new Intl.NumberFormat('en').format(v || 0);

const normalizeNumber = (value) => {
  if (typeof value === 'number') return value;
  return parseQuantity(String(value || ''));
};

const getStatusColor = (status) => {
  if (status === 'Stocked Out') return '#BA1A1A';
  if (status === 'Below EOP')   return '#D97706';
  if (status === 'Excess')      return '#0B4F54';
  return '#059669';
};

const groupBy = (rows: any, key: any, valueKey?: any) => {
  const grouped: Record<string, number> = rows.reduce((acc: any, row: any) => {
    const label = row[key] || 'Unknown';
    acc[label] = (acc[label] || 0) + (valueKey ? Number(row[valueKey]) || 0 : 1);
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

function normalizeStockRows() {
  return parseCSV(stockStatusCsv).map((row) => ({
    ...row,
    SOH:                   normalizeNumber(row.SOH),
    AMC:                   normalizeNumber(row.AMC),
    MOS:                   Number(row.MOS) || 0,
    QuantityPurchaseOrder: normalizeNumber(row.QuantityPurchaseOrder),
    GIT:                   normalizeNumber(row.GIT),
    Min:                   normalizeNumber(row.Min),
    Max:                   normalizeNumber(row.Max),
  }));
}

function normalizeZoneRows() {
  const rows = parseCSV(zoneBreakdownCsv);
  const productKeys = Object.keys(rows[0] || {}).filter((k) => k && k !== 'Site');
  return {
    products: productKeys,
    rows: rows.map((row) => {
      const next = { Site: row.Site };
      productKeys.forEach((k) => { next[k] = normalizeNumber(row[k]); });
      return next;
    }),
  };
}

function normalizePurchaseOrders() {
  return parseCSV(purchaseOrdersCsv).map((row) => {
    const ordered   = normalizeNumber(row.OrderQuantity);
    const delivered = normalizeNumber(row.DeliveredQuantity);
    return {
      ...row,
      OrderQuantity:        ordered,
      NextDeliveryQuantity: normalizeNumber(row.NextDeliveryQuantity),
      DeliveredQuantity:    delivered,
      Pending:              Number(row.Pending) || 0,
      deliveryProgress:     ordered > 0 ? (delivered / ordered) * 100 : 0,
    };
  });
}

function normalizeReceives() {
  return parseCSV(recentReceivesCsv).map((row) => ({
    ...row,
    RowNumber:          Number(row.RowNumber) || 0,
    QuantityReceived:   normalizeNumber(row.QuantityReceived),
    AmountReceivedBirr: normalizeNumber(row.AmountReceivedBirr),
  }));
}

function includesQuery(row, query) {
  if (!query.trim()) return true;
  const lowered = query.toLowerCase();
  return Object.values(row).some((v) => String(v || '').toLowerCase().includes(lowered));
}

const DI_ISSUED_ROWS = [];

const DI_SECTIONS = [
  { id: 'di-kpis',         label: 'Overview' },
  { id: 'di-stock',        label: 'Stock Status' },
  { id: 'di-zones',        label: 'Zone Breakdown' },
  { id: 'di-procurement',  label: 'Procurement' },
  { id: 'di-po',           label: 'Purchase Orders' },
  { id: 'di-receives',     label: 'Recent Receives' },
  { id: 'di-distribution', label: 'Distribution' },
  { id: 'di-issued',       label: 'Issued' },
  { id: 'di-pipeline',     label: 'Pipeline' },
  { id: 'di-utilization',  label: 'Stock Utilization' },
  { id: 'di-mos',          label: 'National MOS' },
  { id: 'di-manufacturers',label: 'Manufacturers' },
  { id: 'di-countries',    label: 'Countries' },
];

function DroughtImpact() {
  const [query,         setQuery]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [siteFilter,    setSiteFilter]    = useState('All');
  const [zoneTypeFilter, setZoneTypeFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('');

  const stockRows      = useMemo(() => normalizeStockRows(), []);
  const zoneData       = useMemo(() => normalizeZoneRows(), []);
  const purchaseOrders = useMemo(() => normalizePurchaseOrders(), []);
  const recentReceives = useMemo(() => normalizeReceives(), []);

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
    recentReceives.filter((r) => (
      includesQuery(r, query) &&
      (!productFilter || r.ProductCN === productFilter)
    ))
  ), [recentReceives, query, productFilter]);

  const focusedZoneProducts = useMemo(() => {
    if (productFilter && zoneData.products.includes(productFilter)) return [productFilter];
    return zoneData.products;
  }, [zoneData.products, productFilter]);

  const zoneSites = useMemo(() => {
    const s = new Set(zoneData.rows.map((r) => r.Site?.trim()).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [zoneData.rows]);

  const productThresholds = useMemo(() => {
    const map = {};
    stockRows.forEach((row) => {
      map[row.ProductCN] = {
        min: row.Min || 0,
        max: row.Max || 0,
        eop: (row.Min + row.Max) > 0 ? (row.Min + row.Max) / 2 : 0,
      };
    });
    return map;
  }, [stockRows]);

  const filteredZoneRows = useMemo(() => {
    let result = zoneData.rows;
    if (siteFilter !== 'All')    result = result.filter((r) => r.Site?.trim() === siteFilter);
    if (zoneTypeFilter !== 'All') result = result.filter((r) => {
      const site = r.Site?.trim() || '';
      if (zoneTypeFilter === 'Zone')    return site.includes('Zone');
      if (zoneTypeFilter === 'Region')  return !site.includes('Zone');
      return true;
    });
    return result;
  }, [zoneData.rows, siteFilter, zoneTypeFilter]);

  const kpis = useMemo(() => ({
    totalSoh:      stockRows.reduce((s, r) => s + r.SOH, 0),
    atRisk:        stockRows.filter((r) => r.SS === 'Below EOP' || r.SS === 'Stocked Out' || r.SS === 'Excess').length,
    git:           stockRows.reduce((s, r) => s + r.GIT, 0),
    poQuantity:    purchaseOrders.reduce((s, r) => s + r.NextDeliveryQuantity, 0),
    receivedValue: recentReceives.reduce((s, r) => s + r.AmountReceivedBirr, 0),
  }), [stockRows, purchaseOrders, recentReceives]);

  const donorChart = useMemo(() => {
    const counts = filteredPOs.reduce((acc, r) => {
      acc[r.Donor] = (acc[r.Donor] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [filteredPOs]);

  const procurementByAgent = useMemo(() => {
    const topProducts = groupBy(filteredPOs, 'ProductCN').slice(0, 12).map((i) => i.label);
    const donors = [...new Set(filteredPOs.map((r) => r.Donor).filter(Boolean))].sort();
    return topProducts.map((product) => ({
      label: product,
      segments: donors
        .map((donor) => ({
          label: donor.replace('FUND', '').replace('DEF', ''),
          value: filteredPOs.filter((r) => r.ProductCN === product && r.Donor === donor).length,
        }))
        .filter((seg) => seg.value > 0),
    })).filter((item) => item.segments.length > 0);
  }, [filteredPOs]);

  const itemDistribution = useMemo(() => {
    const topProducts = groupBy(filteredReceives, 'ProductCN', 'QuantityReceived').slice(0, 11).map((i) => i.label);
    const countries   = [...new Set(filteredReceives.map((r) => r.Country).filter(Boolean))].slice(0, 4);
    return topProducts.map((product) => ({
      label: product,
      segments: countries.map((country) => ({
        label: country,
        value: filteredReceives
          .filter((r) => r.ProductCN === product && r.Country === country)
          .reduce((s, r) => s + r.QuantityReceived, 0),
      })),
    }));
  }, [filteredReceives]);

  const pipelineByDonor = useMemo(() => {
    const topProducts = groupBy(filteredPOs, 'ProductCN', 'OrderQuantity').slice(0, 12).map((i) => i.label);
    const donors = [...new Set(filteredPOs.map((r) => r.Donor).filter(Boolean))].slice(0, 4);
    return topProducts.map((product) => ({
      label: product,
      segments: donors.map((donor) => ({
        label: donor.replace('FUND', ''),
        value: filteredPOs
          .filter((r) => r.ProductCN === product && r.Donor === donor)
          .reduce((s, r) => s + r.OrderQuantity, 0),
      })),
    }));
  }, [filteredPOs]);

  const stockUtilization = useMemo(() => (
    filteredStock.slice(0, 14).map((row) => ({
      label: row.ProductCN,
      segments: [
        { label: 'SOH',        value: row.SOH },
        { label: 'Gap to max', value: Math.max(row.Max - row.SOH, 0) },
      ],
    }))
  ), [filteredStock]);

  const mosChart = useMemo(() => (
    filteredStock
      .map((r) => ({ label: r.ProductCN, value: r.MOS, color: getStatusColor(r.SS) }))
      .slice(0, 15)
  ), [filteredStock]);

  const mosStats = useMemo(() => {
    const ideal  = 6;
    const actual = filteredStock.length > 0
      ? filteredStock.reduce((s, r) => s + r.MOS, 0) / filteredStock.length
      : 0;
    return { actual, ideal, gap: actual - ideal };
  }, [filteredStock]);

  const ownershipChart = useMemo(() => {
    const counts = filteredStock.reduce((acc, r) => {
      const owner = r.SS === 'Normal' || r.SS === 'Excess' ? 'Public' : 'Needs follow-up';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [filteredStock]);

  const manufacturerRows = useMemo(() => (
    groupBy(filteredReceives, 'Manufacturer', 'AmountReceivedBirr').slice(0, 8).map((row) => ({
      ...row,
      share: kpis.receivedValue > 0
        ? `${((row.value / kpis.receivedValue) * 100).toFixed(1)}%`
        : '0%',
    }))
  ), [filteredReceives, kpis.receivedValue]);

  const countryRows = useMemo(() => (
    groupBy(filteredReceives, 'Country', 'AmountReceivedBirr').slice(0, 8).map((row) => ({
      ...row,
      share: kpis.receivedValue > 0
        ? `${((row.value / kpis.receivedValue) * 100).toFixed(1)}%`
        : '0%',
    }))
  ), [filteredReceives, kpis.receivedValue]);

  const hasFilters = Boolean(query.trim() || statusFilter || productFilter);
  const clearFilters = () => { setQuery(''); setStatusFilter(''); setProductFilter(''); };
  const selectedStockRow = useMemo(
    () => stockRows.find((row) => row.ProductCN === selectedProduct),
    [stockRows, selectedProduct],
  );

  if (selectedProduct && selectedStockRow) {
    return (
      <ProgramItemDetail
        programName="Drought Impact"
        productName={selectedProduct}
        itemOptions={stockRows.map((row) => ({ label: row.ProductCN, status: row.SS }))}
        stockRow={selectedStockRow}
        purchaseOrders={purchaseOrders}
        recentReceives={recentReceives}
        hubRows={zoneData.rows}
        onBack={() => setSelectedProduct('')}
        onSelectItem={setSelectedProduct}
      />
    );
  }

  return (
    <div className="space-y-5">

      <SectionNavigator sections={DI_SECTIONS} />

      {/* ── Overview: KPI cards + filters ────────────────────────────────── */}
      <section id="di-kpis" className="space-y-5">
        <div className="grid grid-cols-6 gap-3">
          <KPICard variant="detailed" icon="fa-boxes-stacked"      iconBg="bg-success/10" iconColor="text-success" label="SOH"       value={formatCompact(kpis.totalSoh)}  subtitle={`${stockRows.length} SKUs`} />
          <KPICard variant="detailed" icon="fa-truck-ramp-box"     iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Issued"    value={formatCompact(recentReceives.reduce((s, r) => s + r.QuantityReceived, 0))} subtitle="recent receives" />
          <KPICard variant="detailed" icon="fa-layer-group"        iconBg="bg-surface-container" iconColor="text-primary" label="Planned"   value={formatCompact(kpis.poQuantity)} subtitle={`${purchaseOrders.length} PO lines`} />
          <KPICard variant="detailed" icon="fa-route"              iconBg="bg-success/10" iconColor="text-success" label="GIT"       value={formatCompact(kpis.git)}        subtitle="in transit" />
          <KPICard variant="detailed" icon="fa-circle-exclamation" iconBg={kpis.atRisk ? 'bg-error/10' : 'bg-success/10'} iconColor={kpis.atRisk ? 'text-error' : 'text-success'} label="Expired"   value={kpis.atRisk}                   subtitle="risk items" />
          <KPICard variant="detailed" icon="fa-clock-rotate-left"  iconBg="bg-warning/10" iconColor="text-warning" label="Re Expiry" value={stockRows.filter((r) => r.MOS < 3).length} subtitle="MOS below 3" />
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
      <section id="di-stock">
        <ProgramPanel
          title="Stock Status National — Drought Relief"
          subtitle={`${filteredStock.length} of ${stockRows.length} products`}
          action={<InfoButton contentId="program-national-stock" />}
        >
          <NationalStockTable rows={filteredStock} onSelectItem={setSelectedProduct} />
        </ProgramPanel>
      </section>

      {/* ── Zone Breakdown ─────────────────────────────────────────────── */}
      <section id="di-zones">
        <ProgramPanel
          title="Stock on Hand — Drought-Affected Zones"
          subtitle={
            productFilter
              ? `${productFilter} across ${filteredZoneRows.length} locations`
              : `${focusedZoneProducts.length} products × ${filteredZoneRows.length} locations`
          }
          action={(
            <div className="flex items-center gap-2">
              <InfoButton contentId="program-hub-heatmap" />
              <div className="relative">
                <select
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="appearance-none h-9 min-w-[120px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  {zoneSites.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={zoneTypeFilter}
                  onChange={(e) => setZoneTypeFilter(e.target.value)}
                  className="appearance-none h-9 min-w-[110px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Zone">Zone</option>
                  <option value="Region">Region</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
              </div>
            </div>
          )}
        >
          <HubHeatmap rows={filteredZoneRows} products={focusedZoneProducts} thresholds={productThresholds} />
        </ProgramPanel>
      </section>

      {/* ── Item Procurement By Agent + Procurement Agents pie ───────────── */}
      <section id="di-procurement">
        <ProgramChartRow
          leftTitle="Item Procurement By Agent"
          leftSubtitle="PO line count by funding source per product"
          leftChart={<ProgramStackedBarChart data={procurementByAgent} normalized yLabel="Count" />}
          rightTitle="Procurement Agents"
          rightSubtitle="PO line share"
          rightData={donorChart}
          rightAction={<InfoButton contentId="program-procurement-agents" />}
        />
      </section>

      {/* ── Purchase Order table ─────────────────────────────────────────── */}
      <section id="di-po">
        <ProgramPanel
          title="Purchase Order — Drought Relief Supplies"
          subtitle={`${filteredPOs.length} open delivery records`}
          action={<InfoButton contentId="program-purchase-order" />}
        >
          <PurchaseOrderTable rows={filteredPOs.slice(0, 12)} />
        </ProgramPanel>
      </section>

      {/* ── Recent Receives ──────────────────────────────────────────────── */}
      <section id="di-receives">
        <ProgramPanel
          title="Recent Receives"
          subtitle={`${filteredReceives.length} receipt records · ${formatNumber(kpis.receivedValue)} ETB`}
          action={<InfoButton contentId="program-recent-receives" />}
        >
          <RecentReceivesTable rows={filteredReceives.slice(0, 10)} />
        </ProgramPanel>
      </section>

      {/* ── Item Distribution + Facility Type pie ────────────────────────── */}
      <section id="di-distribution">
        <ProgramChartRow
          leftTitle="Item Distribution by Source Country"
          leftSubtitle="Recent receives by product and source country"
          leftChart={<ProgramStackedBarChart data={itemDistribution} />}
          rightTitle="Distribution by Source Country"
          rightSubtitle="Receipt country share"
          rightData={groupBy(filteredReceives, 'Country')}
          rightAction={<InfoButton contentId="program-facility-distribution" />}
        />
      </section>

      {/* ── Issued Items ─────────────────────────────────────────────────── */}
      <section id="di-issued">
        <ProgramPanel title="Issued — Center to Zone" subtitle="Issued items by flow type and month" action={<InfoButton contentId="program-issued-items" />}>
          <IssuedItemsTable rows={DI_ISSUED_ROWS} />
        </ProgramPanel>
      </section>

      {/* ── Pipeline: Incoming Shipment + Ownership + Quantity + Funding ─── */}
      <section id="di-pipeline" className="space-y-5">
        <ProgramChartRow
          leftTitle="Pipeline Incoming Shipment"
          leftSubtitle="Purchase order volume by product and funder"
          leftChart={<ProgramStackedBarChart data={pipelineByDonor} />}
          rightTitle="Distribution by Ownership Type"
          rightSubtitle="Availability accountability"
          rightData={ownershipChart}
          rightAction={<InfoButton contentId="program-ownership-distribution" />}
        />
        <ProgramChartRow
          leftTitle="Pipeline Quantity by Item"
          leftSubtitle="Next delivery quantity by product"
          leftChart={
            <ProgramBarChart
              data={groupBy(filteredPOs, 'ProductCN', 'NextDeliveryQuantity').slice(0, 14)}
              valueFormatter={formatCompact}
            />
          }
          rightTitle="Funding Source"
          rightSubtitle="Incoming shipment funder share"
          rightData={donorChart}
          rightAction={<InfoButton contentId="program-funding-source" />}
        />
      </section>

      {/* ── Stock Utilization ─────────────────────────────────────────────── */}
      <section id="di-utilization">
        <ProgramPanel title="Stock Utilization National" subtitle="SOH vs gap to maximum threshold">
          <ProgramStackedBarChart data={stockUtilization} height={260} />
        </ProgramPanel>
      </section>

      {/* ── National MOS ─────────────────────────────────────────────────── */}
      <section id="di-mos">
        <ProgramPanel title="National MOS" subtitle="Months of stock by product">
          <div className="grid grid-cols-3 gap-3 px-5 pt-4 pb-2">
            <KPICard variant="detailed" icon="fa-chart-simple"   iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Actual"          value={mosStats.actual.toFixed(1)} subtitle="avg MOS" />
            <KPICard variant="detailed" icon="fa-bullseye"       iconBg="bg-success/10" iconColor="text-success" label="Ideal"           value={String(mosStats.ideal)}    subtitle="target months" />
            <KPICard variant="detailed" icon="fa-scale-balanced" iconBg={mosStats.gap <= 0 ? 'bg-success/10' : 'bg-warning/10'} iconColor={mosStats.gap <= 0 ? 'text-success' : 'text-warning'} label="Actual vs Ideal" value={`${mosStats.gap > 0 ? '+' : ''}${mosStats.gap.toFixed(1)}`} subtitle={`months ${mosStats.gap <= 0 ? 'below' : 'above'} target`} />
          </div>
          <ProgramBarChart data={mosChart} valueFormatter={(v) => Number(v).toFixed(1)} />
        </ProgramPanel>
      </section>

      {/* ── Manufacturers ─────────────────────────────────────────────────── */}
      <section id="di-manufacturers">
        <ProgramPanel title="Manufacturers" subtitle="Recent received value by manufacturer" action={<InfoButton contentId="program-mini-table" />}>
          <ProgramMiniTable
            columns={[
              { key: 'label', label: 'Manufacturer' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={manufacturerRows}
          />
        </ProgramPanel>
      </section>

      {/* ── Countries ─────────────────────────────────────────────────────── */}
      <section id="di-countries">
        <ProgramPanel title="Countries" subtitle="Recent received value by country" action={<InfoButton contentId="program-mini-table" />}>
          <ProgramMiniTable
            columns={[
              { key: 'label', label: 'Country' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={countryRows}
          />
        </ProgramPanel>
      </section>

    </div>
  );
}

export default DroughtImpact;
