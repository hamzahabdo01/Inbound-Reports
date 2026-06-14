import { memo } from 'react';

function KPICard({ icon, iconBg, iconColor, label, value, valueColor, subtitle, trend, trendIcon, variant, className, children }) {
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
        <div className={`text-display-kpi leading-none ${valueColorClass || 'text-slate-900'}`}>{value}</div>
        {subtitle && <p className={`text-xs font-semibold mt-2 ${trendIcon || 'text-on-surface-variant'}`}>{subtitle}</p>}
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
        <div className={`text-display-kpi font-extrabold ${valueColorClass}`}>{value}</div>
        {trend && (
          <span className={`flex items-center text-body-sm ${trendIcon ? trendIcon : ''}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && !trend && <p className="text-xs text-on-surface-variant mt-2">{subtitle}</p>}
      {children}
    </div>
  );
}

export default memo(KPICard);
