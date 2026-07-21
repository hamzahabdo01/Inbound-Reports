import { CHART_PALETTE } from '../utils/chartUtils';

export type StackedShareSegment = {
  key: string;
  label: string;
  value: number;
};

export type StackedShareBarRow = {
  key: string;
  label: string;
  segments: StackedShareSegment[];
};

type StackedShareBarProps = {
  rows: StackedShareBarRow[];
  colorMap?: Record<string, string>;
  formatValue?: (value: number, segment: StackedShareSegment) => string;
  className?: string;
};

function defaultFormatValue(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toLocaleString();
}

function getSegmentColor(key: string, colorMap: Record<string, string> | undefined, index: number): string {
  if (colorMap && colorMap[key]) return colorMap[key];
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function buildLegend(rows: StackedShareBarRow[], colorMap: Record<string, string> | undefined): { key: string; label: string; color: string }[] {
  const seen = new Map<string, { key: string; label: string }>();
  let colorIndex = 0;
  for (const row of rows) {
    for (const seg of row.segments) {
      if (!seen.has(seg.key)) {
        seen.set(seg.key, { key: seg.key, label: seg.label });
      }
    }
  }
  return Array.from(seen.values()).map((entry) => {
    const color = getSegmentColor(entry.key, colorMap, colorIndex);
    colorIndex++;
    return { ...entry, color };
  });
}

export default function StackedShareBar({ rows, colorMap, formatValue, className = '' }: StackedShareBarProps) {
  const fmt = formatValue || defaultFormatValue;

  if (!rows || rows.length === 0) {
    return <div className={`flex items-center justify-center h-32 text-body-sm text-on-surface-variant ${className}`}>No data</div>;
  }

  const legend = buildLegend(rows, colorMap);

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      <div className="flex flex-col gap-4">
        {rows.map((row) => {
          const total = row.segments.reduce((s, seg) => s + seg.value, 0);

          return (
            <div key={row.key} className="flex items-center gap-4">
              <div className="w-24 shrink-0 text-right text-xs font-semibold text-[#404849]">{row.label}</div>
              <div
                className="flex-1 flex h-8 rounded-full overflow-hidden bg-[#F0F4F6]"
                role="img"
                aria-label={`${row.label}: ${row.segments.map((s) => `${s.label} ${s.value}`).join(', ')}`}
              >
                {total === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[10px] text-on-surface-variant/50">—</div>
                ) : (
                  row.segments.map((seg) => {
                    if (seg.value <= 0) return null;
                    const pct = (seg.value / total) * 100;
                    if (pct < 0.5) return null;
                    const color = getSegmentColor(seg.key, colorMap, legend.findIndex((l) => l.key === seg.key));
                    return (
                      <div
                        key={seg.key}
                        className="h-full flex items-center justify-center text-[10px] font-bold text-white transition-opacity duration-150 hover:opacity-80 cursor-default"
                        style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct >= 1 ? '1.5rem' : undefined }}
                        title={`${seg.label}: ${fmt(seg.value, seg)} (${pct.toFixed(1)}%)`}
                      >
                        {pct >= 8 ? `${pct.toFixed(0)}%` : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {legend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map((entry) => (
            <div key={entry.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{entry.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
