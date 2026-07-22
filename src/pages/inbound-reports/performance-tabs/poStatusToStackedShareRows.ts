import type { StackedShareBarRow, StackedShareSegment } from '../../../components/StackedShareBar';

type PoStatusInput = {
  stage: string;
  count: number;
  value: number;
  color: string;
};

function toKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || label;
}

export function poStatusToStackedShareRows(data: PoStatusInput[]): {
  rows: StackedShareBarRow[];
  colorMap: Record<string, string>;
} {
  const colorMap: Record<string, string> = {};
  const segmentsByKey = new Map<string, { label: string; count: number; value: number }>();

  for (const item of data) {
    const key = toKey(item.stage);
    colorMap[key] = item.color;
    segmentsByKey.set(key, { label: item.stage, count: item.count, value: item.value });
  }

  const segments: StackedShareSegment[] = Array.from(segmentsByKey.entries()).map(([key, info]) => ({
    key,
    label: info.label,
    value: info.count,
  }));

  const valueSegments: StackedShareSegment[] = Array.from(segmentsByKey.entries()).map(([key, info]) => ({
    key,
    label: info.label,
    value: info.value,
  }));

  const rows: StackedShareBarRow[] = [
    {
      key: 'count',
      label: 'PO Count',
      segments,
    },
    {
      key: 'value',
      label: 'Procurement Value (ETB)',
      segments: valueSegments,
    },
  ];

  return { rows, colorMap };
}

export function formatPoValue(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(0) + 'K';
  return value.toLocaleString();
}
