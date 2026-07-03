import { useMemo, useState } from 'react';

const COLORS = [
  '#0B4F54', '#D97706', '#216E6A', '#4A9598',
  '#515F74', '#86BFC5', '#059669', '#BA1A1A', '#4A8EA5',
];

function fmt(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(Math.round(v));
}

interface FundChild {
  name: string;
  value: number;
  poCount?: number;
  supplierCount?: number;
  materialCount?: number;
  yearPct?: number;
}

interface FundingSourceChartProps {
  data: Array<{
    name: string;
    value: number;
    children: FundChild[];
  }>;
  selectedYear: string;
}

export default function FundingSourceChart({ data, selectedYear }: FundingSourceChartProps) {
  const [tooltip, setTooltip] = useState<{
    fund: FundChild & { percent: number; color: string };
    x: number; y: number;
  } | null>(null);

  const yearData = useMemo(() => data.find((d) => d.name === selectedYear) || data[0], [data, selectedYear]);

  const funds = useMemo(() => {
    if (!yearData) return [];
    const children = yearData.children || [];
    const total = children.reduce((s, c) => s + c.value, 0);
    return children
      .map((c, i) => ({
        ...c,
        percent: total > 0 ? (c.value / total) * 100 : 0,
        color: COLORS[i % COLORS.length],
      }))
      .sort((a: any, b: any) => b.value - a.value);
  }, [yearData]);

  if (!data.length) {
    return <div className="flex h-64 items-center justify-center text-sm text-on-surface-variant">No data</div>;
  }

  return (
    <div className="space-y-3 relative">
      {funds.map((fund) => (
        <div key={fund.name} className="flex items-center gap-3 group"
          onMouseEnter={(e) => setTooltip({ fund, x: e.clientX, y: e.clientY })}
          onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="w-[110px] shrink-0 text-right">
            <span className="text-[12px] font-semibold text-on-surface truncate block">{fund.name}</span>
          </div>
          <div className="flex-1 h-7 bg-surface-container rounded-md relative">
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-all duration-500 ease-in-out flex items-center overflow-visible"
              style={{
                width: `${Math.max(2, fund.percent)}%`,
                backgroundColor: fund.color,
              }}
            >
              {fund.percent >= 8 && (
                <span className="ml-2 text-[11px] font-bold text-white pointer-events-none truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  {fund.percent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {tooltip && (() => {
        const f = tooltip.fund;
        return (
          <div className="fixed pointer-events-none bg-white rounded-xl shadow-lg border border-outline-variant px-4 py-3 text-xs z-50"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
              <span className="font-bold text-on-surface text-[13px]">{f.name}</span>
              <span className="text-[11px] text-on-surface-variant ml-1">{selectedYear}</span>
            </div>
            <div className="space-y-1 text-on-surface-variant">
              <div className="flex justify-between gap-6"><span>Procurement Value</span><span className="font-semibold text-on-surface tabular-nums">{fmt(f.value)} ETB</span></div>
              <div className="flex justify-between gap-6"><span>Share of Year</span><span className="font-semibold text-on-surface">{f.percent.toFixed(1)}%</span></div>
              {f.poCount != null && <div className="flex justify-between gap-6"><span>Purchase Orders</span><span className="font-semibold text-on-surface tabular-nums">{f.poCount.toLocaleString()}</span></div>}
              {f.supplierCount != null && <div className="flex justify-between gap-6"><span>Distinct Suppliers</span><span className="font-semibold text-on-surface tabular-nums">{f.supplierCount.toLocaleString()}</span></div>}
              {f.materialCount != null && <div className="flex justify-between gap-6"><span>Distinct Materials</span><span className="font-semibold text-on-surface tabular-nums">{f.materialCount.toLocaleString()}</span></div>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
