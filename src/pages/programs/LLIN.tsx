import { useMemo, useState, useEffect, useCallback } from 'react';
import KPICard from '../../components/KPICard';
import ProgramPanel from '../../components/program/ProgramPanel';
import SectionNavigator from '../../components/SectionNavigator';
import ProgramStackedBarChart from '../../components/program/ProgramStackedBarChart';
import ProgramBarChart from '../../components/program/ProgramBarChart';
import BaseTable from '../../components/BaseTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PieChart from '../../components/PieChart';
import IconButton from '../../components/IconButton';
import { MainDashboard_WebApi } from '../../api/fanos.ts';
const postApiStockStatusGetStockStatus: any = (window as any).postApiStockStatusGetStockStatus || (() => Promise.resolve({ data: { model: [] } }));

const formatNumber = (value) => new Intl.NumberFormat('en').format(value || 0);
const formatCompact = (v) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);

const stockStatusRows = [
  {
    item: 'LLIN.',
    status: 'Below Min',
    soh: 101681,
    mos: 4.3,
    planned: '0 (0)',
    git: '0 (0)',
    amc: 23909,
    min: 143453,
    max: 310815,
  },
];

const purchaseOrderRows = [
  {
    po: 'Non Standard-SD23100116-1',
    donor: 'Global Fund',
    procurer: 'IDA Foundation',
    orderDate: 'Aug 1st, 2023',
    supplier: 'IDA Foundation',
    ordered: 334333,
    shipped: 334333,
    received: 334283,
    pending: 50,
    completed: '100%',
  },
];

const distributionRows = [
  { id: 3, region: 'Addis Ababa', zone: 'Arada Sub City', woreda: 'Arada Sub City', planned: 0, actual: 3000, fillRate: 'Nav' },
  { id: 12, region: 'Addis Ababa', zone: 'Kirkos Sub City', woreda: 'Kirkos Sub City', planned: 0, actual: 3000, fillRate: 'Nav' },
  { id: 13, region: 'Addis Ababa', zone: 'Kolfe Keraniyo Sub City', woreda: 'Kolfe Keraniyo Sub City', planned: 0, actual: 4000, fillRate: 'Nav' },
  { id: 14, region: 'Amhara', zone: 'South Gondar', woreda: 'Lay Gayint', planned: 0, actual: 50, fillRate: 'Nav' },
  { id: 17, region: 'Amhara', zone: 'Waghemira', woreda: 'Sehala', planned: 0, actual: 11555, fillRate: 'Nav' },
  { id: 18, region: 'Amhara', zone: 'Waghemira', woreda: 'Sekota Zuria', planned: 0, actual: 3044, fillRate: 'Nav' },
  { id: 19, region: 'Amhara', zone: 'Waghemira', woreda: 'Ziquala', planned: 0, actual: 21512, fillRate: 'Nav' },
  { id: 1, region: 'Oromia', zone: 'Addis Ababa', woreda: 'Addis Ababa', planned: 0, actual: 6000, fillRate: 'Nav' },
  { id: 2, region: 'Oromia', zone: 'West Shewa', woreda: 'Ambo/Town', planned: 0, actual: 96450, fillRate: 'Nav' },
  { id: 4, region: 'Oromia', zone: 'Buno Bedelle', woreda: 'Bedelle Woreda', planned: 0, actual: 48600, fillRate: 'Nav' },
];

const manufacturerData = [
  { label: 'China Jiujianghealth textile ind.', value: 156833 },
  { label: 'Tianjin Yorkool International', value: 106496 },
  { label: 'VESTER GAARD Frandsen Group SCo.', value: 9001 },
  { label: 'V.K.A.Polymers.Pvt.Ltd', value: 1123 },
  { label: 'SHOBIKAA IMPLEX PRIVATE LIMITED', value: 13 },
];

const accountData = [
  { label: 'MOH', value: 273453 },
  { label: 'PSM', value: 13 },
];

