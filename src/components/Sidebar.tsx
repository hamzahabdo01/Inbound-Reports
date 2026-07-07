import { useState } from 'react';

const navItems = [
  // HIDDEN: Dashboard
  // {
  //   icon: 'fa-chart-pie',
  //   label: 'Dashboard',
  // },
  {
    icon: 'fa-cubes',
    label: 'Program',
  },
  // HIDDEN: Location
  // {
  //   icon: 'fa-location-dot',
  //   label: 'Location',
  // },
  // HIDDEN: Finance
  // {
  //   icon: 'fa-coins',
  //   label: 'Finance',
  //   children: [
  //     { label: 'Item Summary' },
  //     { label: 'Item Price' },
  //   ],
  // },
  // HIDDEN: Regulatory
  // {
  //   icon: 'fa-file-shield',
  //   label: 'Regulatory',
  //   children: [
  //     { label: 'eRIS' },
  //     { label: 'AEFI' },
  //   ],
  // },
  {
    icon: 'fa-truck-fast',
    label: 'Inbound Reports',
    children: [
      { label: 'Miscellaneous Stock Report' },
      { label: 'Inbound Report' },
      { label: 'Shipment Status' },
      { label: 'Procurement' },
      { label: 'PO Performance and Compliance' },
    ],
  },
  // HIDDEN: RDF
  // {
  //   icon: 'fa-flag',
  //   label: 'RDF',
  // },
  // HIDDEN: Facility
  // {
  //   icon: 'fa-hospital',
  //   label: 'Facility',
  //   children: [
  //     { label: 'Facility Dashboard' },
  //     { label: 'RRF' },
  //   ],
  // },
  // HIDDEN: Routine Report
  // {
  //   icon: 'fa-file-lines',
  //   label: 'Routine Report',
  //   children: [
  //     { label: 'Quarter Report' },
  //     { label: 'Hub Vital Report' },
  //     { label: 'Item Distribution' },
  //     { label: 'Medical Equipment Distribution' },
  //   ],
  // },
];

function Sidebar({ activeSection, onNavigate, collapsed, onToggleCollapse, onLogout, isMobile, onClose }: any) {
  const [expanded, setExpanded] = useState({});

  const toggle = (label) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const hasActiveChild = (item) => {
    if (!item.children) return false;
    return item.children.some(c => c.label === activeSection);
  };

  const isActive = (item) => item.label === activeSection;

  const linkBase = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150';
  const linkDefault = 'text-white/70 hover:bg-sidebar-hover hover:text-white';
  const linkActive = 'text-white shadow-sm bg-sidebar-active';

  const childBase = 'block px-3 py-1.5 rounded-md text-sm transition-all duration-150';
  const childDefault = 'text-white/60 hover:bg-white/10 hover:text-white';
  const childActive = 'text-white bg-sidebar-active shadow-sm';

  const navLink = (item: any, idx?: any) => {
    const active = !item.children && isActive(item);
    return (
      <a
        key={item.label}
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onNavigate) onNavigate(item.label);
          if (onClose) onClose();
        }}
        className={`${linkBase} justify-start ${active ? linkActive : linkDefault}`}
        title={collapsed ? item.label : undefined}
      >
        <i className={`fa-solid ${item.icon} text-sm w-4 text-center shrink-0 transition-colors ${
          active ? 'text-sidebar-accent' : 'text-white/40'
        }`}></i>
        <span className={`truncate ${collapsed ? 'hidden' : ''}`}>{item.label}</span>
      </a>
    );
  };

  const navGroup = (item) => {
    const open = expanded[item.label] || hasActiveChild(item);

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (collapsed) {
              if (onNavigate) onNavigate(item.label);
            } else {
              toggle(item.label);
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
            (hasActiveChild(item) || item.label === activeSection)
              ? 'text-white bg-sidebar-active/30'
              : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
          }`}
          title={collapsed ? item.label : undefined}
        >
          <span className="flex items-center gap-3 min-w-0">
            <i className={`fa-solid ${item.icon} text-sm w-4 text-center shrink-0 transition-colors ${
              (hasActiveChild(item) || item.label === activeSection)
                ? 'text-sidebar-accent'
                : 'text-white/40 group-hover:text-white/70'
            }`}></i>
            <span className={`truncate ${collapsed ? 'hidden' : ''}`}>{item.label}</span>
          </span>
          {!collapsed && (
            <i className={`fa-solid fa-chevron-down text-[10px] shrink-0 transition-all duration-200 ${
              (hasActiveChild(item) || item.label === activeSection) ? 'text-white/60' : 'text-white/30 group-hover:text-white/50'
            } ${open ? 'rotate-0' : '-rotate-90'}`}></i>
          )}
        </button>

        {!collapsed && (
          <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5">
              {item.children.map((child) => {
                const active = child.label === activeSection;
                return (
                  <a
                    key={child.label}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onNavigate) onNavigate(child.label);
                      if (onClose) onClose();
                    }}
                    className={`${childBase} ${active ? childActive : childDefault}`}
                  >
                    {child.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return isMobile ? (
    <div className={`fixed inset-0 z-50 flex transition-all duration-300 ${collapsed ? 'pointer-events-none' : ''}`}>
      <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`} onClick={onClose} />
      <aside className={`relative w-[240px] flex flex-col h-screen bg-sidebar-bg text-white shadow-2xl transition-transform duration-300 ${collapsed ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
          <div className="flex items-center justify-between mb-8">
            <div className="text-sm font-bold text-white tracking-tight truncate">Fanos Dashboard</div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg shadow-sm bg-sidebar-accent text-primary hover:brightness-110 transition-all shrink-0" aria-label="Close sidebar">
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => item.children ? navGroup(item) : navLink(item))}
          </nav>
        </div>
        <div className="px-3 py-2 border-t border-white/10 space-y-2">
          <button onClick={onLogout} className="w-full flex items-center gap-3 py-2 rounded-lg text-sm text-white/50 hover:text-error hover:bg-white/5 transition-all duration-150 px-3">
            <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center shrink-0"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  ) : (
    <aside className={`${collapsed ? 'w-[60px]' : 'w-[240px]'} shrink-0 flex flex-col h-screen max-h-dvh sticky top-0 z-40 bg-sidebar-bg text-white transition-all duration-200 overscroll-contain`}>
      <div className="flex-1 overflow-y-auto px-2 xl:px-4 py-5 scrollbar-thin">
          <div className={`flex items-center mb-8 justify-between`}>
          <div className="flex items-center gap-3 min-w-0">
            {!collapsed && (
              <div className="text-sm font-bold text-white tracking-tight leading-none truncate">Fanos Dashboard</div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="w-9 h-9 flex items-center justify-center rounded-lg shadow-sm bg-sidebar-accent text-primary hover:brightness-110 transition-all shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className="fa-solid fa-bars text-sm"></i>
          </button>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) =>
            item.children ? navGroup(item) : navLink(item)
          )}
        </nav>
      </div>

      <div className="px-2 xl:px-3 py-2 border-t border-white/10 space-y-2">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 py-2 rounded-lg text-sm text-white/50 hover:text-error hover:bg-white/5 transition-all duration-150 px-3`}
          title="Logout"
        >
          <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center shrink-0"></i>
          <span className={`truncate ${collapsed ? 'hidden' : ''}`}>Logout</span>
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;
