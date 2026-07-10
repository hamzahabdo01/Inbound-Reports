import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PieChart from '../../components/PieChart';
import FundingSourceChart from '../../components/FundingSourceChart';
import KPICard from '../../components/KPICard';
import IconButton from '../../components/IconButton';
import { SectionPanel, formatAmount } from './poShared';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function DetailRow({ label, value }: any) {
  return (
    <div className="flex justify-between"><span className="text-on-surface-variant">{label}</span><span className="font-bold text-on-surface">{value}</span></div>
  );
}

function DetailContent({ active, hover }: any) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{active.label}</p>
        <p className="text-[20px] font-extrabold text-on-surface mt-1">{hover[active.tooltipKeys.name]}</p>
      </div>
      <div className="space-y-2 text-body-sm">
        <DetailRow label="Amount" value={`${formatAmount(hover[active.tooltipKeys.amount])} ETB`} />
        <DetailRow label="Share" value={`${hover[active.tooltipKeys.share].toFixed(1)}%`} />
        <DetailRow label="POs" value={hover.purchaseOrderCount} />
        <DetailRow label="Lines" value={hover[active.tooltipKeys.lines]} />
      </div>
    </div>
  );
}

const PO_TYPE_COLORS = ['#0B4F54', '#D97706', '#216E6A', '#4A9598'];

