import KPICard from '../../components/KPICard';
import PieChart from '../../components/PieChart';
import InfoButton from '../../components/InfoButton';
import ExpandButton from '../../components/ExpandButton';
import { Table, Td, StatusBadge, SectionPanel, formatAmount } from './poShared';

export default function OverviewTab({ data, activeSections, kpiPage, setKpiPage, visibleKpiCards, kpiTotalPages, filteredOpenOverduePOs, overviewSearch, setOverviewSearch, overviewStatus, setOverviewStatus, trendWithDates, trendYears, trendYear, setTrendYear, filteredTrend, trendHover, setTrendHover, procurementStatusFilter, setProcurementStatusFilter, filteredStatusDetails, tp, sp }) {
  const formatMonth = (d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en', { month: 'short' });
  };

  return (
    <>
      {activeSections.includes('ppc-overview') && (
        <section id="ppc-overview">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {visibleKpiCards.map((c) => (
                <KPICard key={c.label} variant="detailed" {...c} />
              ))}
            </div>
            {kpiTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button type="button" onClick={() => setKpiPage((p) => Math.max(p - 1, 0))} disabled={kpiPage === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  aria-label="Previous KPI page"
                ><i className="fa-solid fa-chevron-left text-xs"></i></button>
                <span className="text-xs font-semibold text-on-surface-variant">{kpiPage + 1}/{kpiTotalPages}</span>
                <button type="button" onClick={() => setKpiPage((p) => Math.min(p + 1, kpiTotalPages - 1))} disabled={kpiPage === kpiTotalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  aria-label="Next KPI page"
                ><i className="fa-solid fa-chevron-right text-xs"></i></button>
              </div>
            )}
          </div>
        </section>
      )}

      {activeSections.includes('ppc-open-pos') && (
        <section id="ppc-open-pos">
          <SectionPanel
            title="Open & Overdue Purchase Orders"
            subtitle={`${filteredOpenOverduePOs.length} records requiring attention`}
            action={
              <div className="flex items-center gap-3">
                <InfoButton contentId="po-overdue" />
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-on-surface-variant/60 text-xs"></i>
                  <input type="text" placeholder="Search PO, supplier, program..." value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 h-9 rounded-md border border-outline-variant bg-white text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                  />
                </div>
                <select value={overviewStatus} onChange={(e) => setOverviewStatus(e.target.value)}
                  className="h-9 rounded-md border border-outline-variant bg-white px-3 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            }
          >
            {(() => {
              const openCount = filteredOpenOverduePOs.filter((p) => p.status === 'Open').length;
              const overdueCount = filteredOpenOverduePOs.filter((p) => p.status === 'Overdue').length;
              const totalAmt = filteredOpenOverduePOs.reduce((s, p) => s + p.amount, 0);
              const overduePOs = filteredOpenOverduePOs.filter((p) => p.status === 'Overdue' && p.daysOverdue);
              const avgDays = overduePOs.length ? Math.round(overduePOs.reduce((s, p) => s + p.daysOverdue, 0) / overduePOs.length) : 0;
              return (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <KPICard variant="detailed" icon="fa-file-invoice" iconBg="bg-primary/10" iconColor="text-primary" label="Total Open POs" value={openCount.toLocaleString()} subtitle="awaiting action" />
                    <KPICard variant="detailed" icon="fa-exclamation-triangle" iconBg="bg-error/10" iconColor="text-error" label="Total Overdue POs" value={overdueCount.toLocaleString()} subtitle="past due date" />
                    <KPICard variant="detailed" icon="fa-dollar-sign" iconBg="bg-warning/10" iconColor="text-warning" label="Total Amount" value={`$${totalAmt >= 1e9 ? (totalAmt / 1e9).toFixed(1) + 'B' : totalAmt >= 1e6 ? (totalAmt / 1e6).toFixed(1) + 'M' : totalAmt >= 1e3 ? (totalAmt / 1e3).toFixed(1) + 'K' : totalAmt.toLocaleString()}`} subtitle="combined value" />
                    <KPICard variant="detailed" icon="fa-clock" iconBg="bg-[#4A8EA5]/10" iconColor="text-[#4A8EA5]" label="Avg Days Overdue" value={`${avgDays}d`} subtitle="overdue POs only" />
                  </div>
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
                </>
              );
            })()}
          </SectionPanel>
        </section>
      )}

      {activeSections.includes('ppc-status') && (
        <section id="ppc-status">
          <SectionPanel title="Procurement Status" subtitle="Contract → PO → LC Opened → Port Arrival → Received" action={<div className="flex items-center gap-1"><ExpandButton data={data.procurementStatus.stages.map((s) => ({ label: s.stage, value: s.count, color: s.color }))} title="Procurement Status" /><InfoButton contentId="po-proc-status" /></div>}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <PieChart data={data.procurementStatus.stages.map((s) => ({ label: s.stage, value: s.count, color: s.color }))} totalLabel="Procurement stages" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-bold text-on-surface">Filter by stage:</span>
                  <select value={procurementStatusFilter} onChange={(e) => setProcurementStatusFilter(e.target.value)}
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

      {activeSections.includes('ppc-trend') && (
        <section id="ppc-trend">
          <SectionPanel title="Procurement Amount Trend" subtitle={`Monthly procurement trajectory — ${trendYear}`} action={
            <div className="relative">
              <select value={trendYear} onChange={e => { setTrendYear(Number(e.target.value)); setTrendHover(null) }}
                className="appearance-none h-8 min-w-[90px] rounded-md border border-outline-variant bg-white pl-2.5 pr-7 text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                {trendYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary pointer-events-none" />
            </div>
          }>
            {(() => {
              const dataLen = filteredTrend.length;
              if (!dataLen) return <div className="text-center py-10 text-body-sm text-on-surface-variant">No data for {trendYear}.</div>;
              const svgW = 900, svgH = 300;
              const pad = { top: 24, right: 24, bottom: 48, left: 72 };
              const chartW = svgW - pad.left - pad.right;
              const chartH = svgH - pad.top - pad.bottom;
              const maxVal = Math.max(...filteredTrend.map(d => d.amount));
              const range = maxVal || 1;
              const barWidth = Math.min((chartW / dataLen) * 0.6, 48);
              const barGap = (chartW - barWidth * dataLen) / Math.max(dataLen - 1, 1);
              const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

              return (
                <div className="flex items-stretch gap-6">
                  <div className="flex-1 min-w-0">
                    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Procurement amount trend chart" className="font-sans">
                      {yTicks.map((tick) => (
                        <g key={tick}>
                          <line x1={pad.left} y1={pad.top + chartH - (tick / range) * chartH} x2={pad.left + chartW} y2={pad.top + chartH - (tick / range) * chartH} stroke="#EAEEF0" strokeWidth="1" />
                          <text x={pad.left - 10} y={pad.top + chartH - (tick / range) * chartH + 4} textAnchor="end" fontSize="11" fill="#707979" fontWeight="600">{formatAmount(tick)}</text>
                        </g>
                      ))}
                      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + chartH} stroke="#CFD8DC" strokeWidth="1" />
                      <line x1={pad.left} y1={pad.top + chartH} x2={pad.left + chartW} y2={pad.top + chartH} stroke="#CFD8DC" strokeWidth="1" />
                      {filteredTrend.map((t, i) => {
                        const x = pad.left + i * (barWidth + barGap);
                        const y = pad.top + chartH - (t.amount / range) * chartH;
                        const h = chartH - (y - pad.top);
                        const isHovered = trendHover === i;
                        return (
                          <g key={t.date}>
                            <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="#0B4F54"
                              opacity={trendHover === null || isHovered ? 1 : 0.25}
                              onMouseEnter={() => setTrendHover(i)} onMouseLeave={() => setTrendHover(null)}
                              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                            />
                            {isHovered && (
                              <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0B4F54">
                                {formatAmount(t.amount)}
                              </text>
                            )}
                            <text x={x + barWidth / 2} y={pad.top + chartH + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#707979">
                              {formatMonth(t)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="w-72 shrink-0 bg-surface-container-low rounded-xl p-5 flex flex-col justify-center min-h-[200px]">
                    {trendHover !== null ? (() => {
                      const t = filteredTrend[trendHover];
                      const prev = filteredTrend[trendHover - 1];
                      const change = prev ? ((t.amount - prev.amount) / prev.amount) * 100 : null;
                      return (
                        <div className="space-y-4">
                          <div>
                            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{formatMonth(t)} {trendYear}</p>
                            <p className="text-[22px] font-extrabold text-on-surface mt-1 leading-tight font-mono tracking-tight">
                              {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-[11px] text-on-surface-variant font-bold">ETB</span>
                            </p>
                          </div>
                          {change !== null && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${change >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                              <i className={`fa-solid ${change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`} />
                              {Math.abs(change).toFixed(1)}% vs prev month
                            </div>
                          )}
                          <div className="h-px bg-outline-variant/50" />
                        </div>
                      );
                    })() : (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 mx-auto flex items-center justify-center">
                          <i className="fa-solid fa-chart-line text-xl text-primary/40" />
                        </div>
                        <p className="text-body-sm text-on-surface-variant leading-relaxed">Hover a bar for details and month-over-month comparison.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </SectionPanel>
        </section>
      )}
    </>
  );
}
