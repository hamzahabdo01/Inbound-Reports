import { useState, useEffect } from 'react';
import KPICard from '../../components/KPICard';
import ProgramPanel from '../../components/program/ProgramPanel';
import SectionNavigator from '../../components/SectionNavigator';
import ProgramMiniTable from '../../components/program/ProgramMiniTable';
import NationalStockTable from '../../components/program/NationalStockTable';
import IssuedItemsTable from '../../components/program/IssuedItemsTable';
import PieChart from '../../components/PieChart';
import InfoButton from '../../components/InfoButton';
import ExpandButton from '../../components/ExpandButton';
import { LookUp, POD_WebApi } from '../../api/fanos';
import { useClinicalChemistry, useCCIssuedItems, useCCFacilityDistribution, useCCOwnershipDistribution, useCCProcurementAgents, useCCFundingSource } from '../../data/useClinicalChemistry';

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

const TODAY = new Date();
const defaultFrom = new Date(TODAY.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const defaultTo = TODAY.toISOString().slice(0, 10);
const FALLBACK_YEARS = Array.from({ length: 9 }, (_, i) => 2008 + i);

function ClinicalChemistry({ programType = 'HPR' }: any) {

  const [yearOptions, setYearOptions] = useState<number[]>(FALLBACK_YEARS);
  const [facilityYear, setFacilityYear] = useState(2016);
  const [ownershipYear, setOwnershipYear] = useState(2016);
  const [procurerYear, setProcurerYear] = useState(2016);
  const [fundingYear, setFundingYear] = useState(2016);
  const [issuedFrom, setIssuedFrom] = useState(defaultFrom);
  const [issuedTo, setIssuedTo] = useState(defaultTo);
  const [kpiPage, setKpiPage] = useState(0);
  const [distributionType, setDistributionType] = useState<'centerToHub' | 'hubToFacility'>('centerToHub');
  const [environmentCode, setEnvironmentCode] = useState('');
  const [hubList, setHubList] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => { LookUp.getFiscalYearList().then((r) => {
      const years = (r?.data?.Data || [])
        .map((y) => Number(y.FiscalYear))
        .filter((y) => !isNaN(y))
        .sort((a, b) => b - a);
      setYearOptions(years.length ? years : FALLBACK_YEARS);
      const current = r?.data?.Data?.find((fy) => fy.IsCurrent);
      if (current) {
        const y = Number(current.FiscalYear);
        if (!isNaN(y)) {
          setFacilityYear(y);
          setOwnershipYear(y);
          setProcurerYear(y);
          setFundingYear(y);
        }
      }
    });
  }, []);

  useEffect(() => {
    POD_WebApi.getEnvironmentList({ EnvironmentGroupCode: 'hub' }).then((r) => {
      const items = (r?.data?.Data || []).map((h: any) => ({ code: h.EnvironmentCode || '', name: h.Environment || h.EnvironmentCode || '' }));
      setHubList(items.filter((h: any) => h.code));
    });
  }, []);

  const { data, loading, error } = useClinicalChemistry(programType);
  const issued = useCCIssuedItems(programType, issuedFrom, issuedTo, distributionType, environmentCode || undefined);
  const facility = useCCFacilityDistribution(programType, facilityYear);
  const ownership = useCCOwnershipDistribution(programType, ownershipYear);
  const agents = useCCProcurementAgents(programType, procurerYear);
  const funding = useCCFundingSource(programType, fundingYear);

  const YearSelect = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) => (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-[10px] font-semibold text-on-surface-variant uppercase">{label}</span>}
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none h-7 min-w-[72px] rounded-md border border-outline-variant bg-white pl-2 pr-5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <i className="fa-solid fa-chevron-down -ml-4 text-[8px] text-primary pointer-events-none" />
    </div>
  );

  const kpis = { soh: 0, ordered: 0, qit: 0, expired: 0, nearExpiry: 0, damaged: 2, gap: 0, overage: 0, skuCount: 0 };

  const kpiCards = kpis ? [
    { icon: 'fa-boxes-stacked',        iconBg: 'bg-surface-container', iconColor: 'text-primary', label: 'SOH',        value: formatCompact(kpis.soh),  subtitle: `${kpis.skuCount} SKUs` },
    { icon: 'fa-cart-shopping',        iconBg: 'bg-[#4A8EA5]/10', iconColor: 'text-[#4A8EA5]', label: 'Ordered',    value: formatCompact(kpis.ordered), subtitle: 'in purchase orders' },
    { icon: 'fa-truck-fast',           iconBg: 'bg-success/10', iconColor: 'text-success', label: 'QIT',        value: formatCompact(kpis.qit),  subtitle: 'qty in transit' },
    { icon: 'fa-circle-minus',         iconBg: kpis.gap ? 'bg-error/10' : 'bg-success/10', iconColor: kpis.gap ? 'text-error' : 'text-success', label: 'Gap',        value: kpis.gap,         subtitle: 'below EOP or stocked out' },
    { icon: 'fa-triangle-exclamation', iconBg: kpis.expired ? 'bg-error/10' : 'bg-success/10', iconColor: kpis.expired ? 'text-error' : 'text-success', label: 'Expired',    value: kpis.expired,     subtitle: 'expired items' },
    { icon: 'fa-clock-rotate-left',    iconBg: kpis.nearExpiry ? 'bg-warning/10' : 'bg-success/10', iconColor: kpis.nearExpiry ? 'text-warning' : 'text-success', label: '>sExpiry',   value: kpis.nearExpiry,  subtitle: 'expiring soon' },
    { icon: 'fa-circle-plus',          iconBg: kpis.overage ? 'bg-warning/10' : 'bg-success/10', iconColor: kpis.overage ? 'text-warning' : 'text-success', label: 'Overage',    value: kpis.overage,     subtitle: 'excess stock items' },
    { icon: 'fa-box-open',             iconBg: kpis.damaged ? 'bg-error/10' : 'bg-success/10', iconColor: kpis.damaged ? 'text-error' : 'text-success', label: 'Damaged',    value: kpis.damaged,     subtitle: 'damaged items' },
  ] : [];

  const kpiTotalPages = Math.ceil(kpiCards.length / 4);

  // ─── Skeleton components ────────────────────────────────────────────
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

  return (
    <div className="space-y-5">

      <SectionNavigator sections={CC_SECTIONS} />

      {/* ── Overview: KPI cards ──────────────────────────────────────────── */}
      <section id="cc-kpis">
        <div className="space-y-3">
          <div className="relative pl-12 pr-12">
            <div className="overflow-hidden w-full">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${kpiPage * 100}%)` }}>
                {Array.from({ length: kpiTotalPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="grid grid-cols-4 gap-3 w-full shrink-0">
                    {kpiCards.slice(pageIdx * 4, pageIdx * 4 + 4).map((c, cardIdx) => (
                      <KPICard key={c.label || cardIdx} variant="detailed" {...c} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {kpiTotalPages > 1 && (
              <>
                <button type="button" onClick={() => setKpiPage((p) => Math.max(p - 1, 0))} disabled={kpiPage === 0}
                  className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-l-xl bg-primary text-white hover:bg-primary-dark disabled:bg-[#0B4F54]/10 disabled:text-[#0B4F54]/30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Previous KPI page"
                ><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
                <button type="button" onClick={() => setKpiPage((p) => Math.min(p + 1, kpiTotalPages - 1))} disabled={kpiPage === kpiTotalPages - 1}
                  className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-r-xl bg-primary text-white hover:bg-primary-dark disabled:bg-[#0B4F54]/10 disabled:text-[#0B4F54]/30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Next KPI page"
                ><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
              </>
            )}
          </div>
          {kpiTotalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: kpiTotalPages }, (_, i) => (
                <button key={i} type="button" onClick={() => setKpiPage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === kpiPage ? 'bg-primary w-5' : 'bg-outline-variant hover:bg-outline'}`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3 max-w-md">
            <i className="fa-solid fa-triangle-exclamation text-3xl text-error" />
            <p className="text-sm font-semibold text-error">Failed to load data</p>
            <p className="text-xs text-on-surface-variant">{error}</p>
          </div>
        </div>
      )}

      <section id="cc-distribution" className="grid grid-cols-2 gap-5">
        <ProgramPanel title="Distribution by Facility Type" subtitle="Issued quantity by product and facility type" action={<YearSelect label="" value={facilityYear} onChange={setFacilityYear} />}>
          <div className="-mt-3 px-5 pb-5">
            {facility.loading ? (
              <div className="flex h-48 items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-primary" /></div>
            ) : facility.data?.length ? (
              <PieChart data={facility.data} />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-on-surface-variant">No distribution data</div>
            )}
          </div>
        </ProgramPanel>
        <ProgramPanel title="Distribution by Ownership Type" subtitle="Quantity by product and ownership category" action={<YearSelect label="" value={ownershipYear} onChange={setOwnershipYear} />}>
          <div className="-mt-3 px-5 pb-5">
            {ownership.loading ? (
              <div className="flex h-48 items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-primary" /></div>
            ) : ownership.data?.length ? (
              <PieChart data={ownership.data} />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-on-surface-variant">No distribution data</div>
            )}
          </div>
        </ProgramPanel>
      </section>

      {/* ── Procurement Agents + Funding Source ──────────────────────────── */}
      <section id="cc-agents" className="grid grid-cols-2 gap-5">
        <ProgramPanel title="Procurement Agents" subtitle="PO line count by product and funding source"
          action={<div className="flex items-center gap-2"><YearSelect label="" value={procurerYear} onChange={setProcurerYear} /><ExpandButton data={agents.data || []} title="Procurement Agents" /><InfoButton contentId="program-procurement-agents" /></div>}>
          <div className="-mt-3 px-5 pb-5">
            {agents.loading ? (
              <div className="flex h-48 items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-primary" /></div>
            ) : agents.data?.length ? (
              <PieChart data={agents.data} />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-on-surface-variant">No data</div>
            )}
          </div>
        </ProgramPanel>
        <ProgramPanel title="Funding Source" subtitle="Incoming shipment funder share"
          action={<div className="flex items-center gap-2"><YearSelect label="" value={fundingYear} onChange={setFundingYear} /><ExpandButton data={funding.data || []} title="Funding Source" /><InfoButton contentId="program-funding-source" /></div>}>
          <div className="-mt-3 px-5 pb-5">
            {funding.loading ? (
              <div className="flex h-48 items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-primary" /></div>
            ) : funding.data?.length ? (
              <PieChart data={funding.data} />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-on-surface-variant">No data</div>
            )}
          </div>
        </ProgramPanel>
      </section>

      {/* ── Stock Status ─────────────────────────────────────────────────── */}
      <section id="cc-stock">
        {loading ? (
          <PanelSkeleton rows={6} height="h-56" />
        ) : (
          <ProgramPanel title="Stock Status" subtitle={`${data?.stockRows?.length || 0} Clinical Chemistry products`} action={<InfoButton contentId="program-national-stock" />}>
            {data?.stockRows?.length ? (
              <NationalStockTable rows={data.stockRows} />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-on-surface-variant">No stock data available</div>
            )}
          </ProgramPanel>
        )}
      </section>

      {/* ── Issued Items ─────────────────────────────────────────────────── */}
      <section id="cc-issued">
        {!issued.loading && !issued.error ? (
          <ProgramPanel
            title={distributionType === 'hubToFacility' ? 'Issued — Hub to Facility' : 'Issued — Center to Hub'}
            subtitle="Issued items by flow type and month"
            action={
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <select
                    value={environmentCode}
                    onChange={(e) => setEnvironmentCode(e.target.value)}
                    className="appearance-none h-7 min-w-[72px] rounded-md border border-outline-variant bg-white pl-2 pr-5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">All</option>
                    {hubList.map((h) => <option key={h.code} value={h.code}>{h.name}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down -ml-4 text-[8px] text-primary pointer-events-none" />
                </div>
                <select
                  value={distributionType}
                  onChange={(e) => setDistributionType(e.target.value as 'centerToHub' | 'hubToFacility')}
                  className="appearance-none h-7 rounded-md border border-outline-variant bg-white pl-2 pr-5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="centerToHub">Center to Hub</option>
                  <option value="hubToFacility">Hub to Facility</option>
                </select>
                <InfoButton contentId="program-issued-items" />
              </div>
            }
          >
            {issued.loading ? (
              <div className="flex h-48 items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-primary" /></div>
            ) : issued.data?.length ? (
              <IssuedItemsTable rows={issued.data} fromDate={issuedFrom} toDate={issuedTo} onFromChange={setIssuedFrom} onToChange={setIssuedTo} />
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-on-surface-variant">No issued items data</div>
            )}
          </ProgramPanel>
        ) : (
          <PanelSkeleton rows={3} />
        )}
      </section>

      {/* ── Manufacturer ─────────────────────────────────────────────────── */}
      <section id="cc-manufacturer">
        {loading ? (
          <PanelSkeleton />
        ) : (
          <ProgramPanel title="Manufacturer" subtitle="Received value by manufacturer" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Manufacturer' },
                { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share' },
              ]}
              rows={data?.manufacturers || []}
              emptyMessage="No manufacturer data available"
            />
          </ProgramPanel>
        )}
      </section>

      {/* ── Supplier ─────────────────────────────────────────────────────── */}
      <section id="cc-supplier">
        {loading ? (
          <PanelSkeleton />
        ) : (
          <ProgramPanel title="Supplier" subtitle="Received value by supplier" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Supplier' },
                { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share' },
              ]}
              rows={data?.suppliers || []}
              emptyMessage="No supplier data available"
            />
          </ProgramPanel>
        )}
      </section>

      {/* ── Country ──────────────────────────────────────────────────────── */}
      <section id="cc-country">
        {loading ? (
          <PanelSkeleton />
        ) : (
          <ProgramPanel title="Country" subtitle="Received value by source country" action={<InfoButton contentId="program-mini-table" />}>
            <ProgramMiniTable
              columns={[
                { key: 'label', label: 'Country' },
                { key: 'value', label: 'Value (ETB)', render: (row) => formatNumber(row.value) },
                { key: 'share', label: 'Share' },
              ]}
              rows={data?.countries || []}
              emptyMessage="No country data available"
            />
          </ProgramPanel>
        )}
      </section>


    </div>
  );
}

export default ClinicalChemistry;
