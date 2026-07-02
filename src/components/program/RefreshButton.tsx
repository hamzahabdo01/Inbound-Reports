function RefreshButton({ onClick, loading }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-10 h-10 bg-white rounded-xl hover:bg-surface-container-low disabled:opacity-30 transition-all duration-200 flex items-center justify-center group"
      aria-label="Refresh data"
      title="Refresh"
    >
      <div className="w-6 h-6 rounded-full bg-[#0B4F54] group-hover:bg-[#00373B] flex items-center justify-center transition-colors duration-200">
        <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''} text-[11px] text-white`} />
      </div>
    </button>
  );
}

export default RefreshButton;