const unitData = [
  { label: 'Each', value: 101701 },
];

const activityData = [
  { label: 'Malaria', value: 273466 },
];

const LLIN_SECTIONS = [
  { id: 'llin-overview',      label: 'Overview' },
  { id: 'llin-stock',         label: 'Stock Status' },
  { id: 'llin-procurement',   label: 'Procurement' },
  { id: 'llin-po',            label: 'Purchase Orders' },
  { id: 'llin-distribution',  label: 'Distribution' },
  { id: 'llin-issued',        label: 'Issued' },
  { id: 'llin-manufacturers', label: 'Manufacturers' },
];

function LlinProgram() {
  // ── API state ──────────────────────────────────────────────────────────
  const [apiStockRows, setApiStockRows] = useState([]);
  const [apiDonors, setApiDonors] = useState([]);
  const [apiProcurers, setApiProcurers] = useState([]);
  const [apiManufacturers, setApiManufacturers] = useState([]);
  const [apiOrders, setApiOrders] = useState([]);
  const [apiSOH, setApiSOH] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PROGRAM_CODE = 'LLIN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        MainDashboard_WebApi.getDonor(PROGRAM_CODE).catch(() => ({ data: { Data: [] } })),
        MainDashboard_WebApi.getProcurer(PROGRAM_CODE).catch(() => ({ data: { Data: [] } })),
        MainDashboard_WebApi.getManufacturerList(PROGRAM_CODE).catch(() => ({ data: { Data: [] } })),
        MainDashboard_WebApi.getOrder(PROGRAM_CODE).catch(() => ({ data: { Data: [] } })),
        MainDashboard_WebApi.getSOH(PROGRAM_CODE).catch(() => ({ data: { Data: [] } })),
        postApiStockStatusGetStockStatus({ commodityType: 'LLIN' }).catch(() => ({ data: { model: [] } })),
      ]);

      const getData = (result, fallback = []) =>
        result.status === 'fulfilled' ? (result.value?.data?.Data || result.value?.data?.model || fallback) : fallback;

      const rawStock = getData(results[5]);
      if (rawStock.length > 0) {
        setApiStockRows(rawStock.map((r) => ({
          ProductCN: r.item || '',
          SS: r.status || 'Normal',
          SOH: r.storeSoh || 0,
          AMC: r.amc || 0,
          MOS: r.mos || 0,
          QuantityPurchaseOrder: r.receivedQuantity || 0,
          GIT: 0,
          Min: 0,
          Max: 0,
        })));
      }

      setApiDonors(getData(results[0]));
      setApiProcurers(getData(results[1]));

      const rawManufacturers = getData(results[2]);
      if (rawManufacturers.length > 0) {
        setApiManufacturers(rawManufacturers.map((r) => ({
          label: r.Name || r.Manufacturer || '',
          value: r.AmountReceivedBirr || r.AmountReceived || 0,
          share: '',
        })));
      }

      const rawOrders = getData(results[3]);
      if (rawOrders.length > 0) {
        setApiOrders(rawOrders.map((r) => ({
          ProductCN: r.ProductCN || r.Item || '',
          Donor: r.FundingSource || '',
          Procurer: r.Procurer || '',
          Supplier: r.Supplier || '',
          OrderQuantity: r.AmountOrdered || 0,
          DeliveredQuantity: r.AmountReceived || 0,
          NextDeliveryQuantity: 0,
          Pending: Math.max((r.AmountOrdered || 0) - (r.AmountReceived || 0), 0),
          deliveryProgress: r.AmountOrdered > 0 ? ((r.AmountReceived / r.AmountOrdered) * 100) : 0,
        })));
      }

      const sohData = getData(results[4]);
      setApiSOH(sohData.reduce((s, r) => s + (r.SOHValue || r.AmountReceived || 0), 0));
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData() }, [fetchData]);

  // ── Use API data (with inline hardcoded fallbacks) ─────────────────────
  const stockRows = apiStockRows.length > 0 ? apiStockRows : stockStatusRows;
  const purchaseOrders = apiOrders.length > 0 ? apiOrders : purchaseOrderRows;
  const manufacturers = apiManufacturers.length > 0 ? apiManufacturers : manufacturerData;

  const totalSoh = stockRows.reduce((s, r) => s + (r.SOH || r.soh || 0), 0);
  const totalOrdered = purchaseOrders.reduce((s, r) => s + (r.OrderQuantity || r.ordered || 0), 0);
  const totalShipped = purchaseOrders.reduce((s, r) => s + (r.DeliveredQuantity || r.shipped || 0), 0);
  const totalReceived = purchaseOrders.reduce((s, r) => s + (r.AmountReceived || r.received || 0), 0);
  const totalPending = purchaseOrders.reduce((s, r) => s + (r.Pending || r.pending || 0), 0);

  // Derive chart data from API donors
  const apiFundingChart = useMemo(() => {
    if (apiDonors.length === 0) return [];
    const grouped = apiDonors.reduce((acc, r) => {
      const label = r.FundingSource || r.Donor || 'Other';
      acc[label] = (acc[label] || 0) + (r.AmountReceived || 1);
      return acc;
    }, {});
    return Object.entries(grouped).map(([label, value]) => ({
      label,
      value,
      color: ['#0B4F54', '#86BFC5', '#216E6A', '#4A9598', '#515F74', '#D97706'][Object.keys(grouped).indexOf(label) % 6],
    }));
  }, [apiDonors]);

  const fundingSourceChart = apiFundingChart.length > 0 ? apiFundingChart : [
    { label: 'Global Fund', value: 44.6, color: '#86BFC5' },
    { label: 'MOH', value: 55.4, color: '#0B4F54' },
  ];

  const facilityTypeChart = [
    { label: 'Woreda', value: 97.3, color: '#0B4F54' },
    { label: 'Health Center', value: 1.8, color: '#86BFC5' },
    { label: 'Hospital', value: 0.9, color: '#216E6A' },
    { label: 'Others', value: 0.0, color: '#D97706' },
  ];

  const plannedVsActualChart = useMemo(() =>
    distributionRows.map((row) => ({
      label: row.woreda,
      segments: [
        { label: 'Planned', value: row.planned },
        { label: 'Actual', value: row.actual },
      ],
    })),
  []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-body-md text-on-surface-variant">Loading LLIN data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <i className="fa-solid fa-circle-exclamation text-2xl text-error" />
        </div>
        <h2 className="text-headline-sm font-bold text-on-surface">Failed to Load Data</h2>
        <p className="text-body-md text-on-surface-variant max-w-md">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-primary text-white rounded-lg text-body-md hover:bg-primary-hover transition-colors">
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
        <div className="grid grid-cols-6 gap-3">
          <KPICard variant="detailed" icon="fa-boxes-stacked"      iconBg="bg-success/10" iconColor="text-success" label="SOH"     value={formatCompact(totalSoh)}     subtitle="current stock" />
          <KPICard variant="detailed" icon="fa-cart-shopping"       iconBg="bg-surface-container" iconColor="text-primary" label="Ordered" value={formatCompact(totalOrdered)} subtitle="total PO quantity" />
          <KPICard variant="detailed" icon="fa-truck-fast"          iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Shipped" value={formatCompact(totalShipped)} subtitle="total shipped" />
          <KPICard variant="detailed" icon="fa-warehouse"           iconBg="bg-success/10" iconColor="text-success" label="Received"value={formatCompact(totalReceived)}subtitle="total received" />
          <KPICard variant="detailed" icon="fa-clock-rotate-left"   iconBg="bg-warning/10" iconColor="text-warning" label="Pending" value={formatCompact(totalPending)} subtitle="pending delivery" />
          <KPICard variant="detailed" icon="fa-circle-exclamation"  iconBg="bg-warning/10" iconColor="text-warning" label="Damaged" value="10.9K"                        subtitle="reported damage" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <ProgramPanel title="Account Breakdown" action={<IconButton variant="info" contentId="program-mini-table" />}>
          <BaseTable
            columns={[
              { key: 'label', label: 'Account' },
              { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share', render: (row) => `${((row.value / accountData.reduce((s, r) => s + r.value, 0)) * 100).toFixed(1)}%` },
            ]}
            rows={accountData}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
          </ProgramPanel>
          <ProgramPanel title="Activity SOH" action={<IconButton variant="info" contentId="program-mini-table" />}>
            <BaseTable
            columns={[
              { key: 'label', label: 'Activity' },
              { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
            ]}
            rows={activityData}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
          </ProgramPanel>
          <ProgramPanel title="Unit SOH" action={<IconButton variant="info" contentId="program-mini-table" />}>
            <BaseTable
            columns={[
              { key: 'label', label: 'Unit' },
              { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
            ]}
            rows={unitData}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
          </ProgramPanel>
          <ProgramPanel title="Manufacturer Summary" action={<IconButton variant="info" contentId="program-mini-table" />}>
            <BaseTable
            columns={[
              { key: 'label', label: 'Manufacturer' },
              { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share', render: (row) => `${((row.value / manufacturers.reduce((s, r) => s + r.value, 0)) * 100).toFixed(1)}%` },
            ]}
            rows={manufacturers}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
          </ProgramPanel>
        </div>
      </section>

      {/* ── Stock Status ────────────────────────────────────────────────── */}
      <section id="llin-stock">
        <ProgramPanel title="Stock Status" subtitle="LLIN national stock levels" action={<IconButton variant="info" contentId="program-mini-table" />}>
          <BaseTable
            columns={[
              { key: 'item', label: 'Item' },
              { key: 'status', label: 'Status', render: (row) => (
                <span className="inline-flex rounded bg-warning/15 px-2.5 py-1 text-[11px] font-bold text-warning">{row.SS || row.status}</span>
              )},
              { key: 'soh', label: 'SOH', render: (row) => formatNumber(row.SOH || row.soh || 0) },
              { key: 'mos', label: 'MOS', render: (row) => (row.MOS || row.mos || 0).toFixed(1) },
              { key: 'amc', label: 'AMC', render: (row) => formatNumber(row.AMC || row.amc || 0) },
              { key: 'min', label: 'Min', render: (row) => formatNumber(row.Min || row.min || 0) },
              { key: 'max', label: 'Max', render: (row) => formatNumber(row.Max || row.max || 0) },
              { key: 'planned', label: 'Planned' },
              { key: 'git', label: 'GIT' },
            ]}
            rows={stockRows}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
      </section>

      {/* ── Procurement ─────────────────────────────────────────────────── */}
      <section id="llin-procurement">
        <div className="grid grid-cols-2 gap-5">
          <ProgramPanel title="Funding Source" subtitle="Procurement funding share" action={<div className="flex items-center gap-1"><IconButton variant="expand" data={fundingSourceChart} title="Funding Source" /><IconButton variant="info" contentId="program-funding-source" /></div>}>
            <div className="flex h-64 items-center justify-center">
              <div className="w-[320px]">
                <PieChart data={fundingSourceChart} totalLabel="Funding source" />
              </div>
            </div>
          </ProgramPanel>
          <ProgramPanel title="Distribution by Facility Type" subtitle="Receipt facility share" action={<div className="flex items-center gap-1"><IconButton variant="expand" data={facilityTypeChart} title="Distribution by Facility Type" /><IconButton variant="info" contentId="program-facility-distribution" /></div>}>
            <div className="flex h-64 items-center justify-center">
              <div className="w-[320px]">
                <PieChart data={facilityTypeChart} totalLabel="Facility distribution" />
              </div>
            </div>
          </ProgramPanel>
        </div>
      </section>

      {/* ── Purchase Orders ─────────────────────────────────────────────── */}
      <section id="llin-po">
        <ProgramPanel
          title="Purchase Orders"
          subtitle={`${purchaseOrders.length} PO records`}
          action={<IconButton variant="info" contentId="program-mini-table" />}
        >
          <BaseTable
            columns={[
              { key: 'po', label: 'PO Number' },
              { key: 'donor', label: 'Donor' },
              { key: 'procurer', label: 'Procurer' },
              { key: 'orderDate', label: 'Order Date' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'ordered', label: 'Ordered', render: (row) => formatNumber(row.OrderQuantity || row.ordered || 0) },
              { key: 'shipped', label: 'Shipped', render: (row) => formatNumber(row.DeliveredQuantity || row.shipped || 0) },
              { key: 'received', label: 'Received', render: (row) => formatNumber(row.AmountReceived || row.received || 0) },
              { key: 'pending', label: 'Pending', render: (row) => formatNumber(row.Pending || row.pending || 0) },
              { key: 'completed', label: 'Completed', render: (row) => (
                <span className="inline-flex rounded bg-[#2563EB] px-2 py-1 text-[11px] font-bold text-white">{row.completed || 'N/A'}</span>
              )},
            ]}
            rows={purchaseOrders}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </ProgramPanel>
      </section>

      {/* ── Distribution ────────────────────────────────────────────────── */}
      <section id="llin-distribution">
        <ProgramPanel
          title="Distribution: Planned vs Actual"
          subtitle={`${distributionRows.length} distribution records by woreda`}
        >
          <ProgramStackedBarChart data={plannedVsActualChart} height={240} />
        </ProgramPanel>
        <div className="mt-5">
          <BaseTable
            columns={[
              { key: 'region', label: 'Region' },
              { key: 'zone', label: 'Zone' },
              { key: 'woreda', label: 'Woreda' },
              { key: 'planned', label: 'Planned Qty.', render: (row) => formatNumber(row.planned) },
              { key: 'actual', label: 'Actual Qty.', render: (row) => formatNumber(row.actual) },
              { key: 'fillRate', label: 'Fill rate' },
            ]}
            rows={distributionRows}
            headerBg="bg-[#CFD8DC]"
            minWidth="520px"
            rowKey={(row, index) => row.id || index}
            rowClassName="hover:bg-surface-container-low"
          />
        </div>
      </section>

      {/* ── Issued ──────────────────────────────────────────────────────── */}
      <section id="llin-issued">
        <ProgramPanel title="Issued — Center to Hub" subtitle="Issued items by flow type and month" action={<IconButton variant="info" contentId="program-issued-items" />}>
          <IssuedItemsTable rows={[]} />
        </ProgramPanel>
      </section>

      {/* ── Manufacturers ───────────────────────────────────────────────── */}
      <section id="llin-manufacturers">
        <div className="grid grid-cols-[1fr_380px] gap-5">
          <ProgramPanel title="Manufacturer Quantity Breakdown" subtitle="Total quantity received by manufacturer">
            <ProgramBarChart
              data={manufacturers.map((m, i) => ({
                ...m,
                color: ['#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74'][i % 5],
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          </ProgramPanel>
          <ProgramPanel title="Account Distribution" subtitle="Quantity by funding account" action={<div className="flex items-center gap-1"><IconButton variant="expand" data={accountData.map((a, i) => ({ ...a, color: ['#0B4F54', '#86BFC5'][i] }))} title="Account Distribution" /><IconButton variant="info" contentId="program-account-distribution" /></div>}>
            <div className="flex items-center justify-center py-4">
              <div className="w-[280px]">
                <PieChart
                  data={accountData.map((a, i) => ({
                    ...a,
                    color: ['#0B4F54', '#86BFC5'][i],
                  }))}
                  totalLabel="Account distribution"
                />
              </div>
            </div>
          </ProgramPanel>
        </div>
      </section>

    </div>
  );
}

export default LlinProgram;