function ProgramCard({ icon, label, value, helper, tone = 'neutral' }) {
  const toneMap = {
    neutral: 'bg-surface-container text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-[0px_4px_20px_rgba(10,50,53,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-caps uppercase text-on-surface-variant">{label}</p>
          <p className="mt-2 text-[30px] leading-9 font-extrabold text-on-surface">{value}</p>
          {helper && <p className="mt-2 text-body-sm text-on-surface-variant">{helper}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
      </div>
    </div>
  );
}

export default ProgramCard;
