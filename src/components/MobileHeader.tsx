function MobileHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="fixed top-0 z-40 flex items-center gap-3 px-4 py-3 bg-primary w-full">
      <button onClick={onToggleSidebar} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 text-white hover:brightness-110 transition-all shrink-0" aria-label="Toggle sidebar">
        <i className="fa-solid fa-bars text-sm"></i>
      </button>
      <span className="text-sm font-bold text-white truncate">Fanos Dashboard</span>
    </header>
  );
}

export default MobileHeader;
