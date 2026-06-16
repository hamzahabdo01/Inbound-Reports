const statusStyles = {
  Normal: 'bg-success/10 text-success',
  Excess: 'bg-primary/10 text-primary',
  'Below EOP': 'bg-warning/10 text-warning',
  'Stocked Out': 'bg-error/10 text-error',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusStyles[status] || 'bg-surface-container text-on-surface-variant'}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default StatusBadge;
