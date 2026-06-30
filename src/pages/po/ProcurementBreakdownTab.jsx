import { useState } from 'react';
import { createPortal } from 'react-dom';
import PieChart from '../../components/PieChart';
import SunburstChart from '../../components/SunburstChart';
import InfoButton from '../../components/InfoButton';
import ExpandButton from '../../components/ExpandButton';
import { SectionPanel, formatAmount } from './poShared';

const PO_TYPE_COLORS = ['#0B4F54', '#D97706', '#216E6A', '#4A9598'];

function BarChart({ data, labelKey, amountKey, shareKey, colors, labelW = 110, barAreaW = 400, setHover, activeHover }) {
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
          const amountStr = formatAmount(t[amountKey]);
          const label = labelMap[t[labelKey]] || t[labelKey];
          return (
            <g key={t[labelKey]} className="cursor-pointer" 
              onMouseEnter={(e) => setHover({ ...t, mx: e.clientX, my: e.clientY })}
              onMouseMove={(e) => setHover(prev => prev ? { ...prev, mx: e.clientX, my: e.clientY } : prev)}
              onMouseLeave={() => setHover(null)}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11" fontWeight={activeHover && activeHover[labelKey] === t[labelKey] ? 800 : 700} fill={activeHover && activeHover[labelKey] === t[labelKey] ? "#0B4F54" : "#404849"}>{label}</text>
              <rect x={labelW} y={y} width={barW} height={barH} rx="5" fill={colors[i % colors.length]} opacity={activeHover && activeHover[labelKey] === t[labelKey] ? 1 : 0.8}
                style={{ transition: 'opacity 0.15s' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ProcurementBreakdownTab({ data, activeSections, supplierHover, setSupplierHover, trendYears, trendYear, setTrendYear, filteredTrend, trendHover, setTrendHover }) {
  return (
    <>
      {activeSections.includes('ppc-procurement-breakdown') && (
        <MergedBreakdownSection data={data} />
      )}


      {activeSections.includes('ppc-supplier-share') && (
        <section id="ppc-supplier-share">
          <SectionPanel title="Contract by Supplier Share" subtitle="Distribution of contract value by supplier">
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
                const slice = { ...s, color: SUPPLIER_COLORS[s.label] || '#CFD8DC', startAngle: accumulatedAngle, endAngle: accumulatedAngle + angle };
                accumulatedAngle += angle;
                return slice;
              });
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center font-sans">
                  <div className="md:col-span-6 flex justify-center relative select-none">
                    <svg width="280" height="280" viewBox="0 0 280 280" className="drop-shadow-sm">
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
                          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#404849" className="font-mono">${formatAmount(supplierHover.amount)}</text>
                        </g>
                      ) : (
                        <g className="text-center">
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#707979" className="uppercase tracking-wider">Total Contracts</text>
                          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0B4F54" className="font-mono">${formatAmount(totalContracts)}</text>
                          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="11" fontWeight="600" fill="#707979">{data.supplierShare.length} Suppliers</text>
                        </g>
                      )}
                    </svg>
                  </div>
                  <div className="md:col-span-6 space-y-1.5">
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
                          <span className="text-body-sm font-mono font-semibold text-on-surface-variant w-24 text-right shrink-0">${formatAmount(slice.amount)}</span>
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
              <SectionPanel title="Local vs International Procurement" subtitle="Breakdown by procurement origin" action={<div className="flex items-center gap-1"><ExpandButton data={data.localVsIntl.map((l) => ({ label: l.type, value: l.amount }))} title="Local vs International Procurement" /><InfoButton contentId="procurement-local-intl" /></div>}>
                <div className="max-w-sm mx-auto h-[310px] flex flex-col justify-center">
                  <PieChart data={data.localVsIntl.map((l) => ({ label: l.type, value: l.amount }))} totalLabel="Procurement origin" />
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
                             <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={i % 2 === 0 ? '#0B4F54' : '#D97706'}
                              opacity={trendHover === null || isHovered ? 1 : 0.25}
                              onMouseEnter={() => setTrendHover(i)} onMouseLeave={() => setTrendHover(null)}
                              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                            />
                            {isHovered && (
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
                  <div className="w-72 shrink-0 bg-surface-container-low rounded-xl p-5 flex flex-col justify-center min-h-[200px]">
                    {trendHover !== null ? (() => {
                      const t = filteredTrend[trendHover];
                      const prev = filteredTrend[trendHover - 1];
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

const OPEN_TYPE_LABEL = { 'ZHP1': 'Health Program', 'ZRDL': 'RDF Local', 'ZRDI': 'RDF Intl.', 'FO': 'Framework Order' };

function MergedBreakdownSection({ data }) {
  const [view, setView] = useState('material');
  const [hover, setHover] = useState(null);
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

  return (
    <section id="ppc-procurement-breakdown">
      <SectionPanel title="Procurement Breakdown" subtitle={active.subtitle} action={<InfoButton contentId="po-procurement-breakdown" />}>
        <div className="flex items-center gap-1 mb-5 bg-surface-container-low rounded-lg p-1 w-fit">
          {views.map(v => (
            <button key={v.key} onClick={() => { setView(v.key); setHover(null); }}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-all duration-150 ${
                view === v.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >{v.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7">
            <BarChart data={active.data} labelKey={active.labelKey} amountKey={active.amountKey} shareKey={active.shareKey} colors={PO_TYPE_COLORS} setHover={setHover} activeHover={hover} />
          </div>
          <div className="col-span-5 bg-surface-container-low rounded-xl p-6 flex flex-col justify-center min-h-[200px]">
            {hover ? (
              <div className="space-y-4">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{active.label}</p>
                  <p className="text-[20px] font-extrabold text-on-surface mt-1">{hover[active.tooltipKeys.name]}</p>
                </div>
                <div className="space-y-2 text-body-sm">
                  <div className="flex justify-between"><span className="text-on-surface-variant">Amount</span><span className="font-bold text-on-surface">{formatAmount(hover[active.tooltipKeys.amount])} ETB</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Share</span><span className="font-bold text-on-surface">{hover[active.tooltipKeys.share].toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">POs</span><span className="font-bold text-on-surface">{hover.purchaseOrderCount}</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Lines</span><span className="font-bold text-on-surface">{hover[active.tooltipKeys.lines]}</span></div>
                </div>
              </div>
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
      </SectionPanel>
    </section>
  );
}
