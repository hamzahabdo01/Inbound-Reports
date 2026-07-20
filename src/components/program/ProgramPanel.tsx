function ProgramPanel({ title, subtitle, action, children, className = '' }: any) {
  return (
    <section className={`bg-white border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(10,50,53,0.06)] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-header-sm text-on-surface">{title}</h2>
          {subtitle && <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export default ProgramPanel;
