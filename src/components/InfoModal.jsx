import { TABLE_METADATA } from '../utils/tableMetadata';

export default function InfoModal({ contentId, isOpen, onClose }) {
  if (!isOpen) return null;

  const metadata = TABLE_METADATA[contentId] || {
    title: 'Guide',
    description: 'Guidelines and documentation for this view.',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-level-2 border border-outline-variant overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <i className="fa-solid fa-circle-info text-sm" />
            </div>
            <h3 className="text-title-sm font-bold text-on-surface">
              {metadata.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Description */}
          <section>
            <h4 className="text-label-sm font-bold text-text-primary uppercase tracking-wider mb-1.5">Description</h4>
            <p className="text-body-md text-text-secondary leading-relaxed">{metadata.description}</p>
          </section>

          {/* Purpose */}
          {metadata.purpose.length > 0 && (
            <section>
              <h4 className="text-label-sm font-bold text-text-primary uppercase tracking-wider mb-1.5">Purpose</h4>
              <ul className="space-y-1.5">
                {metadata.purpose.map((p, i) => (
                  <li key={i} className="flex gap-2 text-body-md text-text-secondary">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Period */}
          <section>
            <h4 className="text-label-sm font-bold text-text-primary uppercase tracking-wider mb-1.5">Period</h4>
            <p className="text-body-md text-text-secondary leading-relaxed">{metadata.period}</p>
          </section>

          {/* Assumptions */}
          {metadata.assumptions.length > 0 && (
            <section>
              <h4 className="text-label-sm font-bold text-text-primary uppercase tracking-wider mb-1.5">Assumptions</h4>
              <ul className="space-y-1.5">
                {metadata.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-body-md text-text-secondary">
                    <span className="text-warning mt-0.5 flex-shrink-0">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Example Columns */}
          {metadata.example && metadata.example.columns && Object.keys(metadata.example.columns).length > 0 && (
            <section>
              <h4 className="text-label-sm font-bold text-text-primary uppercase tracking-wider mb-1.5">Column Guide</h4>
              <div className="border border-outline-variant rounded-xl overflow-hidden">
                {Object.entries(metadata.example.columns).map(([colName, colData], i) => (
                  <div
                    key={colName}
                    className={`flex items-start gap-3 px-3.5 py-2.5 ${
                      i < Object.keys(metadata.example.columns).length - 1 ? 'border-b border-outline-variant/50' : ''
                    }`}
                  >
                    <code className="text-[12px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {colName}
                    </code>
                    <div className="min-w-0">
                      <span className="text-body-sm font-semibold text-text-primary block truncate">
                        {colData.value}
                      </span>
                      <span className="text-caption text-text-tertiary block">
                        {colData.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant bg-surface-low flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary text-white rounded-lg text-body-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
