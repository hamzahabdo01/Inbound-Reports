import { useState, useRef, useEffect } from 'react';
import IconButton from './IconButton';

export default function ExportDropdown({ headers, rows, filename = 'export', dropUp, iconClassName }: { headers: { key: string; label: string }[]; rows: any[]; filename?: string; dropUp?: boolean; iconClassName?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportCSV = () => {
    const csvHeaders = headers.map(h => `"${h.label}"`).join(',');
    const csvRows = rows.map(row =>
      headers.map(h => {
        const val = row[h.key];
        if (val == null) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [csvHeaders, ...csvRows].join('\r\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportExcel = () => {
    const title = filename.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const th = headers.map(h => `<th style="padding:8px 10px;border:1px solid #d1d5db;font-size:12px;font-weight:700;background:#e5e7eb;text-align:left;color:#1f2937">${esc(h.label)}</th>`).join('');
    const tr = rows.map((row, i) => {
      const bg = i % 2 === 1 ? 'background:#f9fafb' : '';
      return `<tr>${headers.map(h => { const v = row[h.key]; return `<td style="padding:8px 10px;border:1px solid #d1d5db;font-size:12px;${bg}">${v != null ? esc(String(v)) : ''}</td>`; }).join('')}</tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body><table>${th}${tr}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handlePrint = () => {
    const title = filename.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const th = headers.map(h => `<th style="padding:8px 10px;border:1px solid #d1d5db;font-size:12px;font-weight:700;background:#e5e7eb;text-align:left;color:#1f2937">${esc(h.label)}</th>`).join('');
    const tr = rows.map((row, i) => {
      const bg = i % 2 === 1 ? 'background:#f9fafb' : '';
      return `<tr>${headers.map(h => { const v = row[h.key]; return `<td style="padding:8px 10px;border:1px solid #d1d5db;font-size:12px;${bg}">${v != null ? esc(String(v)) : ''}</td>`; }).join('')}</tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="margin:20px;font-family:Arial,sans-serif"><h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#1f2937">${esc(title)}</h2><p style="font-size:11px;color:#6b7280;margin:0 0 16px">${rows.length} records</p><table style="width:100%;border-collapse:collapse"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table><script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <IconButton variant="export" onClick={() => setOpen(!open)} className={iconClassName} />
      {open && (
        <div className={`absolute z-50 w-36 bg-white rounded-lg border border-outline-variant shadow-lg py-1 overflow-hidden ${dropUp ? 'bottom-full mb-1 left-0' : 'top-full mt-1 right-0'}`}>
            <button onClick={exportCSV}
              className="w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-file text-success w-4 text-center" />
              CSV
            </button>
            <button onClick={exportExcel}
              className="w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-file-excel text-[#217346] w-4 text-center" />
              Excel
            </button>
            <button onClick={handlePrint}
            className="w-full px-3 py-2 text-left text-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
          >
            <i className="fa-solid fa-print text-primary w-4 text-center" />
            Print
          </button>
        </div>
      )}
    </div>
  );
}