function BarChart({ data, labelKey, amountKey, shareKey, colors, labelW = 110, barAreaW = 400, setHover, activeHover }: any) {
  const types = [...data].sort((a, b) => b[amountKey] - a[amountKey]);
  const barH = 28;
  const gap = 10;
  const chartH = types.length * (barH + gap) - gap;
  const svgW = labelW + barAreaW + 120;
  const maxAmount = types[0]?.[amountKey] || 1;

  const labelMap = {
    'Laboratory commodity': 'Lab Commodity',
    'Medical Supply': 'Med Supply',
    'By Health Program': 'Health Program',
    'RDF International': 'RDF Intl.',
    'RDF  local': 'RDF Local',
  };

  return (
    <div className="font-sans">
      <svg width="100%" viewBox={`0 0 ${svgW} ${chartH + 24}`} role="img">
        {types.map((t, i) => {
          const y = i * (barH + gap) + 8;
          const barW = Math.max(10, (t[amountKey] / maxAmount) * barAreaW);
          const label = labelMap[t[labelKey]] || t[labelKey];
          return (
            <g key={i} className="cursor-pointer" 
              onMouseEnter={(e) => setHover({ ...t, mx: e.clientX, my: e.clientY })}
              onMouseMove={(e) => setHover(prev => prev ? { ...prev, mx: e.clientX, my: e.clientY } : prev)}
              onMouseLeave={() => setHover(null)}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11" fontWeight={activeHover && activeHover[labelKey] === t[labelKey] ? 800 : 700} fill={activeHover && activeHover[labelKey] === t[labelKey] ? "#0B4F54" : "#404849"}>{label}</text>
              <rect x={labelW} y={y} width={barW} height={barH} rx="5" fill={colors[i % colors.length]} opacity={activeHover && activeHover[labelKey] === t[labelKey] ? 1 : 0.8}
                style={{ transition: 'all 0.3s ease-in-out' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function OverviewTab({ data, activeSections, kpiPage, setKpiPage, kpiCards = [], supplierHover, setSupplierHover, trendYears, trendYear, setTrendYear, filteredTrend, trendHover, setTrendHover }: any) {
  const fundingYears = useMemo(() => data.fundingSources.map((d: any) => d.name), [data.fundingSources]);
  const [fundingYear, setFundingYear] = useState<string>(() => fundingYears[fundingYears.length - 1] || '');
  const [cardsPerPage, setCardsPerPage] = useState(() => window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1);
  const [selectedTrendIdx, setSelectedTrendIdx] = useState(-1);
  const [fundOpenIdx, setFundOpenIdx] = useState(-1);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const isTrendMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    const onResize = () => {
      const next = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1;
      setCardsPerPage(prev => {
        if (prev !== next) setKpiPage(0);
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setKpiPage]);

  useEffect(() => { setSelectedTrendIdx(filteredTrend.length - 1); }, [filteredTrend]);

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const handleTouchStart = (e: any) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const handleTouchMove = (e: any) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0 && kpiPage < kpiTotalPages - 1) setKpiPage(p => p + 1);
      else if (touchDeltaX.current > 0 && kpiPage > 0) setKpiPage(p => p - 1);
    }
  };

  const kpiTotalPages = Math.ceil(kpiCards.length / cardsPerPage);

  return (
    <>
      {activeSections.includes('ppc-overview') && (
        <section id="ppc-overview">
          <div className="space-y-3">
            <div className="relative lg:pl-12 lg:pr-12">
              <div className="relative overflow-hidden w-full" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${kpiPage * 100}%)` }}
                >
                  {Array.from({ length: kpiTotalPages }).map((_, pageIdx) => (
                    <div key={pageIdx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full shrink-0">
                      {kpiCards.slice(pageIdx * cardsPerPage, pageIdx * cardsPerPage + cardsPerPage).map((c, cardIdx) => (
                        <div key={c.label || cardIdx}>
                          <KPICard variant="detailed" {...c} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {kpiTotalPages > 1 && (
                <>
                  <button type="button" onClick={() => setKpiPage((p) => Math.max(p - 1, 0))} disabled={kpiPage === 0}
                    className="hidden lg:flex absolute left-0 top-0 bottom-0 w-8 items-center justify-center rounded-l-xl bg-primary text-white hover:bg-primary-dark disabled:bg-[#0B4F54]/10 disabled:text-[#0B4F54]/30 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Previous KPI page"
                  ><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
                  <button type="button" onClick={() => setKpiPage((p) => Math.min(p + 1, kpiTotalPages - 1))} disabled={kpiPage === kpiTotalPages - 1}
                    className="hidden lg:flex absolute right-0 top-0 bottom-0 w-8 items-center justify-center rounded-r-xl bg-primary text-white hover:bg-primary-dark disabled:bg-[#0B4F54]/10 disabled:text-[#0B4F54]/30 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Next KPI page"
                  ><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
                </>
              )}
            </div>
            {kpiTotalPages > 1 && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center gap-1.5">
                  {Array.from({ length: kpiTotalPages }, (_, i) => (
                    <button key={i} type="button" onClick={() => setKpiPage(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === kpiPage ? 'bg-primary w-5' : 'bg-outline-variant hover:bg-outline'}`}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>
                {isTrendMobile && (
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/50 font-semibold tracking-wider animate-pulse">
                    <i className="fa-solid fa-chevron-left text-[8px]" /> SWIPE <i className="fa-solid fa-chevron-right text-[8px]" />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {activeSections.includes('ppc-procurement-breakdown') && (
        <MergedBreakdownSection data={data} />
      )}

      {activeSections.includes('ppc-supplier-share') && (
        <section id="ppc-supplier-share">
          <SectionPanel title="Contract by Supplier Share" subtitle="Distribution of contract value by supplier" action={<div className="flex items-center gap-1"><IconButton variant="expand" data={data.supplierShare.map(s => ({ label: s.label, value: s.amount }))} title="Contract by Supplier Share" /><IconButton variant="info" contentId="po-supplier-share" /></div>}>
            {(() => {
              const SUPPLIER_COLORS = {
                'EPSS': '#00373B', 'MOH': '#0B4F54', 'Global Fund': '#D97706', 'UNICEF': '#216E6A',
                'WHO': '#4A9598', 'UNDP': '#86BFC5', 'UNFPA': '#A4D1D6', 'Clinton Access Initiative': '#CFD8DC',
              };
              const totalContracts = data.supplierShare.reduce((s, x) => s + x.amount, 0);
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
                const slice = { ...s, color: SUPPLIER_COLORS[s.label] || '#CFD8DC', percent: totalContracts > 0 ? (s.amount / totalContracts) * 100 : 0, startAngle: accumulatedAngle, endAngle: accumulatedAngle + angle };
                accumulatedAngle += angle;
                return slice;
              });
              return isTrendMobile ? (
                <div className="flex flex-col items-center gap-4 font-sans">
                  <div className="w-full max-w-[280px] shrink-0 flex justify-center relative select-none">
                    <svg viewBox="0 0 280 280" className="w-full h-auto drop-shadow-sm" style={{ maxWidth: 280 }}>
                      {slices.map((slice) => {
                        const isSelected = selectedSupplier?.label === slice.label;
                        const opacity = selectedSupplier ? (isSelected ? 1 : 0.42) : 0.95;
                        const offset = isSelected ? 5 : 0;
                        const midAngle = (slice.startAngle + slice.endAngle) / 2;
                        const ox = offset * Math.cos(midAngle);
                        const oy = offset * Math.sin(midAngle);
                        return (
                          <path key={slice.label}
                            d={describeSlice(cx + ox, cy + oy, r, slice.startAngle, slice.endAngle)}
                            fill={slice.color} stroke="#ffffff" strokeWidth="2.5"
                            className="cursor-pointer transition-all duration-200" style={{ opacity }}
                            onClick={() => setSelectedSupplier(prev => prev?.label === slice.label ? null : slice)}
                          />
                        );
                      })}
                      <circle cx={cx} cy={cy} r={r * 0.65} fill="#ffffff" />
                      {selectedSupplier ? (
                        <g className="animate-fade-in text-center">
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">
                            {selectedSupplier.label.length > 18 ? `${selectedSupplier.label.slice(0, 15)}...` : selectedSupplier.label}
                          </text>
                          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#181C1E">{selectedSupplier.value}%</text>
                          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#404849" className="font-mono">{formatAmount(selectedSupplier.amount)} ETB</text>
                        </g>
                      ) : (
                        <g className="text-center">
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">Total Contracts</text>
                          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0B4F54" className="font-mono">{formatAmount(totalContracts)} ETB</text>
                          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11" fontWeight="600" fill="#707979">{data.supplierShare.length} Suppliers</text>
                        </g>
                      )}
                    </svg>
                    {selectedSupplier && (
                      <button onClick={() => setSelectedSupplier(null)}
                        className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-outline-variant shadow-sm text-on-surface-variant hover:text-on-surface transition-colors"
                        aria-label="Reset to total view"
                      >
                        <i className="fa-solid fa-xmark text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 font-sans">
                  <div className="w-full max-w-[280px] lg:w-[280px] shrink-0 flex justify-center relative select-none">
                    <svg viewBox="0 0 280 280" className="w-full h-auto drop-shadow-sm" style={{ maxWidth: 280 }}>
                      {slices.map((slice) => {
                        const isHovered = supplierHover?.label === slice.label;
                        const opacity = supplierHover ? (isHovered ? 1 : 0.42) : 0.95;
                        const offset = isHovered ? 5 : 0;
                        const midAngle = (slice.startAngle + slice.endAngle) / 2;
                        const ox = offset * Math.cos(midAngle);
                        const oy = offset * Math.sin(midAngle);
                        return (
                          <path key={slice.label}
                            d={describeSlice(cx + ox, cy + oy, r, slice.startAngle, slice.endAngle)}
                            fill={slice.color} stroke="#ffffff" strokeWidth="2.5"
                            className="cursor-pointer transition-all duration-200" style={{ opacity }}
                            onMouseEnter={() => setSupplierHover(slice)} onMouseLeave={() => setSupplierHover(null)}
                          />
                        );
                      })}
                      <circle cx={cx} cy={cy} r={r * 0.65} fill="#ffffff" />
                      {supplierHover ? (
                        <g className="animate-fade-in text-center">
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">
                            {supplierHover.label.length > 18 ? `${supplierHover.label.slice(0, 15)}...` : supplierHover.label}
                          </text>
                          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#181C1E">{supplierHover.value}%</text>
                          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#404849" className="font-mono">{formatAmount(supplierHover.amount)} ETB</text>
                        </g>
                      ) : (
                        <g className="text-center">
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">Total Contracts</text>
                          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0B4F54" className="font-mono">{formatAmount(totalContracts)} ETB</text>
                          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11" fontWeight="600" fill="#707979">{data.supplierShare.length} Suppliers</text>
                        </g>
                      )}
                    </svg>
                  </div>
                  <div className="w-full space-y-1.5">
                    {slices.map((slice) => {
                      const isHovered = supplierHover?.label === slice.label;
                      return (
                        <div key={slice.label}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer ${isHovered ? 'bg-surface-container-low border-outline-variant/60 shadow-sm' : 'bg-white border-transparent hover:bg-surface-low'}`}
                          onMouseEnter={() => setSupplierHover(slice)} onMouseLeave={() => setSupplierHover(null)}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0 border border-black/5" style={{ backgroundColor: slice.color }} />
                          <span className="text-body-sm font-semibold text-on-surface flex-1 truncate" title={slice.label}>{slice.label}</span>
                          <span className="inline-block px-2 py-0.5 text-[10.5px] font-bold rounded-md bg-surface-container text-on-surface-variant shrink-0">{slice.value}%</span>
                          <span className="text-body-sm font-mono font-semibold text-on-surface-variant w-24 text-right shrink-0">{formatAmount(slice.amount)} ETB</span>
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

      {(activeSections.includes('ppc-funding') || activeSections.includes('ppc-local-intl')) && (
        <div className="flex flex-col lg:flex-row gap-5">
          {activeSections.includes('ppc-funding') && (
            <section id="ppc-funding" className="w-full lg:w-[58.333%]">
        <SectionPanel title="Procurement by Funding Source" subtitle="Total procurement value by fund and year" action={
          <div className="relative">
            <select value={fundingYear} onChange={e => setFundingYear(e.target.value)}
              className="appearance-none h-8 min-w-[90px] rounded-md border border-outline-variant bg-white pl-2.5 pr-7 text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              {fundingYears.map((yr: string) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary pointer-events-none" />
          </div>
        }>
          {isTrendMobile ? (() => {
            const yearEntry = data.fundingSources.find(d => d.name === fundingYear) || data.fundingSources[0];
            const children = yearEntry?.children || [];
            const total = children.reduce((s, c) => s + c.value, 0);
            const FUND_COLORS = ['#0B4F54', '#D97706', '#216E6A', '#4A9598', '#515F74', '#86BFC5', '#059669', '#BA1A1A', '#4A8EA5'];
            const funds = children.map((c, i) => ({ ...c, percent: total > 0 ? (c.value / total) * 100 : 0, color: FUND_COLORS[i % FUND_COLORS.length] }))
              .sort((a, b) => b.value - a.value);
            if (!funds.length) return <div className="text-center py-10 text-body-sm text-on-surface-variant">No data for {fundingYear}.</div>;
            return (
              <div className="space-y-1">
                {funds.map((fund, i) => {
                  const isOpen = fundOpenIdx === i;
                  return (
                    <div key={fund.name} className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                      <button onClick={() => setFundOpenIdx(prev => prev === i ? -1 : i)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                        >
                          <span className="flex-1 text-sm font-semibold text-on-surface truncate">{fund.name}</span>
                          <i className={`fa-solid fa-chevron-down text-[10px] text-on-surface-variant transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="h-px bg-outline-variant/50 mb-3" />
                          <div className="bg-surface-container-low rounded-lg p-4 space-y-2 text-body-sm">
                            <DetailRow label="Procurement Value" value={`${formatAmount(fund.value)} ETB`} />
                            <DetailRow label="Share of Year" value={`${fund.percent.toFixed(1)}%`} />
                            {fund.poCount != null && <DetailRow label="Purchase Orders" value={fund.poCount.toLocaleString()} />}
                            {fund.supplierCount != null && <DetailRow label="Distinct Suppliers" value={fund.supplierCount.toLocaleString()} />}
                            {fund.materialCount != null && <DetailRow label="Distinct Materials" value={fund.materialCount.toLocaleString()} />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })() : (
            <FundingSourceChart data={data.fundingSources} selectedYear={fundingYear} />
          )}
        </SectionPanel>
            </section>
          )}
          {activeSections.includes('ppc-local-intl') && (
            <section id="ppc-local-intl" className="w-full lg:w-[41.666%]">
              <SectionPanel title="Local vs International Procurement" subtitle="Breakdown by procurement origin" action={<div className="flex items-center gap-1"><IconButton variant="expand" data={data.localVsIntl.map((l) => ({ label: l.type, value: l.amount, color: l.type?.toLowerCase().includes('international') ? '#D97706' : '#0B4F54' }))} title="Local vs International Procurement" /><IconButton variant="info" contentId="procurement-local-intl" /></div>}>
                <div className="w-full lg:h-[310px] flex items-center justify-center">
                  <PieChart data={data.localVsIntl.map((l) => ({ label: l.type, value: l.amount, color: l.type?.toLowerCase().includes('international') ? '#D97706' : '#0B4F54' }))} totalLabel="Procurement origin" />
                </div>
              </SectionPanel>
            </section>
          )}
        </div>
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
              const formatMonth = (d) => {
                const dt = new Date(d.date);
                return dt.toLocaleDateString('en', { month: 'short' });
              };
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

              const renderDetail = (idx) => {
                if (idx === null || idx < 0) return null;
                const t = filteredTrend[idx];
                const prev = filteredTrend[idx - 1];
                const change = prev ? ((t.amount - prev.amount) / prev.amount) * 100 : null;
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{formatMonth(t)} {trendYear}</p>
                      <p className="text-[28px] font-extrabold text-on-surface mt-1 leading-tight font-mono tracking-tight">
                        {formatAmount(t.amount)} <span className="text-[11px] text-on-surface-variant font-bold">ETB</span>
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
              };

              const detailPlaceholder = (type) => (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 mx-auto flex items-center justify-center">
                    <i className="fa-solid fa-chart-line text-xl text-primary/40" />
                  </div>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{type === 'mobile' ? 'Tap' : 'Hover'} a bar for details and month-over-month comparison.</p>
                </div>
              );

              return isTrendMobile ? (
                <div className="space-y-1" role="listbox" aria-label="Select a month">
                    {filteredTrend.map((t, i) => {
                      const prev = filteredTrend[i - 1];
                      const change = prev ? ((t.amount - prev.amount) / prev.amount) * 100 : null;
                      const isSel = selectedTrendIdx === i;
                      return (
                        <button key={t.monthLabel} role="option" aria-selected={isSel}
                          onClick={() => setSelectedTrendIdx(prev => prev === i ? -1 : i)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left ${
                            isSel ? 'bg-primary/5 border-primary/20' : 'bg-white border-outline-variant hover:bg-surface-low'
                          }`}
                        >
                          <span className="w-10 text-center text-xs font-bold text-on-surface-variant uppercase">{formatMonth(t)}</span>
                          <span className="flex-1 text-right font-mono font-bold text-sm text-on-surface">{formatAmount(t.amount)} <span className="text-[10px] text-on-surface-variant font-semibold">ETB</span></span>
                          {change !== null && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                              change >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                            }`}>
                              <i className={`fa-solid ${change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-[8px]`} />
                              {Math.abs(change).toFixed(1)}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                <div className="flex flex-col lg:flex-row items-stretch gap-6">
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
                        const isActive = trendHover === i;
                        return (
                          <g key={t.monthLabel}>
                             <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={i % 2 === 0 ? '#0B4F54' : '#D97706'}
                              stroke={isActive ? '#ffffff' : 'none'} strokeWidth={isActive ? 2.5 : 0}
                              opacity={trendHover === null || isActive ? 1 : 0.25}
                              onMouseEnter={() => setTrendHover(i)} onMouseLeave={() => setTrendHover(null)}
                              tabIndex={0}
                              role="button"
                              aria-label={`${formatMonth(t)} ${trendYear}: ${formatAmount(t.amount)} ETB`}
                              style={{ cursor: 'pointer', transition: 'all 0.3s ease-in-out' }}
                            />
                            {isActive && (
                              <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="#D97706">
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
                  <div className="w-full lg:w-72 lg:shrink-0 bg-surface-container-low rounded-xl p-5 flex flex-col justify-center min-h-[200px]">
                    {renderDetail(trendHover) ?? detailPlaceholder('desktop')}
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

const OPEN_TYPE_LABEL = { 'ZHP1': 'Health Program', 'ZRDL': 'RDF Local', 'ZRDI': 'RDF Intl.', 'FO': 'Framework Order' };

function MergedBreakdownSection({ data }: any) {
  const [view, setView] = useState('material');
  const [hover, setHover] = useState(null);
  const [openIndex, setOpenIndex] = useState(0);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const totalAllPO = data.poByType.reduce((s, t) => s + t.totalAmount, 0);
  const totalOpen = data.openPOByType.data.reduce((s, d) => s + d.totalOpenAmount, 0);
  const openMapped = data.openPOByType.data.map(d => ({ ...d, label: OPEN_TYPE_LABEL[d.sourceCategoryCode] || d.sourceCategoryCode }));
  const totalMat = data.poByMaterialType.reduce((s, t) => s + t.totalAmount, 0);

  const views = [
    { key: 'material', label: 'By Material Type', subtitle: `${data.poByMaterialType.length} types — ${formatAmount(totalMat)} total`,
      data: data.poByMaterialType, labelKey: 'materialTypeName', amountKey: 'totalAmount', shareKey: 'amountSharePercent',
      tooltipKeys: { name: 'materialTypeName', amount: 'totalAmount', share: 'amountSharePercent', lines: 'purchaseOrderLineCount' } },
    { key: 'po-type', label: 'By PO Type', subtitle: `${data.poByType.length} types — ${formatAmount(totalAllPO)} total`,
      data: data.poByType, labelKey: 'purchaseOrderType', amountKey: 'totalAmount', shareKey: 'amountSharePercent',
      tooltipKeys: { name: 'purchaseOrderType', amount: 'totalAmount', share: 'amountSharePercent', lines: 'purchaseOrderLineCount' } },
    { key: 'open-po', label: 'Open by PO Type', subtitle: `${openMapped.length} types — ${formatAmount(totalOpen)} open`,
      data: openMapped, labelKey: 'label', amountKey: 'totalOpenAmount', shareKey: 'openAmountSharePercent',
      tooltipKeys: { name: 'label', amount: 'totalOpenAmount', share: 'openAmountSharePercent', lines: 'purchaseOrderItemCount' } },
  ];

  const active = views.find(v => v.key === view) || views[0];
  const sorted = [...active.data].sort((a, b) => b[active.amountKey] - a[active.amountKey]);
  const maxAmount = sorted[0]?.[active.amountKey] || 1;
  const labelMap = {
    'Laboratory commodity': 'Lab Commodity',
    'Medical Supply': 'Med Supply',
    'By Health Program': 'Health Program',
    'RDF International': 'RDF Intl.',
    'RDF  local': 'RDF Local',
  };

  const toggleRow = useCallback((index: number) => {
    setOpenIndex(prev => prev === index ? -1 : index);
  }, []);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleRow(index);
    }
  }, [toggleRow]);

  return (
    <section id="ppc-procurement-breakdown">
      <SectionPanel title="Procurement Breakdown" subtitle={active.subtitle} action={<IconButton variant="info" contentId="po-procurement-breakdown" />}>
        <div className="relative mb-5 w-fit">
          <select value={view} onChange={(e) => { setView(e.target.value); setHover(null); }}
            className="appearance-none h-8 rounded-md border border-outline-variant bg-white pl-2.5 pr-7 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            {views.map(v => (
              <option key={v.key} value={v.key}>{v.label}</option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-primary pointer-events-none" />
        </div>
        {isMobile ? (
          /* Mobile: accordion list */
          <div className="space-y-2">
            {sorted.map((t, i) => {
              const barW = Math.max(10, (t[active.amountKey] / maxAmount) * 100);
              const label = labelMap[t[active.labelKey]] || t[active.labelKey];
              const isOpen = openIndex === i;
              return (
                <div key={i} className="rounded-xl border border-outline-variant bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleRow(i)}
                    onKeyDown={(e) => handleRowKeyDown(e, i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                  >
                    <span className="w-3 h-3 shrink-0 rounded-sm" style={{ backgroundColor: PO_TYPE_COLORS[i % PO_TYPE_COLORS.length] }} />
                    <span className="flex-1 min-w-0 text-sm font-semibold text-on-surface truncate">{label}</span>
                    <span className="text-xs font-bold text-on-surface-variant tabular-nums">{formatAmount(t[active.amountKey])}</span>
                    <i className={`fa-solid fa-chevron-down text-[10px] text-on-surface-variant transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="h-px bg-outline-variant/50 mb-3" />
                      <div className="bg-surface-container-low rounded-lg p-4">
                        <DetailContent active={active} hover={t} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: bars + side panel */
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-[58.333%]">
              <BarChart data={active.data} labelKey={active.labelKey} amountKey={active.amountKey} shareKey={active.shareKey} colors={PO_TYPE_COLORS} setHover={setHover} activeHover={hover} />
            </div>
            <div className="w-full lg:w-[41.666%] bg-surface-container-low rounded-xl p-6 flex flex-col justify-center min-h-[200px]">
              {hover ? (
                <DetailContent active={active} hover={hover} />
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 mx-auto flex items-center justify-center">
                    <i className="fa-solid fa-chart-bar text-xl text-primary/40" />
                  </div>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">Hover over a bar to view category-specific details.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </SectionPanel>
    </section>
  );
}
