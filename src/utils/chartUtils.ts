export const CHART_PALETTE = [
  '#00373B', '#0B4F54', '#216E6A', '#4A9598',
  '#86BFC5', '#D97706', '#515F74', '#059669',
  '#BA1A1A', '#4A8EA5',
];

export const getChartColor = (index: number, palette = CHART_PALETTE) => palette[index % palette.length];

export const formatCompactNumber = (v: number): string => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return new Intl.NumberFormat('en').format(v);
};
