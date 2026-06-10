import { useState } from 'react';

const navItems = [
  { icon: 'fa-chart-line', label: 'Overview', href: '#', active: true },
  { icon: 'fa-coins', label: 'Sales & Marketing', href: '#' },
  { icon: 'fa-boxes-stacked', label: 'Products', href: '#' },
  { icon: 'fa-industry', label: 'Manufacturing', href: '#' },
  { icon: 'fa-truck-arrow-right', label: 'Supply Chain', href: '#' },
  { icon: 'fa-shield-halved', label: 'Quality & Compliance', href: '#' },
  { icon: 'fa-vial-virus', label: 'Pharmacovigilance', href: '#' },
  { icon: 'fa-flask', label: 'Clinical Trials', href: '#' },
  { icon: 'fa-file-invoice-dollar', label: 'Finance', href: '#' },
  { icon: 'fa-square-poll-vertical', label: 'Reports', href: '#' },
  { icon: 'fa-sliders', label: 'Administration', href: '#' },
];

const themePresets = {
  eucalyptus: { primary: '#0b4f54', secondary: '#515f74', tertiary: '#003734', bg: '#f6fafc', surface: '#ffffff' },
  'eucalyptus-brown': { primary: '#0b4f54', secondary: '#8D6E63', tertiary: '#5D4037', bg: '#f6fafc', surface: '#ffffff' },
  coldchain: { primary: '#3c4858', secondary: '#64748b', tertiary: '#1e293b', bg: '#f8fafc', surface: '#ffffff' },
  emerald: { primary: '#065f46', secondary: '#334155', tertiary: '#047857', bg: '#f0fdf4', surface: '#ffffff' },
  contrast: { primary: '#1e293b', secondary: '#475569', tertiary: '#334155', bg: '#f8fafc', surface: '#ffffff' },
  midnight: { primary: '#115e59', secondary: '#94a3b8', tertiary: '#134e4a', bg: '#0f172a', surface: '#1e293b' },
};

const adjustBrightness = (hex, percent) => {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) * (100 + percent) / 100));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) * (100 + percent) / 100));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) * (100 + percent) / 100));
  return `#${(1 << 24 | Math.round(r) << 16 | Math.round(g) << 8 | Math.round(b)).toString(16).slice(1)}`;
};

