import { useMemo, useState } from 'react';
import ProgramCard from '../components/program/ProgramCard';
import ProgramFilters from '../components/program/ProgramFilters';
import ProgramPanel from '../components/program/ProgramPanel';
import NationalStockTable from '../components/program/NationalStockTable';
import HubHeatmap from '../components/program/HubHeatmap';
import ProgramBarChart from '../components/program/ProgramBarChart';
import PieChart from '../components/PieChart';
import ProgramStackedBarChart from '../components/program/ProgramStackedBarChart';
import ProgramMapPanel from '../components/program/ProgramMapPanel';
import ProgramMiniTable from '../components/program/ProgramMiniTable';
import PurchaseOrderTable from '../components/program/PurchaseOrderTable';
import RecentReceivesTable from '../components/program/RecentReceivesTable';
import { parseCSV, parseQuantity } from '../utils/csvParser';
import { exportDataToCSV } from '../utils/exportCSV';
import stockStatusCsv from '../data/Stock Status_ National.csv?raw';
import hubBreakdownCsv from '../data/Stock on Hand_ Regional Hubs Breakdown.csv?raw';
import purchaseOrdersCsv from '../data/Purchase Order_Incoming Shipments ERP.csv?raw';
import recentReceivesCsv from '../data/Recent Receives.csv?raw';

const formatCompact = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);

const normalizeNumber = (value) => {
  if (typeof value === 'number') return value;
  return parseQuantity(String(value || ''));
};

const getStatusColor = (status) => {
  if (status === 'Stocked Out') return '#BA1A1A';
  if (status === 'Below EOP') return '#D97706';
  if (status === 'Excess') return '#0B4F54';
  return '#059669';
};

const countryCoordinates = {
  China: { x: 73, y: 40 },
  India: { x: 68, y: 52 },
  Kenya: { x: 55, y: 63 },
  Ethiopia: { x: 55, y: 57 },
};

