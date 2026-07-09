export const CHART_PALETTE = [
  '#0B4F54', // Primary default
  '#D97706', // Secondary (Amber/Orange)
  '#216E6A', // Medium teal
  '#00373B', // Dark teal
  '#4A9598', // Light teal
  '#86BFC5', // Primary container light
  '#059669', // Success green
  '#515F74', // Muted blue/grey
  '#BA1A1A', // Error red
  '#4A8EA5', // Muted teal
];

export const getChartColor = (index: number, palette = CHART_PALETTE) => palette[index % palette.length];

export const formatCompactNumber = (v: number): string => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return new Intl.NumberFormat('en').format(v);
};
