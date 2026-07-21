function ProgramPanel({ title, subtitle, action, titleAction, children, className = '', stackOnMobile }: any) {
  return (
    <section className={`bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)] ${className}`}>
      <div className={`flex ${stackOnMobile ? 'flex-col' : 'flex-row'} items-start sm:items-center justify-between gap-4 border-b border-outline-variant px-4 py-4 sm:px-5`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-body-md sm:text-header-sm text-on-surface">{title}</h2>
            {titleAction}
          </div>
          {subtitle && <p className="text-xs sm:text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2 flex-wrap">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export default ProgramPanel;
