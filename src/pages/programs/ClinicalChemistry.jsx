import { useMemo } from 'react';
import KPICard from '../../components/KPICard';
import ProgramPanel from '../../components/program/ProgramPanel';
import ProgramSectionNav from '../../components/program/ProgramSectionNav';
import ProgramStackedBarChart from '../../components/program/ProgramStackedBarChart';
import ProgramMiniTable from '../../components/program/ProgramMiniTable';
import NationalStockTable from '../../components/program/NationalStockTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PieChart from '../../components/PieChart';
import {
  ccStockRows,
  ccProcurementByAgent,
  ccDonorChart,
  ccFundingChart,
  ccFacilityDistribution,
  ccOwnershipDistribution,
  ccIssuedRows,
  ccManufacturers,
  ccSuppliers,
  ccCountries,
} from '../../data/clinicalChemistryData';

const formatCompact = (v) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
const formatNumber = (v) => new Intl.NumberFormat('en').format(v || 0);

const CC_SECTIONS = [
  { id: 'cc-kpis',         label: 'Overview' },
  { id: 'cc-distribution', label: 'Distribution' },
  { id: 'cc-agents',       label: 'Procurement Agents' },
  { id: 'cc-stock',        label: 'Stock Status' },
  { id: 'cc-issued',       label: 'Issued' },
  { id: 'cc-manufacturer', label: 'Manufacturer' },
  { id: 'cc-supplier',     label: 'Supplier' },
  { id: 'cc-country',      label: 'Country' },
];

