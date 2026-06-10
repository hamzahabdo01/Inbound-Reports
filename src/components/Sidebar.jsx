import { useState } from 'react';

const navItems = [
  {
    icon: 'fa-chart-pie',
    label: 'Dashboard',
  },
  {
    icon: 'fa-cubes',
    label: 'Program',
  },
  {
    icon: 'fa-location-dot',
    label: 'Location',
  },
  {
    icon: 'fa-coins',
    label: 'Finance',
    children: [
      { label: 'Item Summary' },
      { label: 'Item Price' },
    ],
  },
  {
    icon: 'fa-file-shield',
    label: 'Regulatory',
    children: [
      { label: 'eRIS' },
      { label: 'AEFI' },
    ],
  },
  {
    icon: 'fa-truck-fast',
    label: 'Inbound Reports',
    children: [
      { label: 'Miscellaneous Stock Report' },
      { label: 'Inbound Report' },
      { label: 'LC CAD Expiry' },
      { label: 'Shipment Status' },
      { label: 'Procurement' },
    ],
  },
  {
    icon: 'fa-flag',
    label: 'RDF',
  },
  {
    icon: 'fa-hospital',
    label: 'Facility',
    children: [
      { label: 'Facility Dashboard' },
      { label: 'RRF' },
    ],
  },
  {
    icon: 'fa-file-lines',
    label: 'Routine Report',
    children: [
      { label: 'Quarter Report' },
      { label: 'Hub Vital Report' },
      { label: 'Item Distribution' },
      { label: 'Medical Equipment Distribution' },
    ],
  },
];

function Sidebar({ activeSection, onNavigate }) {
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

  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen sticky top-0 z-40 bg-sidebar-bg text-white">
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm bg-sidebar-accent text-primary">
            <i className="fa-solid fa-prescription-bottle-medical text-sm"></i>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-none">Fanos Dashboard</div>
          </div>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            if (item.children) {
              const open = expanded[item.label] || hasActiveChild(item);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggle(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                      (hasActiveChild(item) || item.label === activeSection)
                        ? 'text-white bg-sidebar-active/30'
                        : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <i className={`fa-solid ${item.icon} text-sm w-4 text-center shrink-0 transition-colors ${
                        (hasActiveChild(item) || item.label === activeSection)
                          ? 'text-sidebar-accent'
                          : 'text-white/40 group-hover:text-white/70'
                      }`}></i>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <i className={`fa-solid fa-chevron-down text-[10px] shrink-0 transition-all duration-200 ${
                      (hasActiveChild(item) || item.label === activeSection) ? 'text-white/60' : 'text-white/30 group-hover:text-white/50'
                    } ${open ? 'rotate-0' : '-rotate-90'}`}></i>
                  </button>

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
                            }}
                            className={`${childBase} ${active ? childActive : childDefault}`}
                          >
                            {child.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const active = isActive(item);
            return (
              <a
                key={item.label}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate(item.label);
                }}
                className={`${linkBase} ${active ? linkActive : linkDefault}`}
              >
                <i className={`fa-solid ${item.icon} text-sm w-4 text-center shrink-0 transition-colors ${
                  active ? 'text-sidebar-accent' : 'text-white/40'
                }`}></i>
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="px-5 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-white/40">
          <i className="fa-regular fa-circle-check text-[10px] text-sidebar-accent"></i>
          <span className="text-[10px] font-medium">v2.0.0 — Logistics Suite</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;