import { useEffect, useState } from 'react';
import PieChart from './PieChart';

const formatValue = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return new Intl.NumberFormat('en').format(value);
};

const formatFull = (value) => new Intl.NumberFormat('en').format(value);

/**
 * ExpandModal — two-tab modal for every pie chart.
 *
 * Props:
 *   isOpen    - boolean
 *   onClose   - () => void
 *   data      - Array<{ label: string, value: number, color?: string }>
 *   title     - string   (used as modal title AND left column header in Tabular tab)
 */
export default function ExpandModal({ isOpen, onClose, data = [], title = 'Chart' }) {
  const [activeTab, setActiveTab] = useState('charts');

  // Reset to Charts tab each time the modal opens
  useEffect(() => {
    if (isOpen) setActiveTab('charts');
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const sorted = [...data]
    .filter((d) => Number(d.value) > 0)
    .sort((a, b) => b.value - a.value);

  const TAB_BASE =
    'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors duration-150 cursor-pointer select-none';
  const TAB_ACTIVE = 'border-[#0B4F54] text-[#0B4F54]';
  const TAB_INACTIVE = 'border-transparent text-[#707979] hover:text-[#404849]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-[0px_12px_32px_rgba(10,50,53,0.12)] border border-[#CFD8DC] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-[#F0F4F6] bg-[#F6FAFC] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0B4F54] flex items-center justify-center">
              {/* Pie-chart icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21.21 15.89A10 10 0 1 1 8 2.83"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 12A10 10 0 0 0 12 2v10z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#181C1E] leading-tight">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#707979] hover:bg-[#EAEEF0] hover:text-[#181C1E] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────── */}
        <div className="flex border-b border-[#CFD8DC] bg-white flex-shrink-0 px-2">
          <button
            className={`${TAB_BASE} ${activeTab === 'charts' ? TAB_ACTIVE : TAB_INACTIVE}`}
            onClick={() => setActiveTab('charts')}
          >
            Charts
          </button>
          <button
            className={`${TAB_BASE} ${activeTab === 'tabular' ? TAB_ACTIVE : TAB_INACTIVE}`}
            onClick={() => setActiveTab('tabular')}
          >
            Tabular
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Charts tab */}
          {activeTab === 'charts' && (
            <div className="flex items-center justify-center py-8 px-6">
              <div className="w-full max-w-[520px]">
                <PieChart data={data} totalLabel={title} showCenterLabel />
              </div>
            </div>
          )}

          {/* Tabular tab */}
          {activeTab === 'tabular' && (
            <div className="flex flex-col">
              {/* ── Table ── */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#CFD8DC]">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#404849]">
                      {title}
                    </th>
                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[#404849]">
                      Value
                    </th>
                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[#404849]">
                      % Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => {
                    const pct = total > 0 ? ((row.value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <tr
                        key={row.label}
                        className={`border-b border-[#F0F4F6] hover:bg-[#F0F4F6] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-white'}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {row.color && (
                              <span
                                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: row.color }}
                              />
                            )}
                            <span className="font-medium text-[#0B4F54]">{row.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-[#181C1E] text-sm">
                          {formatFull(row.value)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-[#515F74] text-sm font-semibold">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Footer ── */}
              <div className="px-5 py-3 border-t border-[#F0F4F6] bg-[#F6FAFC] flex items-center justify-end">
                <span className="text-xs text-[#707979] font-medium">
                  1–{sorted.length} of {sorted.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
