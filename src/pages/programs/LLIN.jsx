import { useMemo } from 'react';
import KPICard from '../../components/KPICard';
import ProgramPanel from '../../components/program/ProgramPanel';
import SectionNavigator from '../../components/SectionNavigator';
import ProgramStackedBarChart from '../../components/program/ProgramStackedBarChart';
import ProgramBarChart from '../../components/program/ProgramBarChart';
import ProgramMiniTable from '../../components/program/ProgramMiniTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PieChart from '../../components/PieChart';
import InfoButton from '../../components/InfoButton';
import ExpandButton from '../../components/ExpandButton';


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
  const totalSoh = stockStatusRows.reduce((s, r) => s + r.soh, 0);
  const totalOrdered = purchaseOrderRows.reduce((s, r) => s + r.ordered, 0);
  const totalShipped = purchaseOrderRows.reduce((s, r) => s + r.shipped, 0);
  const totalReceived = purchaseOrderRows.reduce((s, r) => s + r.received, 0);
  const totalPending = purchaseOrderRows.reduce((s, r) => s + r.pending, 0);

  const fundingSourceChart = [
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
          <ProgramPanel title="Account Breakdown" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Account' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share', render: (row) => `${((row.value / accountData.reduce((s, r) => s + r.value, 0)) * 100).toFixed(1)}%` },
              ]}
              rows={accountData}
            />
          </ProgramPanel>
          <ProgramPanel title="Activity SOH" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Activity' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
              ]}
              rows={activityData}
            />
          </ProgramPanel>
          <ProgramPanel title="Unit SOH" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Unit' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
              ]}
              rows={unitData}
            />
          </ProgramPanel>
          <ProgramPanel title="Manufacturer Summary" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Manufacturer' },
                { key: 'value', label: 'Quantity', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share', render: (row) => `${((row.value / manufacturerData.reduce((s, r) => s + r.value, 0)) * 100).toFixed(1)}%` },
              ]}
              rows={manufacturerData}
            />
          </ProgramPanel>
        </div>
      </section>

      {/* ── Stock Status ────────────────────────────────────────────────── */}
      <section id="llin-stock">
        <ProgramPanel title="Stock Status" subtitle="LLIN national stock levels" action={<InfoButton contentId="program-mini-table" />}>
          <ProgramMiniTable
            columns={[
              { key: 'item', label: 'Item' },
              { key: 'status', label: 'Status', render: (row) => (
                <span className="inline-flex rounded bg-warning/15 px-2.5 py-1 text-[11px] font-bold text-warning">{row.status}</span>
              )},
              { key: 'soh', label: 'SOH', render: (row) => formatNumber(row.soh) },
              { key: 'mos', label: 'MOS', render: (row) => row.mos.toFixed(1) },
              { key: 'amc', label: 'AMC', render: (row) => formatNumber(row.amc) },
              { key: 'min', label: 'Min', render: (row) => formatNumber(row.min) },
              { key: 'max', label: 'Max', render: (row) => formatNumber(row.max) },
              { key: 'planned', label: 'Planned' },
              { key: 'git', label: 'GIT' },
            ]}
            rows={stockStatusRows}
          />
        </ProgramPanel>
      </section>

      {/* ── Procurement ─────────────────────────────────────────────────── */}
      <section id="llin-procurement">
        <div className="grid grid-cols-2 gap-5">
          <ProgramPanel title="Funding Source" subtitle="Procurement funding share" action={<div className="flex items-center gap-1"><ExpandButton data={fundingSourceChart} title="Funding Source" /><InfoButton contentId="program-funding-source" /></div>}>
            <div className="flex h-64 items-center justify-center">
              <div className="w-[320px]">
                <PieChart data={fundingSourceChart} totalLabel="Funding source" />
              </div>
            </div>
          </ProgramPanel>
          <ProgramPanel title="Distribution by Facility Type" subtitle="Receipt facility share" action={<div className="flex items-center gap-1"><ExpandButton data={facilityTypeChart} title="Distribution by Facility Type" /><InfoButton contentId="program-facility-distribution" /></div>}>
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
          subtitle={`${purchaseOrderRows.length} PO records`}
          action={<InfoButton contentId="program-mini-table" />}
        >
          <ProgramMiniTable
            columns={[
              { key: 'po', label: 'PO Number' },
              { key: 'donor', label: 'Donor' },
              { key: 'procurer', label: 'Procurer' },
              { key: 'orderDate', label: 'Order Date' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'ordered', label: 'Ordered', render: (row) => formatNumber(row.ordered) },
              { key: 'shipped', label: 'Shipped', render: (row) => formatNumber(row.shipped) },
              { key: 'received', label: 'Received', render: (row) => formatNumber(row.received) },
              { key: 'pending', label: 'Pending', render: (row) => formatNumber(row.pending) },
              { key: 'completed', label: 'Completed', render: (row) => (
                <span className="inline-flex rounded bg-[#2563EB] px-2 py-1 text-[11px] font-bold text-white">{row.completed}</span>
              )},
            ]}
            rows={purchaseOrderRows}
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
          <ProgramMiniTable
            columns={[
              { key: 'region', label: 'Region' },
              { key: 'zone', label: 'Zone' },
              { key: 'woreda', label: 'Woreda' },
              { key: 'planned', label: 'Planned Qty.', render: (row) => formatNumber(row.planned) },
              { key: 'actual', label: 'Actual Qty.', render: (row) => formatNumber(row.actual) },
              { key: 'fillRate', label: 'Fill rate' },
            ]}
            rows={distributionRows}
          />
        </div>
      </section>

      {/* ── Issued ──────────────────────────────────────────────────────── */}
      <section id="llin-issued">
        <ProgramPanel title="Issued — Center to Hub" subtitle="Issued items by flow type and month" action={<InfoButton contentId="program-issued-items" />}>
          <IssuedItemsTable rows={[]} />
        </ProgramPanel>
      </section>

      {/* ── Manufacturers ───────────────────────────────────────────────── */}
      <section id="llin-manufacturers">
        <div className="grid grid-cols-[1fr_380px] gap-5">
          <ProgramPanel title="Manufacturer Quantity Breakdown" subtitle="Total quantity received by manufacturer">
            <ProgramBarChart
              data={manufacturerData.map((m, i) => ({
                ...m,
                color: ['#0B4F54', '#216E6A', '#4A9598', '#86BFC5', '#515F74'][i],
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          </ProgramPanel>
          <ProgramPanel title="Account Distribution" subtitle="Quantity by funding account" action={<div className="flex items-center gap-1"><ExpandButton data={accountData.map((a, i) => ({ ...a, color: ['#0B4F54', '#86BFC5'][i] }))} title="Account Distribution" /><InfoButton contentId="program-account-distribution" /></div>}>
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