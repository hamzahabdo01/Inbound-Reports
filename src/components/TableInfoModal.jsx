import { useState, useEffect } from 'react';
import { TABLE_METADATA } from '../utils/tableMetadata';

export default function TableInfoModal({ tableId, isOpen, onClose }) {
  if (!isOpen) return null;

  const metadata = TABLE_METADATA[tableId] || {
    title: 'Table Guide',
    description: 'Guidelines and documentation for this table view.',
    purpose: ['View and analyze system data records.'],
    period: 'Updated periodically.',
    assumptions: ['Ensure search filters are applied correctly.'],
    example: {
      columns: {
        'Record ID': { value: '001', desc: 'Unique record identifier' },
        'Details': { value: 'System Information', desc: 'Detailed description of the record' }
      }
    }
  };

  const [activeTab, setActiveTab] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState(new Set([0]));
  const [hoveredCol, setHoveredCol] = useState(null);

  // Reset tab states when modal is opened for a different table
  useEffect(() => {
    setActiveTab(0);
    setVisitedTabs(new Set([0]));
    setHoveredCol(null);
  }, [tableId]);

  const selectTab = (index) => {
    setActiveTab(index);
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const nextTab = () => {
    if (activeTab < 4) {
      selectTab(activeTab + 1);
    }
  };

  const prevTab = () => {
    if (activeTab > 0) {
      selectTab(activeTab - 1);
    }
  };

  const progressPercent = Math.round((visitedTabs.size / 5) * 100);

  // Progress message based on percentage read
  const getProgressMessage = () => {
    if (progressPercent <= 20) return '🧭 Starting your data guide journey...';
    if (progressPercent === 40) return '🎯 Learning the business purpose...';
    if (progressPercent === 60) return '⏱️ Understanding report timelines...';
    if (progressPercent === 80) return '⚠️ Reviewing the guidelines and assumptions...';
    return '🎉 Certified Expert! You understand this table fully.';
  };

  const tabs = [
    { label: 'Overview', icon: 'fa-book-open' },
    { label: 'Purpose', icon: 'fa-bullseye' },
    { label: 'Period', icon: 'fa-calendar-days' },
    { label: 'Assumptions', icon: 'fa-triangle-exclamation' },
    { label: 'Interactive Example', icon: 'fa-magnifying-glass-chart' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-level-2 border border-outline-variant overflow-hidden flex flex-col max-h-[85vh] transform scale-100 transition-all duration-300 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-low flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <i className="fa-solid fa-circle-info text-base" />
            </div>
            <div>
              <h3 className="text-title-md font-bold text-on-surface leading-tight">
                {metadata.title} Guide
              </h3>
              <p className="text-caption text-on-surface-variant font-medium uppercase tracking-wider mt-0.5">
                Table Documentation
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Gamified Progress Bar */}
        <div className="px-6 py-3 bg-surface-container border-b border-outline-variant/60">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-body-sm font-semibold text-text-primary">
              {getProgressMessage()}
            </span>
            <span className="text-caption font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {progressPercent}% Digested
            </span>
          </div>
          <div className="w-full h-2 bg-outline-variant rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="border-b border-outline-variant/40 px-4 py-3 bg-white flex justify-between gap-1 overflow-x-auto">
          {tabs.map((tab, idx) => {
            const isCompleted = visitedTabs.has(idx);
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => selectTab(idx)}
                className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer text-center ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm font-semibold' 
                    : isCompleted 
                    ? 'bg-primary/5 text-primary-dark hover:bg-primary/10 border border-primary/20' 
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-1 justify-center text-xs">
                  {isCompleted && !isActive ? (
                    <i className="fa-solid fa-circle-check text-primary text-[10px]" />
                  ) : (
                    <i className={`fa-solid ${tab.icon} text-[10px]`} />
                  )}
                  <span className="text-[11px] uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-surface-low/30 min-h-[220px]">
          {activeTab === 0 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-body-md font-bold text-text-primary flex items-center gap-2">
                <i className="fa-solid fa-align-left text-primary/70" /> Short Description
              </h4>
              <p className="text-body-md text-text-secondary leading-relaxed bg-white p-4 rounded-xl border border-outline-variant shadow-sm border-l-4 border-l-primary">
                {metadata.description}
              </p>
              
              {/* Extra interactive visual card */}
              <div className="mt-4 bg-[#CFD8DC]/20 rounded-xl p-3 flex items-center gap-3 border border-outline-variant/50">
                <i className="fa-solid fa-chart-line text-lg text-primary" />
                <span className="text-caption text-text-secondary leading-normal">
                  Tip: Toggle columns and filters on the dashboard to tailor this view to your reporting needs.
                </span>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-body-md font-bold text-text-primary flex items-center gap-2">
                <i className="fa-solid fa-bullseye text-primary/70" /> Business Purpose
              </h4>
              <p className="text-body-sm text-text-secondary">
                This table is critical for driving the following logistics decisions and workflows:
              </p>
              <ul className="space-y-2.5">
                {metadata.purpose.map((p, i) => (
                  <li key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-outline-variant shadow-sm hover:border-primary/25 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fa-solid fa-circle-chevron-right text-xs text-primary" />
                    </div>
                    <span className="text-body-md text-text-primary leading-normal">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-body-md font-bold text-text-primary flex items-center gap-2">
                <i className="fa-solid fa-calendar-days text-primary/70" /> Reporting Period & Frequency
              </h4>
              <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <i className="fa-solid fa-clock-rotate-left text-xl" />
                </div>
                <div>
                  <h5 className="text-body-md font-bold text-text-primary mb-1">Time Horizon</h5>
                  <p className="text-body-md text-text-secondary leading-relaxed">
                    {metadata.period}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-caption font-semibold bg-success/10 text-success">
                      Live Database Sync
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded text-caption font-semibold bg-[#4A8EA5]/10 text-[#4A8EA5]">
                      Active Cycles
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-body-md font-bold text-text-primary flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-primary/70" /> Assumptions & Limitations
              </h4>
              <p className="text-body-sm text-text-secondary">
                Keep the following caveats and rules in mind when reading and interpreting these numbers:
              </p>
              <div className="space-y-3">
                {metadata.assumptions.map((a, i) => (
                  <div key={i} className="bg-warning/5 border border-warning/30 rounded-xl p-3.5 flex gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-warning text-base flex-shrink-0 mt-0.5" />
                    <span className="text-body-md text-text-primary leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-body-md font-bold text-text-primary flex items-center gap-2">
                  <i className="fa-solid fa-magnifying-glass-chart text-primary/70" /> Interactive Column Guide
                </h4>
                <p className="text-caption text-text-secondary mt-1">
                  Hover over or click the columns of this sample data row to see what each data field signifies:
                </p>
              </div>

              {/* Sample Row Visualizer */}
              <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="bg-surface-container py-2.5 px-4 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-outline-variant flex justify-between">
                  <span>Interactive Mock Data Row</span>
                  <span className="text-primary flex items-center gap-1 font-mono text-[9px] animate-pulse">
                    <i className="fa-solid fa-hand-pointer text-[10px]" /> Hover Cells
                  </span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {Object.entries(metadata.example.columns).map(([colName, colData]) => (
                      <div 
                        key={colName}
                        onMouseEnter={() => setHoveredCol({ name: colName, ...colData })}
                        onClick={() => setHoveredCol({ name: colName, ...colData })}
                        className={`p-3 rounded-lg border transition-all cursor-help flex flex-col justify-between h-20 w-36 ${
                          hoveredCol?.name === colName 
                            ? 'bg-primary/10 border-primary shadow-sm' 
                            : 'bg-surface-low border-outline-variant hover:border-primary/50'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide truncate">
                          {colName}
                        </span>
                        <span className="text-body-sm font-semibold text-text-primary truncate">
                          {colData.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Explainer Box */}
              <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 min-h-[90px] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  <i className="fa-solid fa-lightbulb text-sm" />
                </div>
                <div>
                  <h5 className="text-body-sm font-bold text-primary-dark">
                    {hoveredCol ? hoveredCol.name : 'Select/Hover a Column above'}
                  </h5>
                  <p className="text-body-sm text-text-secondary mt-0.5 leading-normal">
                    {hoveredCol ? hoveredCol.desc : 'Click or hover on any of the cells above to read details about how this data field is defined.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-low flex justify-between items-center">
          <div>
            {progressPercent === 100 ? (
              <span className="text-caption font-bold text-success flex items-center gap-1.5 animate-bounce">
                <i className="fa-solid fa-circle-check" /> All details verified!
              </span>
            ) : (
              <span className="text-caption font-medium text-text-tertiary">
                Read all 5 sections to complete guide.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {activeTab > 0 && (
              <button 
                onClick={prevTab}
                className="px-4 py-2 border border-outline rounded-lg text-body-sm font-semibold text-text-secondary hover:bg-surface-container transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            {activeTab < 4 ? (
              <button 
                onClick={nextTab}
                className="px-4 py-2 bg-primary text-white rounded-lg text-body-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Next <i className="fa-solid fa-chevron-right text-[10px]" />
              </button>
            ) : (
              <button 
                onClick={onClose}
                className={`px-5 py-2 rounded-lg text-body-sm font-bold transition-all cursor-pointer ${
                  progressPercent === 100
                    ? 'bg-primary text-white hover:bg-primary-hover shadow-md ring-2 ring-primary/20'
                    : 'bg-outline-variant text-text-secondary hover:bg-outline-variant/80'
                }`}
              >
                Got It!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
