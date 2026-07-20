function ProgramPanel({ title, subtitle, action, children, className = '' }: any) {
  return (
    <section className={`bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)] ${className}`}>
      <div className="flex flex-row items-center justify-between gap-4 border-b border-outline-variant px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-header-sm text-on-surface">{title}</h2>
          {subtitle && <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export default ProgramPanel;
