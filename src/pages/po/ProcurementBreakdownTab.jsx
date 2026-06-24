import { createPortal } from 'react-dom';
import PieChart from '../../components/PieChart';
import SunburstChart from '../../components/SunburstChart';
import InfoButton from '../../components/InfoButton';
import ExpandButton from '../../components/ExpandButton';
import { SectionPanel, formatAmount } from './poShared';

const MATERIAL_COLORS = ['#0B4F54', '#216E6A', '#4A9598', '#86BFC5'];
const PO_TYPE_COLORS = ['#0B4F54', '#216E6A', '#4A9598', '#86BFC5'];

function BarChart({ data, labelKey, amountKey, shareKey, colors, labelW = 110, barAreaW = 400, onHover, hoverState, setHover }) {
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
            <g key={t[labelKey]}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="#404849">{label}</text>
              <rect x={labelW} y={y} width={barW} height={barH} rx="5" fill={colors[i % colors.length]} opacity="0.88"
                onMouseEnter={(e) => setHover({ ...t, mx: e.clientX, my: e.clientY })}
                onMouseMove={(e) => setHover(prev => prev ? { ...prev, mx: e.clientX, my: e.clientY } : prev)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              />
              <text x={labelW + barW + 6} y={y + barH / 2 + 4} fontSize="12" fontWeight="800" fill="#181C1E" fontFamily="monospace">{amountStr}</text>
              <text x={labelW + barW + 6} y={y + barH / 2 + 16} fontSize="9" fontWeight="600" fill="#9AA3B0">
                {t[shareKey]?.toFixed(1)}% · {t.purchaseOrderCount} POs
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ProcurementBreakdownTab({ data, activeSections, materialHover, setMaterialHover, poTypeHover, setPoTypeHover, supplierHover, setSupplierHover }) {
  return (
    <>
      {(activeSections.includes('ppc-commodity') || activeSections.includes('ppc-po-type')) && (
        <div className="grid grid-cols-2 gap-5">
          {activeSections.includes('ppc-commodity') && (
            <section id="ppc-commodity">
              <SectionPanel title="Proc. Amount by Material Type" subtitle={`${data.poByMaterialType.length} types — ${formatAmount(data.poByMaterialType.reduce((s, t) => s + t.totalAmount, 0))} total`} action={<InfoButton contentId="po-commodity-type" />}>
                <BarChart data={data.poByMaterialType} labelKey="materialTypeName" amountKey="totalAmount" shareKey="amountSharePercent" colors={MATERIAL_COLORS} setHover={setMaterialHover} />
                {materialHover?.mx !== undefined && createPortal(
                  <div className="fixed z-[9999] pointer-events-none" style={{ left: materialHover.mx + 16, top: materialHover.my - 8 }}>
                    <div style={{ background: '#fff', border: '1px solid #CFD8DC', borderRadius: '10px', boxShadow: '0 12px 32px rgba(10,50,53,0.12)', padding: '10px 14px', minWidth: '180px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#181C1E', marginBottom: 6 }}>{materialHover.materialTypeName}</div>
                      <div style={{ fontSize: 11, color: '#707979', marginBottom: 2 }}>Amount: <span style={{ fontWeight: 800, color: '#0A3235' }}>ETB {materialHover.totalAmount.toLocaleString()}</span></div>
                      <div style={{ fontSize: 11, color: '#707979', marginBottom: 2 }}>Share: <span style={{ fontWeight: 700 }}>{materialHover.amountSharePercent.toFixed(1)}%</span></div>
                      <div style={{ fontSize: 11, color: '#707979', marginBottom: 2 }}>POs: <span style={{ fontWeight: 700 }}>{materialHover.purchaseOrderCount}</span> · Lines: <span style={{ fontWeight: 700 }}>{materialHover.purchaseOrderLineCount}</span></div>
                      <div style={{ fontSize: 11, color: '#707979' }}>Materials: <span style={{ fontWeight: 700 }}>{materialHover.materialCount}</span> · Suppliers: <span style={{ fontWeight: 700 }}>{materialHover.supplierCount}</span></div>
                    </div>
                  </div>,
                  document.body
                )}
              </SectionPanel>
            </section>
          )}
          {activeSections.includes('ppc-po-type') && (
            <section id="ppc-po-type">
              <SectionPanel title="Proc. Amount by PO Type" subtitle={`${data.poByType.length} types — ${formatAmount(data.poByType.reduce((s, t) => s + t.totalAmount, 0))} total`} action={<InfoButton contentId="po-po-type" />}>
                <BarChart data={data.poByType} labelKey="purchaseOrderType" amountKey="totalAmount" shareKey="amountSharePercent" colors={PO_TYPE_COLORS} setHover={setPoTypeHover} />
                {poTypeHover?.mx !== undefined && createPortal(
                  <div className="fixed z-[9999] pointer-events-none" style={{ left: poTypeHover.mx + 16, top: poTypeHover.my - 8 }}>
                    <div style={{ background: '#fff', border: '1px solid #CFD8DC', borderRadius: '10px', boxShadow: '0 12px 32px rgba(10,50,53,0.12)', padding: '10px 14px', minWidth: '200px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#181C1E', marginBottom: 6 }}>{poTypeHover.purchaseOrderType}</div>
                      <div style={{ fontSize: 11, color: '#707979', marginBottom: 2 }}>Amount: <span style={{ fontWeight: 800, color: '#0A3235' }}>ETB {poTypeHover.totalAmount.toLocaleString()}</span></div>
                      <div style={{ fontSize: 11, color: '#707979', marginBottom: 2 }}>Share: <span style={{ fontWeight: 700 }}>{poTypeHover.amountSharePercent.toFixed(1)}%</span></div>
                      <div style={{ fontSize: 11, color: '#707979', marginBottom: 2 }}>POs: <span style={{ fontWeight: 700 }}>{poTypeHover.purchaseOrderCount}</span> · Lines: <span style={{ fontWeight: 700 }}>{poTypeHover.purchaseOrderLineCount}</span></div>
                      <div style={{ fontSize: 11, color: '#707979' }}>Materials: <span style={{ fontWeight: 700 }}>{poTypeHover.materialCount}</span> · Suppliers: <span style={{ fontWeight: 700 }}>{poTypeHover.supplierCount}</span></div>
                    </div>
                  </div>,
                  document.body
                )}
              </SectionPanel>
            </section>
          )}
        </div>
      )}

      {activeSections.includes('ppc-supplier-share') && (
        <section id="ppc-supplier-share">
          <SectionPanel title="Contract by Supplier Share" subtitle="Distribution of contract value by supplier">
            {(() => {
              const SUPPLIER_COLORS = {
                'EPSS': '#00373B', 'MOH': '#0B4F54', 'Global Fund': '#115E59', 'UNICEF': '#216E6A',
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
    </>
  );
}
