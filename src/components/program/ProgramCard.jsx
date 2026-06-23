function ProgramCard({ icon, label, value, helper, tone = 'neutral' }) {
  const toneMap = {
    neutral: 'bg-surface-container text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-[#4A8EA5]/10 text-[#4A8EA5]',
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl px-4 pt-4 pb-3 shadow-[0px_4px_20px_rgba(10,50,53,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label-caps uppercase text-on-surface-variant">{label}</p>
          <p className="mt-1.5 text-[28px] leading-8 font-extrabold text-on-surface">{value}</p>
          {helper && <p className="mt-1 text-body-sm text-on-surface-variant">{helper}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${toneMap[tone]}`}>
          <i className={`fa-solid ${icon} text-sm`}></i>
        </div>
      </div>
    </div>
  );
}

export default ProgramCard;
