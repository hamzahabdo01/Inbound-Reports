function Topbar() {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-border"
      style={{ borderColor: 'var(--color-gray-border, #CFD8DC)' }}>
      <div>
        <h1 className="text-headline-md font-bold"
          style={{ color: 'var(--color-text-on-surface, #181C1E)' }}>
          Executive Command Center
        </h1>
        <p className="text-body-sm mt-1"
          style={{ color: 'var(--color-text-on-surface-variant, #404849)' }}>
          Real-time overview of pharmaceutical operations and performance
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all"
          style={{
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-gray-border, #CFD8DC)',
            color: 'var(--color-text-on-surface, #181C1E)',
            boxShadow: '0px 4px 20px rgba(10, 50, 53, 0.06)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container, #EAEEF0)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface, #ffffff)'}
        >
          <i className="fa-regular fa-calendar-days" style={{ color: 'var(--color-text-on-surface-variant, #404849)' }}></i>
          <span className="font-semibold">May 12 – Jun 8, 2024</span>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all"
          style={{
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-gray-border, #CFD8DC)',
            color: 'var(--color-text-on-surface, #181C1E)',
            boxShadow: '0px 4px 20px rgba(10, 50, 53, 0.06)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container, #EAEEF0)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface, #ffffff)'}
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="font-semibold">Real-time</span>
        </div>

        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center relative cursor-pointer transition-all"
          style={{
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-gray-border, #CFD8DC)',
            color: 'var(--color-text-on-surface, #181C1E)',
            boxShadow: '0px 4px 20px rgba(10, 50, 53, 0.06)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container, #EAEEF0)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface, #ffffff)'}
        >
          <i className="fa-regular fa-bell text-sm"></i>
          <span className="absolute -top-1.5 -right-1.5 bg-[#BA1A1A] text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">12</span>
        </div>

        <div
          className="flex items-center gap-3 px-3 py-1 text-xs rounded-lg cursor-pointer transition-all"
          style={{
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-gray-border, #CFD8DC)',
            boxShadow: '0px 4px 20px rgba(10, 50, 53, 0.06)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-container, #EAEEF0)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface, #ffffff)'}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
            alt="Dr. James Wilson"
            className="w-7 h-7 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="font-bold leading-none" style={{ color: 'var(--color-text-on-surface, #181C1E)' }}>
              Dr. James Wilson
            </p>
            <p className="text-[9px] leading-none mt-0.5" style={{ color: 'var(--color-secondary, #515F74)' }}>
              Chief Operations Officer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