function Sidebar() {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [colors, setColors] = useState({
    primary: '#0b4f54',
    secondary: '#515f74',
    tertiary: '#003734',
    bg: '#f6fafc',
    surface: '#ffffff',
  });

  const updateTheme = (newColors) => {
    setColors(newColors);
    const { primary, secondary, tertiary, bg, surface } = newColors;
    const isDarkBg = parseInt(bg.slice(1, 3), 16) < 120;
    const darkPrimary = adjustBrightness(primary, -35);
    const hoverPrimary = adjustBrightness(primary, 20);
    const textOnSurface = isDarkBg ? '#f1f5f9' : '#181c1e';
    const textOnSurfaceVariant = isDarkBg ? '#94a3b8' : '#404849';
    const surfaceLow = isDarkBg ? adjustBrightness(surface, -15) : adjustBrightness(bg, -3);
    const surfaceContainer = isDarkBg ? adjustBrightness(surface, -5) : adjustBrightness(bg, -5);
    const grayBorder = isDarkBg ? '#334155' : '#CFD8DC';

    const root = document.documentElement;
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-dark', darkPrimary);
    root.style.setProperty('--color-primary-hover', hoverPrimary);
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-tertiary', tertiary);
    root.style.setProperty('--color-background', bg);
    root.style.setProperty('--color-surface', surface);
    root.style.setProperty('--color-surface-low', surfaceLow);
    root.style.setProperty('--color-surface-container', surfaceContainer);
    root.style.setProperty('--color-surface-container-high', adjustBrightness(surfaceContainer, -2));
    root.style.setProperty('--color-surface-container-highest', adjustBrightness(surfaceContainer, -4));
    root.style.setProperty('--color-text-on-surface', textOnSurface);
    root.style.setProperty('--color-text-on-surface-variant', textOnSurfaceVariant);
    root.style.setProperty('--color-gray-border', grayBorder);
  };

  const handleColorChange = (key, value) => {
    const newColors = { ...colors, [key]: value };
    updateTheme(newColors);
  };

  const handlePresetChange = (e) => {
    const preset = themePresets[e.target.value];
    if (preset) updateTheme(preset);
  };

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col h-screen sticky top-0 z-40"
      style={{ backgroundColor: 'var(--color-primary-dark, #00373B)', borderRight: '1px solid var(--color-primary-dark, #00373B)' }}
    >
      <div className="flex-1 overflow-y-auto p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-sm"
            style={{ backgroundColor: 'var(--color-on-primary-container, #86BFC5)', color: 'var(--color-primary, #0B4F54)' }}>
            <i className="fa-solid fa-prescription-bottle-medical"></i>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">PharmaVista</h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold mt-1"
              style={{ color: 'var(--color-on-primary-container, #86BFC5)' }}>
              Analytics Engine
            </p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                item.active
                  ? 'text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              style={item.active ? { backgroundColor: 'var(--color-primary, #0B4F54)' } : {}}
            >
              <i className={`fa-solid ${item.icon} text-sm w-4`}
                style={item.active ? { color: 'var(--color-on-primary-container, #86BFC5)' } : {}}></i>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10"
        style={{ backgroundColor: 'var(--color-primary-dark, #00373B)' }}>
        <button
          onClick={() => setCustomizerOpen(!customizerOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-white/70 hover:text-white transition-all duration-150 py-1 focus:outline-none"
        >
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-palette text-xs" style={{ color: 'var(--color-on-primary-container, #86BFC5)' }}></i>
            <span>Customize Palette</span>
          </span>
          <i className={`fa-solid fa-chevron-down text-[10px] text-white/70 transition-transform ${customizerOpen ? 'rotate-180' : ''}`}></i>
        </button>
      </div>

      {customizerOpen && (
        <div className="overflow-y-auto" style={{ maxHeight: '55vh', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-primary-dark, #00373B)' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--color-on-primary-container, #86BFC5)' }}>
                Palette Customizer
              </span>
              <i className="fa-solid fa-palette text-xs" style={{ color: 'var(--color-on-primary-container, #86BFC5)' }}></i>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                { key: 'primary', label: 'Primary Accent', value: colors.primary },
                { key: 'secondary', label: 'Secondary (Slate)', value: colors.secondary },
                { key: 'tertiary', label: 'Tertiary', value: colors.tertiary },
                { key: 'bg', label: 'Canvas Bg', value: colors.bg },
                { key: 'surface', label: 'Card Surface', value: colors.surface },
              ].map(({ key, label, value }) => (
                <div key={key}>
                  <label className="block mb-0.5 font-semibold" style={{ color: 'var(--color-on-primary-container, #86BFC5)' }}>
                    {label}
                  </label>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-full h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="block mb-0.5 font-semibold text-[9px]" style={{ color: 'var(--color-on-primary-container, #86BFC5)' }}>
                Select Preset Theme
              </label>
              <select
                onChange={handlePresetChange}
                className="w-full text-white rounded px-2 py-1 text-[11px] focus:outline-none"
                style={{ backgroundColor: 'var(--color-primary, #0B4F54)', border: '1px solid var(--color-primary-hover, #115E59)' }}
              >
                <option value="eucalyptus">Tech-Forward Eucalyptus</option>
                <option value="eucalyptus-brown">Eucalyptus — Brown Secondary</option>
                <option value="coldchain">Cold Chain Steel & Logistics</option>
                <option value="emerald">High-Performance Emerald</option>
                <option value="contrast">Minimalist High-Contrast Slate</option>
                <option value="midnight">Deep Charcoal Dark Mode</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
