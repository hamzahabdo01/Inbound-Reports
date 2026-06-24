import { useMemo, useState } from 'react';
import InfoButton from './InfoButton';
import { getDwellingTimeClasses, getRiskLevel, getStatusDotColor } from '../utils/colorCoding';

// Column configuration with display names
const COLUMN_CONFIG = {
  Status: { label: '', align: 'center', width: 'w-12' },
  PurchaseOrderNumber: { label: 'PO No', align: 'left' },
  Item: { label: 'Item', align: 'left', truncate: true },
  Unit: { label: 'Unit', align: 'left' },
  InvoiceNumber: { label: 'Invoice No', align: 'left' },
  InvoiceOrder: { label: 'Invoice Order', align: 'center' },
  InvoicedQuantity: { label: 'Invoiced Quantity', align: 'right' },
  WayBillNumber: { label: 'Way Bill No', align: 'left' },
  ShipmentOfficer: { label: 'Shipment Officer', align: 'left' },
  PortArrivalDate: { label: 'Port Arrival Date', align: 'left' },
  DwellingTime: { label: 'Dwelling Time', align: 'center' },
  RiskLevel: { label: 'Risk Level', align: 'center' }
};

// Row component with hover actions
const TableRow = ({ row, visibleColumnKeys, rowHeightClass, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedCells, setExpandedCells] = useState({});
  const [copiedCell, setCopiedCell] = useState(null);

  const handleCopy = (text, cellKey) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const toggleExpand = (columnKey) => {
    setExpandedCells(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const dwellingTime = row.DwellingTime;
  const riskLevel = getRiskLevel(dwellingTime);
  const statusDotColor = getStatusDotColor(dwellingTime);

  return (
    <tr
      className="border-b border-outline hover:bg-surface-low transition-colors group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {visibleColumnKeys.map((columnKey) => {
        const value = row[columnKey];
        const config = COLUMN_CONFIG[columnKey];
        const cellKey = `${index}-${columnKey}`;
        const isExpanded = expandedCells[columnKey];
        const isTruncatable = config.truncate && value && value.length > 50;
        
        // Status dot column (left-most)
        if (columnKey === 'Status') {
          return (
            <td
              key={columnKey}
              className={`px-4 ${rowHeightClass} text-center ${config.width || ''}`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${statusDotColor}`} />
              </div>
            </td>
          );
        }

        // Risk Level column
        if (columnKey === 'RiskLevel') {
          return (
            <td
              key={columnKey}
              className={`px-4 ${rowHeightClass} text-center`}
            >
              <span className={`inline-flex px-2 py-1 rounded text-label-sm font-semibold ${riskLevel.color} ${riskLevel.bgColor}`}>
                {riskLevel.label}
              </span>
            </td>
          );
        }

        // Simplified DwellingTime column (just bold number with background)
        if (columnKey === 'DwellingTime') {
          const bgColorClass = dwellingTime <= 30 ? 'bg-success/10' :
                               dwellingTime <= 60 ? 'bg-warning/10' :
                               dwellingTime <= 90 ? 'bg-orange/10' : 'bg-error/10';
          const textColorClass = dwellingTime <= 30 ? 'text-success' :
                                 dwellingTime <= 60 ? 'text-warning' :
                                 dwellingTime <= 90 ? 'text-orange' : 'text-error';
          
          return (
            <td
              key={columnKey}
              className={`px-4 ${rowHeightClass} text-center`}
            >
              <span className={`inline-flex px-3 py-1.5 rounded ${bgColorClass} ${textColorClass} text-body font-bold`}>
                {dwellingTime}
              </span>
            </td>
          );
        }

        return (
          <td
            key={columnKey}
            className={`px-4 ${rowHeightClass} text-body text-text-primary ${
              config.align === 'center' ? 'text-center' :
              config.align === 'right' ? 'text-right' :
              'text-left'
            } relative`}
          >
            {value ? (
              <>
                {isTruncatable && !isExpanded ? (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{value.substring(0, 50)}...</span>
                    <button
                      onClick={() => toggleExpand(columnKey)}
                      className="text-primary hover:text-primary-hover text-label-sm flex-shrink-0"
                    >
                      more
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={isTruncatable && isExpanded ? '' : 'line-clamp-2'}>
                      {value}
                    </span>
                    {isTruncatable && isExpanded && (
                      <button
                        onClick={() => toggleExpand(columnKey)}
                        className="text-primary hover:text-primary-hover text-label-sm flex-shrink-0"
                      >
                        less
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="text-text-tertiary">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
};

const Table = ({ data, currentPage, rowsPerPage, visibleColumns, density = 'normal' }) => {
  // Memoize visible column keys
  const visibleColumnKeys = useMemo(
    () => Object.keys(COLUMN_CONFIG).filter((key) => visibleColumns[key]),
    [visibleColumns]
  );

  // Memoize paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, rowsPerPage]);

  // Count visible columns for colspan
  const visibleColumnCount = visibleColumnKeys.length;

  // Get row height based on density
  const getRowHeight = () => {
    switch (density) {
      case 'compact': return 'py-2';
      case 'comfortable': return 'py-5';
      default: return 'py-3.5';
    }
  };

  const rowHeightClass = getRowHeight();

  return (
    <div className="bg-white space-y-3">
      <div className="max-w-container mx-auto px-margin-side">
        <div className="flex justify-end mb-2">
          <InfoButton contentId="shipment-dwelling-time" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline">
                {visibleColumnKeys.map((columnKey) => (
                  <th
                    key={columnKey}
                    className={`px-4 py-3 text-label-sm uppercase tracking-wide font-medium text-text-tertiary ${
                      COLUMN_CONFIG[columnKey].align === 'center' ? 'text-center' :
                      COLUMN_CONFIG[columnKey].align === 'right' ? 'text-right' :
                      'text-left'
                    }`}
                  >
                    {COLUMN_CONFIG[columnKey].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                        <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-body font-medium text-text-primary mb-1">No shipments found</div>
                        <div className="text-body-sm text-text-tertiary">Try adjusting your filters or search</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={`${row.PurchaseOrderNumber}-${row.InvoiceNumber}-${index}`}
                    row={row}
                    visibleColumnKeys={visibleColumnKeys}
                    rowHeightClass={rowHeightClass}
                    index={index}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table;
