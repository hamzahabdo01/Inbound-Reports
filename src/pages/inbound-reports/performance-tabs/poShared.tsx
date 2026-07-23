export const formatAmount = (v) => {
  if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
};

export function StatusBadge({ status }: any) {
  const map = {
    Open: 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    Overdue: 'bg-error/10 text-error',
    Completed: 'bg-success/10 text-success',
    Active: 'bg-success/10 text-success',
    Expired: 'bg-surface-container text-on-surface-variant',
    Critical: 'bg-error/10 text-error',
    Warning: 'bg-warning/10 text-warning',
    'Received at Warehouse': 'bg-success/10 text-success',
    'Contract Signed': 'bg-primary/10 text-primary',
    'PO Issued': 'bg-primary/10 text-primary',
    'LC Opened': 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
    'Port Arrival': 'bg-warning/10 text-warning',
    Cleared: 'bg-success/10 text-success',
    Received: 'bg-success/10 text-success',
    Verified: 'bg-success/10 text-success',
    Confiscated: 'bg-error/10 text-error',
    Extended: 'bg-warning/10 text-warning',
    MISSING: 'bg-surface-container text-on-surface-variant',
    SUBMITTED_NOT_RECEIVED: 'bg-warning/10 text-warning',
    EXPIRING_WITHIN_30_DAYS: 'bg-error/10 text-error',
    RECEIVED_EXPIRY_MISSING: 'bg-warning/10 text-warning',
    VALID: 'bg-success/10 text-success',
    EXPIRED: 'bg-surface-container text-on-surface-variant',
    EXPIRES_TODAY: 'bg-error/10 text-error',
    EXPIRES_WITHIN_7_DAYS: 'bg-error/10 text-error',
    EXPIRES_WITHIN_30_DAYS: 'bg-warning/10 text-warning',
    EXPIRES_WITHIN_60_DAYS: 'bg-success/10 text-success',
  };
  const cls = map[status] || 'bg-surface-container text-on-surface-variant';
  return <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md ${cls}`}>{status}</span>;
}

export function SectionPanel({ title, subtitle, action, searchBar, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-level-1">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-outline-variant/50">
        <div className="min-w-0 shrink">
          <h3 className="text-title-sm font-bold text-on-surface lg:truncate">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5 lg:truncate">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {searchBar && (
        <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface-container-lowest/40">
          {searchBar}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