function ClinicalChemistry({ programType = 'HPR' }) {

  const kpis = useMemo(() => ({
    soh:        ccStockRows.reduce((s, r) => s + r.SOH, 0),
    ordered:    ccStockRows.reduce((s, r) => s + r.QuantityPurchaseOrder, 0),
    qit:        ccStockRows.reduce((s, r) => s + r.GIT, 0),
    expired:    0,
    nearExpiry: ccStockRows.filter((r) => r.MOS > 0 && r.MOS < 3).length,
    damaged:    0,
    gap:        ccStockRows.filter((r) => r.SS === 'Stocked Out' || r.SS === 'Below EOP').length,
    overage:    ccStockRows.filter((r) => r.SS === 'Excess').length,
  }), []);

  return (
    <div className="space-y-5">

      <ProgramSectionNav sections={CC_SECTIONS} />

      {/* ── Overview: KPI cards ──────────────────────────────────────────── */}
      <section id="cc-kpis">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
          <KPICard variant="detailed" icon="fa-boxes-stacked"        iconBg="bg-surface-container" iconColor="text-primary" label="SOH"        value={formatCompact(kpis.soh)}     subtitle={`${ccStockRows.length} SKUs`} />
          <KPICard variant="detailed" icon="fa-cart-shopping"        iconBg="bg-[#3B82F6]/10" iconColor="text-[#3B82F6]" label="Ordered"    value={formatCompact(kpis.ordered)} subtitle="in purchase orders" />
          <KPICard variant="detailed" icon="fa-truck-fast"           iconBg="bg-success/10" iconColor="text-success" label="QIT"        value={formatCompact(kpis.qit)}     subtitle="qty in transit" />
          <KPICard variant="detailed" icon="fa-triangle-exclamation" iconBg={kpis.expired ? 'bg-error/10' : 'bg-success/10'} iconColor={kpis.expired ? 'text-error' : 'text-success'} label="Expired"    value={kpis.expired}                subtitle="expired items" />
          <KPICard variant="detailed" icon="fa-clock-rotate-left"    iconBg={kpis.nearExpiry ? 'bg-warning/10' : 'bg-success/10'} iconColor={kpis.nearExpiry ? 'text-warning' : 'text-success'} label=">sExpiry"   value={kpis.nearExpiry}             subtitle="expiring soon" />
          <KPICard variant="detailed" icon="fa-box-open"             iconBg={kpis.damaged ? 'bg-error/10' : 'bg-success/10'} iconColor={kpis.damaged ? 'text-error' : 'text-success'} label="Damaged"    value={kpis.damaged}                subtitle="damaged items" />
          <KPICard variant="detailed" icon="fa-circle-minus"         iconBg={kpis.gap ? 'bg-error/10' : 'bg-success/10'} iconColor={kpis.gap ? 'text-error' : 'text-success'} label="Gap"        value={kpis.gap}                    subtitle="below EOP or stocked out" />
          <KPICard variant="detailed" icon="fa-circle-plus"          iconBg={kpis.overage ? 'bg-warning/10' : 'bg-success/10'} iconColor={kpis.overage ? 'text-warning' : 'text-success'} label="Overage"    value={kpis.overage}                subtitle="excess stock items" />
        </div>
      </section>

      {/* ── Distribution by Facility Type + Ownership Type ───────────────── */}
      <section id="cc-distribution" className="grid grid-cols-2 gap-5">
        <ProgramPanel title="Distribution by Facility Type" subtitle="Issued quantity by product and facility type">
          <ProgramStackedBarChart data={ccFacilityDistribution} />
        </ProgramPanel>
        <ProgramPanel title="Distribution by Ownership Type" subtitle="Quantity by product and ownership category">
          <ProgramStackedBarChart data={ccOwnershipDistribution} />
        </ProgramPanel>
      </section>

      {/* ── Procurement Agents + Funding Source ──────────────────────────── */}
      <section id="cc-agents" className="grid grid-cols-2 gap-5">
        <ProgramPanel title="Procurement Agents" subtitle="PO line count by product and funding source">
          <div className="-mt-3 px-5 pb-5">
            <PieChart data={ccDonorChart} />
          </div>
        </ProgramPanel>
        <ProgramPanel title="Funding Source" subtitle="Incoming shipment funder share">
          <div className="-mt-3 px-5 pb-5">
            <PieChart data={ccFundingChart} />
          </div>
        </ProgramPanel>
      </section>

      {/* ── Stock Status ─────────────────────────────────────────────────── */}
      <section id="cc-stock">
        <ProgramPanel title="Stock Status" subtitle={`${ccStockRows.length} Clinical Chemistry products`}>
          <NationalStockTable rows={ccStockRows} />
        </ProgramPanel>
      </section>

      {/* ── Issued Items ─────────────────────────────────────────────────── */}
      <section id="cc-issued">
        <ProgramPanel title="Issued — Center to Hub" subtitle="Issued items by flow type and month">
          <IssuedItemsTable rows={ccIssuedRows} />
        </ProgramPanel>
      </section>

      {/* ── Manufacturer ─────────────────────────────────────────────────── */}
      <section id="cc-manufacturer">
        <ProgramPanel title="Manufacturer" subtitle="Received value by manufacturer">
          <ProgramMiniTable
            columns={[
              { key: 'label', label: 'Manufacturer' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={ccManufacturers}
            emptyMessage="No manufacturer data available"
          />
        </ProgramPanel>
      </section>

      {/* ── Supplier ─────────────────────────────────────────────────────── */}
      <section id="cc-supplier">
        <ProgramPanel title="Supplier" subtitle="Received value by supplier">
          <ProgramMiniTable
            columns={[
              { key: 'label', label: 'Supplier' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={ccSuppliers}
            emptyMessage="No supplier data available"
          />
        </ProgramPanel>
      </section>

      {/* ── Country ──────────────────────────────────────────────────────── */}
      <section id="cc-country">
        <ProgramPanel title="Country" subtitle="Received value by source country">
          <ProgramMiniTable
            columns={[
              { key: 'label', label: 'Country' },
              { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
              { key: 'share', label: 'Share' },
            ]}
            rows={ccCountries}
            emptyMessage="No country data available"
          />
        </ProgramPanel>
      </section>

    </div>
  );
}

export default ClinicalChemistry;