const groupBy = (rows, key, valueKey) => {
  const grouped = rows.reduce((acc, row) => {
    const label = row[key] || 'Unknown';
    acc[label] = (acc[label] || 0) + (valueKey ? row[valueKey] : 1);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

function normalizeStockRows() {
  return parseCSV(stockStatusCsv).map((row) => ({
    ...row,
    SOH: normalizeNumber(row.SOH),
    AMC: normalizeNumber(row.AMC),
    MOS: Number(row.MOS) || 0,
    QuantityPurchaseOrder: normalizeNumber(row.QuantityPurchaseOrder),
    GIT: normalizeNumber(row.GIT),
    Min: normalizeNumber(row.Min),
    Max: normalizeNumber(row.Max),
  }));
}

function normalizeHubRows() {
  const rows = parseCSV(hubBreakdownCsv);
  const productKeys = Object.keys(rows[0] || {}).filter((key) => key && key !== 'Site');

  return {
    products: productKeys,
    rows: rows.map((row) => {
      const next = { Site: row.Site };
      productKeys.forEach((key) => {
        next[key] = normalizeNumber(row[key]);
      });
      return next;
    }),
  };
}

function normalizePurchaseOrders() {
  return parseCSV(purchaseOrdersCsv).map((row) => {
    const ordered = normalizeNumber(row.OrderQuantity);
    const delivered = normalizeNumber(row.DeliveredQuantity);

    return {
      ...row,
      OrderQuantity: ordered,
      NextDeliveryQuantity: normalizeNumber(row.NextDeliveryQuantity),
      DeliveredQuantity: delivered,
      Pending: Number(row.Pending) || 0,
      deliveryProgress: ordered > 0 ? (delivered / ordered) * 100 : 0,
    };
  });
}

function normalizeReceives() {
  return parseCSV(recentReceivesCsv).map((row) => ({
    ...row,
    RowNumber: Number(row.RowNumber) || 0,
    QuantityReceived: normalizeNumber(row.QuantityReceived),
    AmountReceivedBirr: normalizeNumber(row.AmountReceivedBirr),
  }));
}

function includesQuery(row, query) {
  if (!query.trim()) return true;
  const lowered = query.toLowerCase();
  return Object.values(row).some((value) => String(value || '').toLowerCase().includes(lowered));
}

function ProgramDashboard() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('All');
  const [hubTypeFilter, setHubTypeFilter] = useState('All');

  const stockRows = useMemo(() => normalizeStockRows(), []);
  const hubData = useMemo(() => normalizeHubRows(), []);
  const purchaseOrders = useMemo(() => normalizePurchaseOrders(), []);
  const recentReceives = useMemo(() => normalizeReceives(), []);

  const products = useMemo(() => stockRows.map((row) => row.ProductCN).sort(), [stockRows]);

  const filteredStock = useMemo(() => (
    stockRows.filter((row) => (
      includesQuery(row, query) &&
      (!statusFilter || row.SS === statusFilter) &&
      (!productFilter || row.ProductCN === productFilter)
    ))
  ), [stockRows, query, statusFilter, productFilter]);

  const filteredPurchaseOrders = useMemo(() => (
    purchaseOrders.filter((row) => (
      includesQuery(row, query) &&
      (!productFilter || row.ProductCN === productFilter)
    ))
  ), [purchaseOrders, query, productFilter]);

  const filteredReceives = useMemo(() => (
    recentReceives.filter((row) => (
      includesQuery(row, query) &&
      (!productFilter || row.ProductCN === productFilter)
    ))
  ), [recentReceives, query, productFilter]);

  const focusedHubProducts = useMemo(() => {
    if (productFilter && hubData.products.includes(productFilter)) return [productFilter];
    return hubData.products;
  }, [hubData.products, productFilter]);

  const hubSites = useMemo(() => {
    const s = new Set(hubData.rows.map(r => r.Site?.trim()).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [hubData.rows]);

  const productThresholds = useMemo(() => {
    const map = {};
    stockRows.forEach(row => {
      const min = row.Min || 0;
      const max = row.Max || 0;
      map[row.ProductCN] = {
        min,
        max,
        eop: min + max > 0 ? (min + max) / 2 : 0,
      };
    });
    return map;
  }, [stockRows]);

  const filteredHubRows = useMemo(() => {
    let result = hubData.rows;
    if (siteFilter !== 'All') {
      result = result.filter(r => r.Site?.trim() === siteFilter);
    }
    if (hubTypeFilter !== 'All') {
      result = result.filter(r => {
        const site = r.Site?.trim() || '';
        if (hubTypeFilter === 'Hub') return site.includes('Hub');
        if (hubTypeFilter === 'Center') return !site.includes('Hub');
        return true;
      });
    }
    return result;
  }, [hubData.rows, siteFilter, hubTypeFilter]);

  const kpis = useMemo(() => {
    const totalSoh = stockRows.reduce((sum, row) => sum + row.SOH, 0);
    const atRisk = stockRows.filter((row) => row.SS === 'Below EOP' || row.SS === 'Stocked Out').length;
    const git = stockRows.reduce((sum, row) => sum + row.GIT, 0);
    const poQuantity = purchaseOrders.reduce((sum, row) => sum + row.NextDeliveryQuantity, 0);
    const receivedValue = recentReceives.reduce((sum, row) => sum + row.AmountReceivedBirr, 0);

    return { totalSoh, atRisk, git, poQuantity, receivedValue };
  }, [stockRows, purchaseOrders, recentReceives]);

  const statusChart = useMemo(() => {
    const statusCounts = filteredStock.reduce((acc, row) => {
      acc[row.SS] = (acc[row.SS] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([label, value]) => ({
      label,
      value,
      color: getStatusColor(label),
    }));
  }, [filteredStock]);

  const donorChart = useMemo(() => {
    const donorCounts = filteredPurchaseOrders.reduce((acc, row) => {
      acc[row.Donor] = (acc[row.Donor] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(donorCounts).map(([label, value]) => ({ label, value }));
  }, [filteredPurchaseOrders]);

  const hubTotals = useMemo(() => (
    hubData.rows
      .map((row) => ({
        label: row.Site.replace(' Hub', ''),
        value: hubData.products.reduce((sum, product) => sum + (row[product] || 0), 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  ), [hubData]);

  const procurementByAgent = useMemo(() => {
    const topProducts = groupBy(filteredPurchaseOrders, 'ProductCN', 'NextDeliveryQuantity').slice(0, 10).map((item) => item.label);
    const donors = [...new Set(filteredPurchaseOrders.map((row) => row.Donor).filter(Boolean))].slice(0, 4);

    return topProducts.map((product) => ({
      label: product,
      segments: donors.map((donor) => ({
        label: donor.replace('FUND', ''),
        value: filteredPurchaseOrders
          .filter((row) => row.ProductCN === product && row.Donor === donor)
          .reduce((sum, row) => sum + row.NextDeliveryQuantity, 0),
      })),
    }));
  }, [filteredPurchaseOrders]);

  const itemDistribution = useMemo(() => {
    const topProducts = groupBy(filteredReceives, 'ProductCN', 'QuantityReceived').slice(0, 11).map((item) => item.label);
    const countries = [...new Set(filteredReceives.map((row) => row.Country).filter(Boolean))].slice(0, 4);

    return topProducts.map((product) => ({
      label: product,
      segments: countries.map((country) => ({
        label: country,
        value: filteredReceives
          .filter((row) => row.ProductCN === product && row.Country === country)
          .reduce((sum, row) => sum + row.QuantityReceived, 0),
      })),
    }));
  }, [filteredReceives]);

  const pipelineByDonor = useMemo(() => {
    const topProducts = groupBy(filteredPurchaseOrders, 'ProductCN', 'OrderQuantity').slice(0, 12).map((item) => item.label);
    const donors = [...new Set(filteredPurchaseOrders.map((row) => row.Donor).filter(Boolean))].slice(0, 4);

    return topProducts.map((product) => ({
      label: product,
      segments: donors.map((donor) => ({
        label: donor.replace('FUND', ''),
        value: filteredPurchaseOrders
          .filter((row) => row.ProductCN === product && row.Donor === donor)
          .reduce((sum, row) => sum + row.OrderQuantity, 0),
      })),
    }));
  }, [filteredPurchaseOrders]);

  const stockUtilization = useMemo(() => (
    filteredStock.slice(0, 14).map((row) => ({
      label: row.ProductCN,
      segments: [
        { label: 'SOH', value: row.SOH },
        { label: 'Gap to max', value: Math.max(row.Max - row.SOH, 0) },
      ],
    }))
  ), [filteredStock]);

  const mosChart = useMemo(() => (
    filteredStock
      .map((row) => ({ label: row.ProductCN, value: row.MOS, color: getStatusColor(row.SS) }))
      .slice(0, 15)
  ), [filteredStock]);

  const ownershipChart = useMemo(() => {
    const counts = filteredStock.reduce((acc, row) => {
      const owner = row.SS === 'Normal' || row.SS === 'Excess' ? 'Public' : 'Needs follow-up';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [filteredStock]);

  const fundingSourceChart = useMemo(() => donorChart, [donorChart]);

  const manufacturerRows = useMemo(() => (
    groupBy(filteredReceives, 'Manufacturer', 'AmountReceivedBirr').slice(0, 8).map((row) => ({
      ...row,
      share: kpis.receivedValue > 0 ? `${((row.value / kpis.receivedValue) * 100).toFixed(1)}%` : '0%',
    }))
  ), [filteredReceives, kpis.receivedValue]);

  const countryRows = useMemo(() => (
    groupBy(filteredReceives, 'Country', 'AmountReceivedBirr').slice(0, 8).map((row) => ({
      ...row,
      share: kpis.receivedValue > 0 ? `${((row.value / kpis.receivedValue) * 100).toFixed(1)}%` : '0%',
    }))
  ), [filteredReceives, kpis.receivedValue]);

  const supplyPoints = useMemo(() => (
    filteredReceives.map((row, index) => {
      const base = countryCoordinates[row.Country] || { x: 48, y: 52 };
      return {
        label: `${row.ProductCN} from ${row.Country}`,
        x: Math.min(Math.max(base.x + ((index % 5) - 2) * 1.4, 8), 92),
        y: Math.min(Math.max(base.y + ((index % 4) - 1.5) * 1.8, 12), 82),
      };
    })
  ), [filteredReceives]);

  const facilityPoints = useMemo(() => (
    hubData.rows.flatMap((row, hubIndex) => (
      focusedHubProducts.map((product, productIndex) => ({
        label: `${row.Site} / ${product}`,
        x: 38 + ((hubIndex * 7 + productIndex * 3) % 25),
        y: 32 + ((hubIndex * 5 + productIndex * 9) % 38),
      }))
    ))
  ), [hubData.rows, focusedHubProducts]);

  const hasFilters = Boolean(query.trim() || statusFilter || productFilter);

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('');
    setProductFilter('');
  };

  const exportProgramData = () => {
    exportDataToCSV(filteredStock, ['ProductCN', 'SS', 'SOH', 'AMC', 'MOS', 'QuantityPurchaseOrder', 'GIT', 'Min', 'Max'], 'Program_Stock_Status.csv');
  };

  const [showDashboard] = useState(false);

  if (!showDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <i className="fa-solid fa-code-branch text-2xl"></i>
        </div>
        <h2 className="text-headline-lg font-bold text-on-surface">Under Development</h2>
        <p className="text-body-md text-on-surface-variant max-w-md">The Program Dashboard is currently being built and will be available soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {['Child Health', 'Clinical Chemistry', 'Drought Impact', 'Family Planning', 'HIV Adult', 'HIV Pediatric', 'HIV Test', 'Leprosy', 'LLIN', 'Malaria', 'Maternal Health', 'MDR - TB', 'Neglected Tropical Diseases', 'Nutrition', 'RDF', 'TB'].map((item) => (
          <span
            key={item}
            className={`px-2 py-1 rounded text-[11px] font-bold text-center truncate ${item === 'Child Health' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-outline-variant'}`}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-3">
        <ProgramCard icon="fa-boxes-stacked" label="SOH" value={formatCompact(kpis.totalSoh)} helper={`${stockRows.length} SKUs`} tone="success" />
        <ProgramCard icon="fa-truck-ramp-box" label="Issued" value={formatCompact(recentReceives.reduce((sum, row) => sum + row.QuantityReceived, 0))} helper="recent receives" tone="info" />
        <ProgramCard icon="fa-layer-group" label="Planned" value={formatCompact(kpis.poQuantity)} helper={`${purchaseOrders.length} PO lines`} tone="neutral" />
        <ProgramCard icon="fa-route" label="GIT" value={formatCompact(kpis.git)} helper="in transit" tone="success" />
        <ProgramCard icon="fa-circle-exclamation" label="Expired" value={kpis.atRisk} helper="risk items" tone={kpis.atRisk ? 'error' : 'success'} />
        <ProgramCard icon="fa-clock-rotate-left" label="Re Expiry" value={stockRows.filter((row) => row.MOS < 3).length} helper="MOS below 3" tone="warning" />
      </div>

      <ProgramFilters
        query={query}
        onQueryChange={setQuery}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        product={productFilter}
        onProductChange={setProductFilter}
        products={products}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      <ProgramPanel
        title="Stock Status National"
        subtitle={`${filteredStock.length} of ${stockRows.length} products`}
        action={<span className="text-[11px] font-bold text-on-surface-variant">Rows per page 15</span>}
      >
        <NationalStockTable rows={filteredStock} />
      </ProgramPanel>

      <ProgramPanel
        title="Stock on Hand Regional Hubs Breakdown"
        subtitle={productFilter ? `${productFilter} across ${filteredHubRows.length} locations` : `${focusedHubProducts.length} product columns across ${filteredHubRows.length} locations`}
        action={(
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value)}
                className="appearance-none h-9 min-w-[120px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                {hubSites.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All' : s}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={hubTypeFilter}
                onChange={e => setHubTypeFilter(e.target.value)}
                className="appearance-none h-9 min-w-[110px] rounded-lg border border-outline-variant bg-white px-3 pr-8 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Hub">Hub</option>
                <option value="Center">Center</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-primary pointer-events-none" />
            </div>
            <span className="inline-flex h-9 rounded-lg border border-outline-variant bg-white px-3 text-body-md font-semibold text-primary">
              06/16/2026
            </span>
          </div>
        )}
      >
        <HubHeatmap rows={filteredHubRows} products={focusedHubProducts} thresholds={productThresholds} />
      </ProgramPanel>

      <div className="grid grid-cols-3 gap-5">
        <ProgramPanel title="Item Procurement By Agent" subtitle="Incoming quantity by funding source" className="col-span-2">
          <ProgramStackedBarChart data={procurementByAgent} />
        </ProgramPanel>
        <ProgramPanel title="Procurement Agents" subtitle="PO line share">
          <PieChart data={donorChart} />
        </ProgramPanel>
      </div>

      <ProgramPanel title="Purchase Order Incoming Shipments ERP" subtitle={`${filteredPurchaseOrders.length} open delivery records`}>
        <PurchaseOrderTable rows={filteredPurchaseOrders.slice(0, 12)} />
      </ProgramPanel>

      <ProgramPanel title="Recent Receives" subtitle={`${filteredReceives.length} receipt records, ${formatNumber(kpis.receivedValue)} ETB total value`}>
        <RecentReceivesTable rows={filteredReceives.slice(0, 10)} />
      </ProgramPanel>

      <ProgramMapPanel
        title="Global Supply Routes Shipment Data"
        subtitle="Shipment origins represented from recent receipt records"
        points={supplyPoints}
      />

      <div className="grid grid-cols-3 gap-5">
        <ProgramPanel title="Item Distribution by Facility Type" subtitle="Recent receives by product and source country" className="col-span-2">
          <ProgramStackedBarChart data={itemDistribution} />
        </ProgramPanel>
        <ProgramPanel title="Distribution by Facility Type" subtitle="Receipt country share">
          <PieChart data={groupBy(filteredReceives, 'Country')} />
        </ProgramPanel>
      </div>

      <ProgramPanel title="Issue Data Facility" subtitle="Facility issue feed placeholder until facility issue CSV is supplied">
        <ProgramMiniTable
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'region', label: 'Region-Zone-Woreda' },
            { key: 'item', label: 'Item' },
            { key: 'facility', label: 'Facility' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'invoice', label: 'Invoice' },
            { key: 'issued', label: 'Issued To' },
          ]}
          rows={[]}
        />
      </ProgramPanel>

      <ProgramMapPanel
        title="Facility Distribution"
        subtitle="Hub-linked facility reference pattern"
        focus="facility"
        points={facilityPoints}
      />

      <div className="grid grid-cols-3 gap-5">
        <ProgramPanel title="Pipeline Incoming Shipment" subtitle="Purchase order volume by product and funder" className="col-span-2">
          <ProgramStackedBarChart data={pipelineByDonor} />
        </ProgramPanel>
        <ProgramPanel title="Distribution by Ownership Type" subtitle="Availability accountability">
          <PieChart data={ownershipChart} />
        </ProgramPanel>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <ProgramPanel title="Pipeline Quantity by Item" subtitle="Next delivery quantity by product" className="col-span-2">
          <ProgramBarChart data={groupBy(filteredPurchaseOrders, 'ProductCN', 'NextDeliveryQuantity').slice(0, 14)} valueFormatter={formatCompact} />
        </ProgramPanel>
        <ProgramPanel title="Funding Source" subtitle="Incoming shipment funder share">
          <PieChart data={fundingSourceChart} />
        </ProgramPanel>
      </div>

      <ProgramPanel title="Stock Utilization National" subtitle="Current SOH compared with gap to maximum threshold">
        <ProgramStackedBarChart data={stockUtilization} height={260} />
      </ProgramPanel>

      <ProgramPanel title="National MOS" subtitle="Months of stock by national product">
        <ProgramBarChart data={mosChart} valueFormatter={(value) => Number(value).toFixed(1)} />
      </ProgramPanel>

      <ProgramPanel title="Manufacturers" subtitle="Recent received value by manufacturer">
        <ProgramMiniTable
          columns={[
            { key: 'label', label: 'Manufacturer' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
          rows={manufacturerRows}
        />
      </ProgramPanel>

      <ProgramPanel title="Countries" subtitle="Recent received value by country">
        <ProgramMiniTable
          columns={[
            { key: 'label', label: 'Country' },
            { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
            { key: 'share', label: 'Share' },
          ]}
          rows={countryRows}
        />
      </ProgramPanel>
    </div>
  );
}

export default ProgramDashboard;
