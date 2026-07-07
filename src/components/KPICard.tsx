import { memo } from 'react';

const parseValue = (val) => {
  if (typeof val !== 'string') return val;
  if (val.endsWith(' ETB')) {
    return <>{val.slice(0, -4)}<span className="text-[0.45em] font-medium text-on-surface-variant align-baseline leading-none"> ETB</span></>;
  }
  if (val.endsWith('ETB')) {
    return <>{val.slice(0, -3)}<span className="text-[0.45em] font-medium text-on-surface-variant align-baseline leading-none">ETB</span></>;
  }
  if (val.endsWith('%')) {
    return <>{val.slice(0, -1)}<span className="text-[0.45em] font-medium text-on-surface-variant align-baseline leading-none">%</span></>;
  }
  if (/^\d+(mo|[dyw])(\s+\d+(mo|[dyw]))*$/.test(val)) {
    return <>{val.split(/\s+/).map((part, i) => {
      const m = part.match(/^(\d+)(mo|[dyw])$/);
      return m
        ? <span key={i}>{i > 0 ? ' ' : ''}{m[1]}<span className="text-[0.45em] font-medium text-on-surface-variant align-baseline leading-none">{m[2]}</span></span>
        : <span key={i}>{i > 0 ? ' ' : ''}{part}</span>;
    })}</>;
  }
  return val;
};

const formatTrend = (t: any) => {
  if (typeof t === 'number') {
    const isUp = t >= 0;
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#BA1A1A]/10 text-[#BA1A1A]'}`}>
        {isUp ? '\u2191' : '\u2193'} {Math.abs(t)}%
      </span>
    );
  }
  return t;
};

function KPICard({ icon, iconBg, iconColor, label, value, valueColor, subtitle, trend, trendIcon, trendLabel, variant, className, children }: any) {
  const iconColorClass = iconColor || 'text-on-surface-variant';
  const valueColorClass = valueColor || 'text-on-surface';

  if (variant === 'detailed') {
    return (
      <div className={`bg-white p-lg rounded-xl shadow-level-1 border border-outline-variant hover:shadow-md transition-shadow ${className || ''}`}>
        <div className={`flex items-center justify-between mb-sm ${iconColorClass || 'text-on-surface-variant'}`}>
          <span className="text-label-caps uppercase text-xs">{label}</span>
          <div className={`w-8 h-8 rounded-full ${iconBg || 'bg-slate-50'} flex items-center justify-center ${iconColorClass || 'text-slate-500'}`}>
            <i className={`fa-solid ${icon}`}></i>
          </div>
        </div>
        <div className={`text-display-kpi leading-none ${valueColorClass || 'text-slate-900'}`}>{parseValue(value)}</div>
        {subtitle && <p className={`text-xs font-semibold mt-2 ${trendIcon || 'text-on-surface-variant'}`}>{subtitle}</p>}
        {trendLabel && <p className="text-xs text-on-surface-variant mt-1">{trendLabel}</p>}
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${className || ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <i className={`fa-solid ${icon} text-lg ${iconColorClass}`}></i>
        <div className="text-label-caps text-on-surface-variant uppercase text-[11px]">{label}</div>
      </div>
      <div className="flex items-baseline gap-3">
        <div className={`text-display-kpi font-extrabold ${valueColorClass}`}>{parseValue(value)}</div>
        {trend && (
          <span className={`flex items-center text-body-sm ${trendIcon ? trendIcon : ''}`}>
            {formatTrend(trend)}
          </span>
        )}
      </div>
      {subtitle && !trend && <p className="text-xs text-on-surface-variant mt-2">{subtitle}</p>}
      {trendLabel && <p className="text-xs text-on-surface-variant mt-2">{trendLabel}</p>}
      {children}
    </div>
  );
}

export default memo(KPICard);
