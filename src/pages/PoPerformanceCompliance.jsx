import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import KPICard from '../components/KPICard';
import PieChart from '../components/PieChart';
import SunburstChart from '../components/SunburstChart';
import SimplePagination from '../components/SimplePagination';
import SectionNavigator from '../components/SectionNavigator';
import generateAllData from '../data/poPerformanceData';
import TableInfoButton from '../components/TableInfoButton';


const formatAmount = (v) => {
  if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
};

const TABS = [
  {
    key: 'overview',
    label: 'Overview',
    sections: ['ppc-overview', 'ppc-open-pos', 'ppc-trend'],
  },
  {
    key: 'procurement',
    label: 'Procurement Breakdown',
    sections: ['ppc-commodity', 'ppc-supplier-share', 'ppc-funding', 'ppc-local-intl'],
  },
  {
    key: 'contracts',
    label: 'Contract Management',
    sections: ['ppc-contract-vs-po', 'ppc-lc-cad', 'ppc-pipeline', 'ppc-moh-wbs'],
  },
  {
    key: 'compliance',
    label: 'Performance & Compliance',
    sections: ['ppc-bond', 'ppc-leadtime', 'ppc-status', 'ppc-supplier-perf'],
  },
];

function Table({ headers, rows, renderRow, className = '', page, setPage, rowsPerPage = 15 }) {
  if (!rows.length) {
    return <div className="p-6 text-center text-body-sm text-on-surface-variant">No records</div>;
  }

  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const displayRows = page ? rows.slice((page - 1) * rowsPerPage, page * rowsPerPage) : rows;

  return (
    <div>
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {headers.map((h) => (
                <th key={h.key} className={`px-4 py-3 text-left text-label-caps text-on-surface-variant uppercase ${h.className || ''}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {displayRows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-container-low transition-colors">
                {renderRow(row, i)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page && setPage && (
        <SimplePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={rowsPerPage}
          onPageChange={setPage}
          label="records"
        />
      )}
    </div>
  );
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-body-sm text-on-surface ${className}`}>{children}</td>;
}

function StatusBadge({ status }) {
  const map = {
    Open: 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    Overdue: 'bg-error/10 text-error',
    Completed: 'bg-success/10 text-success',
    Active: 'bg-success/10 text-success',
    Expired: 'bg-surface-container text-on-surface-variant',
    Critical: 'bg-error/10 text-error',
    Warning: 'bg-warning/10 text-warning',
    'Received at Warehouse': 'bg-success/10 text-success',
    'Contract Signed': 'bg-primary/10 text-primary',
    'PO Issued': 'bg-primary/10 text-primary',
    'LC Opened': 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    'Port Arrival': 'bg-warning/10 text-warning',
    Cleared: 'bg-success/10 text-success',
    Received: 'bg-success/10 text-success',
    Verified: 'bg-success/10 text-success',
    Confiscated: 'bg-error/10 text-error',
    Extended: 'bg-warning/10 text-warning',
  };
  const cls = map[status] || 'bg-surface-container text-on-surface-variant';
  return <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${cls}`}>{status}</span>;
}

function SectionPanel({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-level-1">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50">
        <div>
          <h3 className="text-title-sm font-bold text-on-surface">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function PoPerformanceCompliance() {
  const data = useMemo(() => generateAllData(), []);

  const [procurementStatusFilter, setProcurementStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');
  const [tablePages, setTablePages] = useState({});
  const [trendHover, setTrendHover] = useState(null);
  const [commodityHover, setCommodityHover] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [supplierHover, setSupplierHover] = useState(null);

  const tp = (key) => tablePages[key] || 1;
  const sp = (key) => (page) => setTablePages((prev) => ({ ...prev, [key]: page }));

  const activeSections = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    return tab ? tab.sections : [];
  }, [activeTab]);

  const SECTION_LABELS = {
    'ppc-overview': 'Overview',
    'ppc-open-pos': 'Open POs',
    'ppc-trend': 'Trend',
    'ppc-commodity': 'Commodity',
    'ppc-supplier-share': 'Supplier Share',
    'ppc-funding': 'Funding',
    'ppc-local-intl': 'Local vs Intl',
    'ppc-contract-vs-po': 'Contract vs PO',
    'ppc-lc-cad': 'LC/CAD',
    'ppc-pipeline': 'Pipeline',
    'ppc-moh-wbs': 'MOH WBS',
    'ppc-bond': 'Bond',
    'ppc-leadtime': 'Leadtime',
    'ppc-status': 'Status',
    'ppc-supplier-perf': 'Supplier Perf',
  };

  const navigatorSections = useMemo(() => {
    return activeSections.map(id => ({ id, label: SECTION_LABELS[id] || id }));
  }, [activeSections]);

  // Reset pagination when switching tabs
  const prevTab = useRef(activeTab);
  if (prevTab.current !== activeTab) {
    prevTab.current = activeTab;
    setTablePages({});
  }
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewStatus, setOverviewStatus] = useState('All');

  const filteredOpenOverduePOs = useMemo(() => {
    return data.openOverduePOs.filter((po) => {
      const matchSearch =
        po.poNo.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.supplier.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        po.program.toLowerCase().includes(overviewSearch.toLowerCase());
      
      const matchStatus =
        overviewStatus === 'All' || po.status === overviewStatus;

      return matchSearch && matchStatus;
    });
  }, [data.openOverduePOs, overviewSearch, overviewStatus]);

  // Reset pagination when filters change
  const prevOverviewSearch = useRef(overviewSearch);
  const prevOverviewStatus = useRef(overviewStatus);
  if (prevOverviewSearch.current !== overviewSearch || prevOverviewStatus.current !== overviewStatus) {
    prevOverviewSearch.current = overviewSearch;
    prevOverviewStatus.current = overviewStatus;
    setTablePages((prev) => ({ ...prev, 'open-pos': 1 }));
  }

  const filteredStatusDetails = useMemo(() => {
    if (procurementStatusFilter === 'All') return data.procurementStatus.details;
    return data.procurementStatus.details.filter((d) => d.stage === procurementStatusFilter);
  }, [data, procurementStatusFilter]);

  return (
    <div className="space-y-5">
      <SectionNavigator sections={navigatorSections} />
      {/* Tab bar */}
      <div className="sticky top-0 z-10 -mx-lg px-lg py-3 bg-surface/95 backdrop-blur border-b border-outline-variant flex items-center justify-between gap-md">
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'overview'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          ><i className="fa-solid fa-gauge-high mr-2"></i>Overview</button>
          <button onClick={() => setActiveTab('procurement')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'procurement'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          ><i className="fa-solid fa-cart-shopping mr-2"></i>Procurement Breakdown</button>
          <button onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'contracts'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          ><i className="fa-solid fa-file-signature mr-2"></i>Contract Management</button>
          <button onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === 'compliance'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          ><i className="fa-solid fa-shield-halved mr-2"></i>Performance & Compliance</button>
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────────────── */}
      {(() => {
        const openOverduePOs = data.openOverduePOs;
        const openPOs = openOverduePOs.filter((p) => p.status === 'Open');
        const overduePOs = openOverduePOs.filter((p) => p.status === 'Overdue');
        const openPOsValue = openPOs.reduce((sum, p) => sum + p.amount, 0);
        const overduePOsValue = overduePOs.reduce((sum, p) => sum + p.amount, 0);

        return (
          <>
            {activeSections.includes('ppc-overview') && (
              <section id="ppc-overview">
                <div className="grid grid-cols-4 gap-4">
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-primary/10" iconColor="text-primary" label="Total POs" value={data.kpis.totalPO.toLocaleString()} subtitle={`Value: $${formatAmount(data.kpis.totalPOAmount)}`} />
                  <KPICard variant="detailed" icon="fa-file-signature" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total Contracts" value={data.kpis.totalContracts.toLocaleString()} subtitle={`Value: $${formatAmount(data.kpis.totalContractAmount)}`} />
                  <KPICard variant="detailed" icon="fa-clock" iconBg="bg-warning/10" iconColor="text-warning" label="Open POs" value={openPOs.length.toLocaleString()} subtitle={`Value: $${formatAmount(openPOsValue)}`} />
                  <KPICard variant="detailed" icon="fa-exclamation-triangle" iconBg="bg-error/10" iconColor="text-error" label="Overdue POs" value={overduePOs.length.toLocaleString()} subtitle={`Value: $${formatAmount(overduePOsValue)}`} />
                </div>
              </section>
            )}

            {/* ── Open & Overdue POs ───────────────────────────────────── */}
            {activeSections.includes('ppc-open-pos') && (
              <section id="ppc-open-pos">
                <SectionPanel
                  title="Open & Overdue Purchase Orders"
                  subtitle={`${filteredOpenOverduePOs.length} records requiring attention`}
                  action={
                    <div className="flex items-center gap-3">
                      <TableInfoButton tableId="po-overdue" />
                      <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                        <input
                          type="text"
                          placeholder="Search PO, supplier, program..."
                          value={overviewSearch}
                          onChange={(e) => setOverviewSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                        />
                      </div>
                      <select
                        value={overviewStatus}
                        onChange={(e) => setOverviewStatus(e.target.value)}
                        className="h-9 rounded-md border border-outline-variant bg-white px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  }
                >
                  <Table page={tp('open-pos')} setPage={sp('open-pos')}
                    headers={[
                      { key: 'poNo', label: 'PO No' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'program', label: 'Program' },
                      { key: 'amount', label: 'Amount', className: 'text-right' },
                      { key: 'issueDate', label: 'Issue Date' },
                      { key: 'dueDate', label: 'Due Date' },
                      { key: 'status', label: 'Status' },
                      { key: 'overdue', label: 'Days Overdue', className: 'text-right' },
                    ]}
                    rows={filteredOpenOverduePOs}
                    renderRow={(row) => (
                      <>
                        <Td className="font-mono font-semibold">{row.poNo}</Td>
                        <Td>{row.supplier}</Td>
                        <Td>{row.program}</Td>
                        <Td className="text-right font-mono font-medium">${row.amount.toLocaleString()}</Td>
                        <Td>{row.issueDate}</Td>
                        <Td>{row.dueDate}</Td>
                        <Td><StatusBadge status={row.status} /></Td>
                        <Td className="text-right font-bold text-error">{row.status === 'Overdue' ? `${row.daysOverdue}d` : '—'}</Td>
                      </>
                    )}
                  />
                </SectionPanel>
              </section>
            )}
          </>
        );
      })()}

      {/* ── Commodity Type ──────────────────────────────────────── */}
      {activeSections.includes('ppc-commodity') && (
      <section id="ppc-commodity">
        <SectionPanel title="Procurement Amount by Commodity Type & Program" subtitle="Stacked by program contribution per commodity">
          {(() => {
            // Commodity = X-axis groups, Programs = stacked color segments
            const PROGRAM_COLORS = {
              'HIV/AIDS':          '#00373B',
              'Malaria':           '#0B4F54',
              'TB':                '#216E6A',
              'EPI':               '#4A9598',
              'Reproductive Health':'#86BFC5',
              'Child Health':      '#A4D1D6',
              'Clinical Chemistry':'#515F74',
              'Nutrition':         '#CFD8DC',
            };

            // Group by commodity (X-axis), accumulate per program
            const byCommodity = {};
            data.commodityByProgram.forEach((item) => {
              if (!byCommodity[item.commodity]) byCommodity[item.commodity] = { commodity: item.commodity, segments: [], total: 0 };
              byCommodity[item.commodity].segments.push({ program: item.program, amount: item.amount });
              byCommodity[item.commodity].total += item.amount;
            });

            const commodities = Object.values(byCommodity).sort((a, b) => b.total - a.total);
            const allPrograms = [...new Set(data.commodityByProgram.map(d => d.program))];
            const globalMax = Math.max(...commodities.map(c => c.total));

            // SVG layout
            const svgW = 700, svgH = 320;
            const pad = { top: 20, right: 20, bottom: 60, left: 72 };
            const chartW = svgW - pad.left - pad.right;
            const chartH = svgH - pad.top - pad.bottom;
            const barGroupW = chartW / commodities.length;
            const barW = Math.min(54, barGroupW * 0.55);

            const yScale = (v) => pad.top + chartH - (v / globalMax) * chartH;
            const yTickCount = 5;
            const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => Math.round((globalMax / yTickCount) * i));

            const abbrevCommodity = (name) => {
              const m = { 'Family Planning': 'Fam. Plan.', 'Essential Medicines': 'Essent. Med.', 'Nutrition Supplies': 'Nutrition', 'Lab Reagents': 'Lab Reag.' };
              return m[name] || name;
            };

            return (
              <div className="font-sans space-y-4">
                <svg
                  width="100%"
                  height={svgH}
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  role="img"
                  aria-label="Stacked bar chart by commodity"
                  style={{ overflow: 'visible' }}
                >
                  {yTicks.map((tick) => (
                    <g key={tick}>
                      <line x1={pad.left} y1={yScale(tick)} x2={svgW - pad.right} y2={yScale(tick)} stroke="#EAEEF0" strokeWidth="1" />
                      <text x={pad.left - 10} y={yScale(tick) + 4} textAnchor="end" fontSize="10.5" fontWeight="500" fill="#707979">
                        ${formatAmount(tick)}
                      </text>
                    </g>
                  ))}

                  <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + chartH} stroke="#CFD8DC" strokeWidth="1" />
                  <line x1={pad.left} y1={pad.top + chartH} x2={svgW - pad.right} y2={pad.top + chartH} stroke="#CFD8DC" strokeWidth="1" />

                  {commodities.map((c, ci) => {
                    const barX = pad.left + ci * barGroupW + (barGroupW - barW) / 2;
                    const labelX = pad.left + ci * barGroupW + barGroupW / 2;
                    let currentY = pad.top + chartH;

                    return (
                      <g key={c.commodity}>
                        {[...c.segments].sort((a, b) => b.amount - a.amount).map((seg) => {
                          const segH = (seg.amount / globalMax) * chartH;
                          const segY = currentY - segH;
                          const isHov = commodityHover?.commodity === c.commodity && commodityHover?.program === seg.program;
                          currentY = segY;
                          return (
                            <rect
                              key={seg.program}
                              x={barX}
                              y={segY}
                              width={barW}
                              height={segH}
                              fill={isHov ? '#00373B' : PROGRAM_COLORS[seg.program] || '#CFD8DC'}
                              opacity={commodityHover && !isHov ? 0.35 : 0.92}
                              style={{ cursor: 'pointer', transition: 'opacity 150ms, fill 150ms' }}
                              onMouseEnter={(e) => setCommodityHover({
                                commodity: c.commodity,
                                program: seg.program,
                                amount: seg.amount,
                                pct: (seg.amount / c.total) * 100,
                                mx: e.clientX,
                                my: e.clientY,
                              })}
                              onMouseMove={(e) => setCommodityHover(prev => prev ? { ...prev, mx: e.clientX, my: e.clientY } : prev)}
                              onMouseLeave={() => setCommodityHover(null)}
                            />
                          );
                        })}

                        <text x={labelX} y={yScale(c.total) - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#404849">
                          ${formatAmount(c.total)}
                        </text>

                        <text x={labelX} y={pad.top + chartH + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#404849">
                          {abbrevCommodity(c.commodity)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-3 border-t border-outline-variant/40">
                  {allPrograms.map((prog) => (
                    <span key={prog} className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PROGRAM_COLORS[prog] || '#CFD8DC' }} />
                      {prog}
                    </span>
                  ))}
                </div>

                {/* Floating tooltip: rendered via portal at fixed screen coords */}
                {commodityHover?.mx !== undefined && typeof document !== 'undefined' && createPortal(
                    <div
                      className="fixed z-[9999] pointer-events-none"
                      style={{ left: commodityHover.mx + 16, top: commodityHover.my - 8 }}
                    >
                      <div style={{
                        background: '#fff',
                        border: '1px solid #CFD8DC',
                        borderRadius: '10px',
                        boxShadow: '0 12px 32px rgba(10,50,53,0.12)',
                        padding: '10px 14px',
                        minWidth: '160px',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: PROGRAM_COLORS[commodityHover.program] || '#CFD8DC', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#181C1E' }}>{commodityHover.program}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#707979', marginBottom: 4 }}>{commodityHover.commodity}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0A3235', fontFamily: 'monospace' }}>${commodityHover.amount.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#707979', marginTop: 2 }}>{commodityHover.pct.toFixed(1)}% of commodity total</div>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            );
          })()}
        </SectionPanel>
      </section>
      )}

      {/* ── Supplier Share ───────────────────────────────────────── */}
      {activeSections.includes('ppc-supplier-share') && (
      <section id="ppc-supplier-share">
        <SectionPanel title="Contract by Supplier Share" subtitle="Distribution of contract value by supplier">
          {(() => {
            const SUPPLIER_COLORS = {
              'EPSS': '#00373B',
              'MOH': '#0B4F54',
              'Global Fund': '#115E59',
              'UNICEF': '#216E6A',
              'WHO': '#4A9598',
              'UNDP': '#86BFC5',
              'UNFPA': '#A4D1D6',
              'Clinton Access Initiative': '#CFD8DC',
            };

            const totalContracts = data.supplierShare.reduce((s, x) => s + x.amount, 0);
            
            // Math for polar coordinates to describe slices
            const cx = 140, cy = 140, r = 115;
            const polarToCartesian = (x, y, radius, angle) => ({
              x: x + radius * Math.cos(angle),
              y: y + radius * Math.sin(angle),
            });

            const describeSlice = (x, y, radius, startAngle, endAngle) => {
              const start = polarToCartesian(x, y, radius, startAngle);
              const end = polarToCartesian(x, y, radius, endAngle);
              const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
              return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
            };

            let accumulatedAngle = -Math.PI / 2;
            const slices = data.supplierShare.map((s) => {
              const angle = (s.amount / totalContracts) * Math.PI * 2;
              const slice = {
                ...s,
                color: SUPPLIER_COLORS[s.label] || '#CFD8DC',
                startAngle: accumulatedAngle,
                endAngle: accumulatedAngle + angle,
              };
              accumulatedAngle += angle;
              return slice;
            });

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center font-sans">
                {/* Left side: Interactive Donut Chart */}
                <div className="md:col-span-6 flex justify-center relative select-none">
                  <svg width="280" height="280" viewBox="0 0 280 280" className="drop-shadow-sm">
                    {slices.map((slice) => {
                      const isHovered = supplierHover?.label === slice.label;
                      const opacity = supplierHover ? (isHovered ? 1 : 0.42) : 0.95;
                      const offset = isHovered ? 5 : 0;
                      
                      // Compute coordinates with radial offset for expanded slice look
                      const midAngle = (slice.startAngle + slice.endAngle) / 2;
                      const ox = offset * Math.cos(midAngle);
                      const oy = offset * Math.sin(midAngle);

                      return (
                        <path
                          key={slice.label}
                          d={describeSlice(cx + ox, cy + oy, r, slice.startAngle, slice.endAngle)}
                          fill={slice.color}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all duration-200"
                          style={{ opacity }}
                          onMouseEnter={() => setSupplierHover(slice)}
                          onMouseLeave={() => setSupplierHover(null)}
                        />
                      );
                    })}
                    
                    {/* Inner White Donut Circle Mask */}
                    <circle cx={cx} cy={cy} r={r * 0.65} fill="#ffffff" />

                    {/* Donut Center Text Display */}
                    {supplierHover ? (
                      <g className="animate-fade-in text-center">
                        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">
                          {supplierHover.label.length > 18 ? `${supplierHover.label.slice(0, 15)}...` : supplierHover.label}
                        </text>
                        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#181C1E">
                          {supplierHover.value}%
                        </text>
                        <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#404849" className="font-mono">
                          ${formatAmount(supplierHover.amount)}
                        </text>
                      </g>
                    ) : (
                      <g className="text-center">
                        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">
                          Total Contracts
                        </text>
                        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0B4F54" className="font-mono">
                          ${formatAmount(totalContracts)}
                        </text>
                        <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11" fontWeight="600" fill="#707979">
                          {data.supplierShare.length} Suppliers
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Right side: Detailed interactive list */}
                <div className="md:col-span-6 space-y-1.5">
                  {slices.map((slice) => {
                    const isHovered = supplierHover?.label === slice.label;
                    return (
                      <div
                        key={slice.label}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                          isHovered
                            ? 'bg-surface-container-low border-outline-variant/60 shadow-sm'
                            : 'bg-white border-transparent hover:bg-surface-low'
                        }`}
                        onMouseEnter={() => setSupplierHover(slice)}
                        onMouseLeave={() => setSupplierHover(null)}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: slice.color }} />
                        <span className="text-body-sm font-semibold text-on-surface flex-1 truncate" title={slice.label}>
                          {slice.label}
                        </span>
                        
                        {/* Percentage Pill */}
                        <span className="inline-block px-2 py-0.5 text-[10.5px] font-bold rounded-md bg-surface-container text-on-surface-variant shrink-0">
                          {slice.value}%
                        </span>

                        {/* Amount */}
                        <span className="text-body-sm font-mono font-semibold text-on-surface-variant w-24 text-right shrink-0">
                          ${formatAmount(slice.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </SectionPanel>
      </section>
      )}

      {/* ── Trend ────────────────────────────────────────────────── */}
      {activeSections.includes('ppc-trend') && (
      <section id="ppc-trend">
        <SectionPanel title="Procurement Amount Trend" subtitle="Year-over-year growth trajectory (2022–2026)">
          {(() => {
            const svgW = 640, svgH = 280;
            const pad = { top: 28, right: 40, bottom: 52, left: 64 };
            const chartW = svgW - pad.left - pad.right;
            const chartH = svgH - pad.top - pad.bottom;
            const maxVal = Math.max(...data.trend.map(d => d.amount));
            const xScale = (i) => pad.left + 45 + (i / Math.max(data.trend.length - 1, 1)) * (chartW - 90);
            const yScale = (v) => pad.top + chartH - (v / maxVal) * chartH;
            const barWidth = Math.min(44, (chartW / data.trend.length) * 0.45);
            const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
            const firstAmt = data.trend[0].amount;
            const lastAmt = data.trend[data.trend.length - 1].amount;
            const totalGrowth = ((lastAmt - firstAmt) / firstAmt) * 100;
            const cagr = (Math.pow(lastAmt / firstAmt, 1 / (data.trend.length - 1)) - 1) * 100;
            return (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-6 mb-4 text-sm font-sans">
                    <span className="text-on-surface-variant">Total growth: <strong className={`${totalGrowth >= 0 ? 'text-success' : 'text-error'}`}>{totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}%</strong></span>
                    <span className="text-on-surface-variant">CAGR: <strong className="text-on-surface">+{cagr.toFixed(1)}%</strong></span>
                  </div>
                  <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Procurement amount trend chart" className="font-sans">
                    {yTicks.map((tick) => (
                      <g key={tick}>
                        <line x1={pad.left} y1={yScale(tick)} x2={svgW - pad.right} y2={yScale(tick)} stroke="#EAEEF0" strokeWidth="1" />
                        <text x={pad.left - 12} y={yScale(tick) + 4} textAnchor="end" fontSize="11" fill="#707979" fontWeight="500">{formatAmount(tick)}</text>
                      </g>
                    ))}
                    <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + chartH} stroke="#CFD8DC" strokeWidth="1" />
                    <line x1={pad.left} y1={pad.top + chartH} x2={svgW - pad.right} y2={pad.top + chartH} stroke="#CFD8DC" strokeWidth="1" />
                    {data.trend.map((t, i) => {
                      const x = xScale(i) - barWidth / 2;
                      const y = yScale(t.amount);
                      const h = chartH - (y - pad.top);
                      return <rect key={t.year} x={x} y={y} width={barWidth} height={h} rx="6" fill="#0B4F54"
                        opacity={trendHover === null || trendHover === i ? 1 : 0.3}
                        onMouseEnter={() => setTrendHover(i)} onMouseLeave={() => setTrendHover(null)}
                        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      />;
                    })}
                    {data.trend.map((t, i) => (
                      <text key={t.year} x={xScale(i)} y={pad.top + chartH + 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="#404849">{t.year}</text>
                    ))}
                  </svg>
                </div>
                <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-center">
                  {trendHover !== null ? (() => {
                    const t = data.trend[trendHover];
                    const prevAmt = trendHover > 0 ? data.trend[trendHover - 1].amount : null;
                    const growth = prevAmt !== null ? ((t.amount - prevAmt) / prevAmt) * 100 : null;
                    return (
                      <>
                        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Selected Year</p>
                        <p className="text-[36px] font-bold text-on-surface mt-1 leading-tight">{t.year}</p>
                        <div className="h-px bg-outline-variant my-5" />
                        <div className="space-y-4">
                          <div>
                            <p className="text-label-sm text-on-surface-variant">Procurement Amount</p>
                            <p className="text-[28px] font-extrabold text-on-surface leading-tight">${formatAmount(t.amount)}</p>
                          </div>
                          {growth !== null && (
                            <div>
                              <p className="text-label-sm text-on-surface-variant">Year-over-Year Growth</p>
                              <p className={`text-[28px] font-extrabold leading-tight ${growth >= 0 ? 'text-success' : 'text-error'}`}>
                                {growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })() : (
                    <div className="text-center">
                      <i className="fa-solid fa-chart-line text-4xl text-outline-variant mb-3"></i>
                      <p className="text-body-sm text-on-surface-variant">Hover over a bar to see details</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </SectionPanel>
      </section>
      )}

      {/* ── Funding Source + Local vs International ─────────────── */}
      {(activeSections.includes('ppc-funding') || activeSections.includes('ppc-local-intl')) && (
      <div className="grid grid-cols-2 gap-5">
        {activeSections.includes('ppc-funding') && (
        <section id="ppc-funding">
          <SectionPanel title="Procurement by Funding Source" subtitle="Hierarchical view of funding distribution">
            <SunburstChart data={data.fundingSources} />
          </SectionPanel>
        </section>
        )}
        {activeSections.includes('ppc-local-intl') && (
        <section id="ppc-local-intl">
          <SectionPanel title="Local vs International Procurement" subtitle="Breakdown by procurement origin">
            <div className="max-w-sm mx-auto h-[310px] flex flex-col justify-center">
              <PieChart data={data.localVsIntl.map((l) => ({ label: l.type, value: l.amount }))} totalLabel="Procurement origin" />
            </div>
          </SectionPanel>
        </section>
        )}
      </div>
      )}

      {/* ── Contract vs PO Consumption ───────────────────────────── */}
      {activeSections.includes('ppc-contract-vs-po') && (
      <section id="ppc-contract-vs-po">
        <SectionPanel title="Contract vs PO - Consumption & Remaining" subtitle="Per contract with summary" action={<TableInfoButton tableId="po-contract-vs-po" />}>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {(() => {
              const totalPO = data.contractVsPO.reduce((s, c) => s + c.poAmount, 0);
              const totalConsumption = data.contractVsPO.reduce((s, c) => s + c.consumption, 0);
              const totalRemaining = data.contractVsPO.reduce((s, c) => s + c.remaining, 0);
              const avgPct = totalPO ? Math.round((totalConsumption / totalPO) * 100) : 0;
              return (
                <>
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Amount" value={formatAmount(totalPO)} subtitle="all contracts" />
                  <KPICard variant="detailed" icon="fa-cart-shopping" iconBg="bg-success/10" iconColor="text-success" label="Total Consumption" value={formatAmount(totalConsumption)} subtitle={`${avgPct}% consumed`} />
                  <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-warning/10" iconColor="text-warning" label="Total Remaining" value={formatAmount(totalRemaining)} subtitle="yet to consume" />
                  <KPICard variant="detailed" icon="fa-percent" iconBg="bg-primary/10" iconColor="text-primary" label="Avg Consumption Rate" value={`${avgPct}%`} subtitle="across all contracts" />
                </>
              );
            })()}
          </div>
          <Table page={tp('contract-po')} setPage={sp('contract-po')}
            headers={[
              { key: 'contract', label: 'Contract' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'ctAmount', label: 'Contract Amt', className: 'text-right' },
              { key: 'poAmount', label: 'PO Amt', className: 'text-right' },
              { key: 'consumption', label: 'Consumption', className: 'text-right' },
              { key: 'remaining', label: 'Remaining', className: 'text-right' },
              { key: 'progress', label: 'Progress' },
            ]}
            rows={data.contractVsPO}
            renderRow={(row) => (
              <>
                <Td className="font-mono">{row.contractNo}</Td>
                <Td>{row.supplier}</Td>
                <Td className="text-right font-mono">{formatAmount(row.contractAmount)}</Td>
                <Td className="text-right font-mono">{formatAmount(row.poAmount)}</Td>
                <Td className="text-right font-mono">{formatAmount(row.consumption)}</Td>
                <Td className="text-right font-mono">{formatAmount(row.remaining)}</Td>
                <Td className="min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.pctConsumed > 80 ? 'bg-success' : row.pctConsumed > 50 ? 'bg-warning' : 'bg-error'}`}
                        style={{ width: `${row.pctConsumed}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-on-surface shrink-0">{row.pctConsumed}%</span>
                  </div>
                </Td>
              </>
            )}
          />
        </SectionPanel>
      </section>
      )}

      {/* ── LC/CAD Expiry ────────────────────────────────────────── */}
      {activeSections.includes('ppc-lc-cad') && (
      <section id="ppc-lc-cad">
        <SectionPanel title="LC / CAD Expiry Report" subtitle="Letter of Credit expiry tracking" action={<TableInfoButton tableId="po-lc-cad" />}>
          <Table page={tp('lc-cad')} setPage={sp('lc-cad')}
            headers={[
              { key: 'lcNo', label: 'LC No' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'amount', label: 'Amount', className: 'text-right' },
              { key: 'issueDate', label: 'Issue Date' },
              { key: 'expiryDate', label: 'Expiry Date' },
              { key: 'status', label: 'Status' },
              { key: 'daysLeft', label: 'Days Left', className: 'text-right' },
            ]}
            rows={data.lcCadExpiry}
            renderRow={(row) => (
              <>
                <Td className="font-mono">{row.lcNo}</Td>
                <Td>{row.supplier}</Td>
                <Td className="text-right font-mono">{formatAmount(row.amount)}</Td>
                <Td>{row.issueDate}</Td>
                <Td>{row.expiryDate}</Td>
                <Td><StatusBadge status={row.status} /></Td>
                <Td className="text-right font-bold">{row.daysToExpiry}d</Td>
              </>
            )}
          />
        </SectionPanel>
      </section>
      )}

      {/* ── Contract vs PO vs Inbound vs Receive ────────────────── */}
      {activeSections.includes('ppc-pipeline') && (
      <section id="ppc-pipeline">
        <SectionPanel title="Contract vs PO vs Inbound Delivery vs Received" subtitle="Full procurement pipeline per contract" action={<TableInfoButton tableId="po-pipeline" />}>
          {(() => {
            const totalPO = data.contractPipeline.reduce((s, c) => s + c.poAmount, 0);
            const totalInbound = data.contractPipeline.reduce((s, c) => s + c.inboundDelivery, 0);
            const totalReceived = data.contractPipeline.reduce((s, c) => s + c.received, 0);
            return (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Total PO Value" value={formatAmount(totalPO)} subtitle="ordered" />
                  <KPICard variant="detailed" icon="fa-truck-loading" iconBg="bg-warning/10" iconColor="text-warning" label="Inbound Delivery" value={formatAmount(totalInbound)} subtitle={`${totalPO ? Math.round((totalInbound / totalPO) * 100) : 0}% of PO`} />
                  <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Received" value={formatAmount(totalReceived)} subtitle={`${totalInbound ? Math.round((totalReceived / totalInbound) * 100) : 0}% of inbound`} />
                </div>

                <Table page={tp('pipeline')} setPage={sp('pipeline')}
                  headers={[
                    { key: 'contract', label: 'Contract' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'po', label: 'PO Amount', className: 'text-right' },
                    { key: 'inbound', label: 'Inbound', className: 'text-right' },
                    { key: 'received', label: 'Received', className: 'text-right' },
                    { key: 'progress', label: 'Pipeline Fill' },
                  ]}
                  rows={data.contractPipeline}
                  renderRow={(row) => {
                    const fillPct = row.poAmount ? Math.round((row.received / row.poAmount) * 100) : 0;
                    return (
                      <>
                        <Td className="font-mono">{row.contractNo}</Td>
                        <Td>{row.supplier}</Td>
                        <Td className="text-right font-mono">{formatAmount(row.poAmount)}</Td>
                        <Td className="text-right font-mono">{formatAmount(row.inboundDelivery)}</Td>
                        <Td className="text-right font-mono">{formatAmount(row.received)}</Td>
                        <Td className="min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${fillPct >= 80 ? 'bg-success' : fillPct >= 50 ? 'bg-warning' : 'bg-error'}`}
                                style={{ width: `${fillPct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-on-surface shrink-0">{fillPct}%</span>
                          </div>
                        </Td>
                      </>
                    );
                  }}
                />
              </>
            );
          })()}
        </SectionPanel>
      </section>
      )}

      {/* ── MOH WBS ──────────────────────────────────────────────── */}
      {activeSections.includes('ppc-moh-wbs') && (
      <section id="ppc-moh-wbs">
        <SectionPanel title="Procurement by MOH WBS" subtitle="Work Breakdown Structure" action={<TableInfoButton tableId="po-moh-wbs" />}>
          <Table page={tp('moh-wbs')} setPage={sp('moh-wbs')}
            headers={[
              { key: 'wbs', label: 'WBS Code' },
              { key: 'description', label: 'Description' },
              { key: 'program', label: 'Program' },
              { key: 'amount', label: 'Amount', className: 'text-right' },
            ]}
            rows={data.mohWBS}
            renderRow={(row) => (
              <>
                <Td className="font-mono">{row.wbs}</Td>
                <Td>{row.description}</Td>
                <Td>{row.program}</Td>
                <Td className="text-right font-mono font-bold">{formatAmount(row.amount)}</Td>
              </>
            )}
          />
        </SectionPanel>
      </section>
      )}

      {/* ── Performance Bond ─────────────────────────────────────── */}
      {activeSections.includes('ppc-bond') && (
      <section id="ppc-bond">
        <SectionPanel title="Performance Bond Report" subtitle="Received, Verified, Expiry, Confiscated, Extended" action={<TableInfoButton tableId="po-bond" />}>
          {(() => {
            const bonds = data.performanceBonds;
            const totalAmount = bonds.reduce((s, b) => s + b.amount, 0);
            const statusGroups = bonds.reduce((acc, b) => {
              if (!acc[b.status]) acc[b.status] = { count: 0, total: 0 };
              acc[b.status].count++;
              acc[b.status].total += b.amount;
              return acc;
            }, {});
            const statusColors = {
              'Received': '#4A8EA5', 'Verified': '#10B981', 'Expired': '#BA1A1A',
              'Confiscated': '#DC2626', 'Extended': '#D97706',
            };
            const statusOrder = ['Received', 'Verified', 'Expired', 'Confiscated', 'Extended'];
            const maxCount = Math.max(...Object.values(statusGroups).map((g) => g.count), 1);
            const expiredCount = (statusGroups['Expired']?.count || 0) + (statusGroups['Confiscated']?.count || 0);
            return (
              <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <KPICard variant="detailed" icon="fa-file-contract" iconBg="bg-primary/10" iconColor="text-primary" label="Total Bonds" value={bonds.length.toLocaleString()} subtitle={`Value: $${formatAmount(totalAmount)}`} />
                  <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Verified / Active" value={((statusGroups['Verified']?.count || 0) + (statusGroups['Received']?.count || 0)).toLocaleString()} subtitle="in good standing" />
                  <KPICard variant="detailed" icon="fa-clock" iconBg="bg-warning/10" iconColor="text-warning" label="Extended" value={(statusGroups['Extended']?.count || 0).toLocaleString()} subtitle="term extended" />
                  <KPICard variant="detailed" icon="fa-exclamation-triangle" iconBg="bg-error/10" iconColor="text-error" label="Expired / Confiscated" value={expiredCount.toLocaleString()} subtitle="requires action" />
                </div>
                <Table page={tp('bond')} setPage={sp('bond')}
                  headers={[
                    { key: 'bondNo', label: 'Bond No' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'amount', label: 'Amount', className: 'text-right' },
                    { key: 'received', label: 'Received Date' },
                    { key: 'verified', label: 'Verified Date' },
                    { key: 'expiry', label: 'Expiry Date' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={data.performanceBonds}
                  renderRow={(row) => (
                    <>
                      <Td className="font-mono">{row.bondNo}</Td>
                      <Td>{row.supplier}</Td>
                      <Td className="text-right font-mono">{formatAmount(row.amount)}</Td>
                      <Td>{row.receivedDate}</Td>
                      <Td>{row.verifiedDate}</Td>
                      <Td>{row.expiryDate}</Td>
                      <Td><StatusBadge status={row.status} /></Td>
                    </>
                  )}
                />
              </>
            );
          })()}
        </SectionPanel>
      </section>
      )}

      {/* ── Leadtime ─────────────────────────────────────────────── */}
      {activeSections.includes('ppc-leadtime') && (
      <section id="ppc-leadtime">
        <SectionPanel title="Leadtime Analysis" subtitle="Average processing times across procurement stages" action={<TableInfoButton tableId="po-leadtime" />}>
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <KPICard variant="detailed" icon="fa-file-signature" iconBg="bg-primary/10" iconColor="text-primary" label="Contract → PO" value={`${data.leadtime.summary.contractToPO}d`} subtitle="Tender process" />
            <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="PO → LC Opening" value={`${data.leadtime.summary.poToLCOpening}d`} subtitle="Contract management" />
            <KPICard variant="detailed" icon="fa-ship" iconBg="bg-warning/10" iconColor="text-warning" label="LC → Port Arrival" value={`${data.leadtime.summary.lcToPortArrival}d`} subtitle="Supplier lead" />
            <KPICard variant="detailed" icon="fa-check-circle" iconBg="bg-success/10" iconColor="text-success" label="Port → Cleared" value={`${data.leadtime.summary.portToCleared}d`} subtitle="Customs & clearance" />
            <KPICard variant="detailed" icon="fa-warehouse" iconBg="bg-success/10" iconColor="text-success" label="Cleared → Received" value={`${data.leadtime.summary.clearedToReceive}d`} subtitle="Inbound delivery" />
          </div>



          <Table page={tp('leadtime')} setPage={sp('leadtime')}
            headers={[
              { key: 'poNo', label: 'PO No' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'ctPO', label: 'C→PO', className: 'text-right' },
              { key: 'poLC', label: 'PO→LC', className: 'text-right' },
              { key: 'lcPort', label: 'LC→Port', className: 'text-right' },
              { key: 'portClear', label: 'Port→Clr', className: 'text-right' },
              { key: 'clearRecv', label: 'Clr→Rcv', className: 'text-right' },
              { key: 'total', label: 'Total', className: 'text-right' },
            ]}
            rows={data.leadtime.details}
            renderRow={(row) => (
              <>
                <Td className="font-mono">{row.poNo}</Td>
                <Td>{row.supplier}</Td>
                <Td className="text-right">{row.contractToPO}d</Td>
                <Td className="text-right">{row.poToLCOpening}d</Td>
                <Td className="text-right">{row.lcToPortArrival}d</Td>
                <Td className="text-right">{row.portToCleared}d</Td>
                <Td className="text-right">{row.clearedToReceive}d</Td>
                <Td className="text-right font-bold">{row.totalLeadtime}d</Td>
              </>
            )}
          />
        </SectionPanel>
      </section>
      )}

      {/* ── Procurement Status ───────────────────────────────────── */}
      {activeSections.includes('ppc-status') && (
      <section id="ppc-status">
        <SectionPanel title="Procurement Status" subtitle="Contract → PO → LC Opened → Port Arrival → Received" action={<TableInfoButton tableId="po-proc-status" />}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <PieChart data={data.procurementStatus.stages.map((s) => ({ label: s.stage, value: s.count, color: s.color }))} totalLabel="Procurement stages" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-on-surface">Filter by stage:</span>
                <select
                  value={procurementStatusFilter}
                  onChange={(e) => setProcurementStatusFilter(e.target.value)}
                  className="h-8 rounded-md border border-outline-variant bg-white px-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="All">All Stages</option>
                  {data.procurementStatus.stages.map((s) => (
                    <option key={s.stage} value={s.stage}>{s.stage} ({s.count})</option>
                  ))}
                </select>
              </div>
              <Table page={tp('proc-status')} setPage={sp('proc-status')} rowsPerPage={5}
                headers={[
                  { key: 'ref', label: 'Reference' },
                  { key: 'supplier', label: 'Supplier' },
                  { key: 'stage', label: 'Stage' },
                  { key: 'date', label: 'Status Date' },
                ]}
                rows={filteredStatusDetails}
                renderRow={(row) => (
                  <>
                    <Td className="font-mono">{row.refNo}</Td>
                    <Td>{row.supplier}</Td>
                    <Td><StatusBadge status={row.stage} /></Td>
                    <Td>{row.statusDate}</Td>
                  </>
                )}
              />
            </div>
          </div>
        </SectionPanel>
      </section>
      )}

      {/* ── Supplier Performance ─────────────────────────────────── */}
      {activeSections.includes('ppc-supplier-perf') && (
      <section id="ppc-supplier-perf">
        <SectionPanel title="Supplier Performance Tracking" subtitle="Average lead time and on-time delivery percentage" action={<TableInfoButton tableId="po-supplier-perf" />}>
          <Table page={tp('supplier-perf')} setPage={sp('supplier-perf')}
            headers={[
              { key: 'supplier', label: 'Supplier' },
              { key: 'totalPO', label: 'Total POs', className: 'text-right' },
              { key: 'avgLeadtime', label: 'Avg Lead Time', className: 'text-right' },
              { key: 'onTimePct', label: 'On-Time %', className: 'text-right' },
              { key: 'totalAmount', label: 'Total Amount', className: 'text-right' },
            ]}
            rows={data.supplierPerformance}
            renderRow={(row) => (
              <>
                <Td className="font-bold">{row.supplier}</Td>
                <Td className="text-right">{row.totalPOs}</Td>
                <Td className="text-right">{row.avgLeadtime}d</Td>
                <Td className="text-right">
                  <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${row.onTimePct >= 80 ? 'bg-success/10 text-success' : row.onTimePct >= 60 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}>
                    {row.onTimePct}%
                  </span>
                </Td>
                <Td className="text-right font-mono">{formatAmount(row.totalAmount)}</Td>
              </>
            )}
          />
        </SectionPanel>
      </section>
      )}
    </div>
  );
}
