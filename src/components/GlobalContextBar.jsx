import { useMemo } from 'react';

const StatCard = ({ label, value, unit, trend, trendValue, isLoading, variant = 'default' }) => {
  const colorClass = variant === 'critical' ? 'text-error' : 'text-text-primary';
  
  return (
    <div className="bg-white border border-outline rounded-lg px-4 py-3 min-w-[140px]">
      <div className="text-stat-label text-text-tertiary uppercase mb-1">
        {label}
      </div>
      {isLoading ? (
        <div className="h-10 w-16 bg-surface-container rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className={`text-stat-value ${colorClass}`}>
            {value}
          </span>
          {unit && (
            <span className="text-body-sm text-text-tertiary">{unit}</span>
          )}
          {trend && (
            <span className={`text-body-sm flex items-center gap-0.5 ${
              trend === 'up' ? 'text-error' : 'text-success'
            }`}>
              {trend === 'up' ? '↗' : '↘'}
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const GlobalContextBar = ({ totalRecords, filteredRecords, data, onExport, isLoading = false }) => {
  // Calculate statistics with trends (simulated for now)
  const stats = useMemo(() => {
    if (isLoading || data.length === 0) {
      return { 
        totalActive: 0, 
        avgDwelling: 0, 
        maxDwelling: 0,
        minDwelling: 0,
        criticalCount: 0,
        over90: 0,
        noOfficer: 0,
        uniquePOs: 0,
        recentArrivals: 0
      };
    }
    
    const avgDwelling = Math.round(data.reduce((sum, row) => sum + row.DwellingTime, 0) / data.length);
    const maxDwelling = Math.max(...data.map(row => row.DwellingTime));
    const minDwelling = Math.min(...data.map(row => row.DwellingTime));
    const criticalCount = data.filter(row => row.DwellingTime > 90).length;
    const over90 = data.filter(row => row.DwellingTime > 90).length;
    const over30 = data.filter(row => row.DwellingTime > 30).length;
    const noOfficer = data.filter(row => !row.ShipmentOfficer || row.ShipmentOfficer.trim() === '').length;
    const uniquePOs = new Set(data.map(row => row.PurchaseOrderNumber)).size;
    
    // Simulate recent arrivals (last 30 days)
    const recentArrivals = Math.floor(data.length * 0.3);
    
    return { 
      totalActive: filteredRecords,
      avgDwelling, 
      maxDwelling,
      minDwelling,
      criticalCount,
      over90,
      over30,
      noOfficer,
      uniquePOs,
      recentArrivals
    };
  }, [data, isLoading, filteredRecords]);

  return (
    <div className="bg-surface border-b border-outline-variant">
      <div className="max-w-container mx-auto px-margin-side py-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-display text-text-primary font-semibold">
            Shipment Dwelling Time
          </h1>
          
          <button
            onClick={onExport}
            disabled={isLoading || data.length === 0}
            className="px-4 py-2 text-label text-text-secondary bg-white border border-outline-variant rounded-lg hover:bg-surface-low hover:border-outline-variant transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
        </div>

        {/* Stats Cards Row */}
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
          <StatCard
            label="Total Active"
            value={stats.totalActive}
            trend="up"
            trendValue="+2%"
            isLoading={isLoading}
          />
          
          <StatCard
            label="Avg Dwelling"
            value={stats.avgDwelling}
            unit="days"
            isLoading={isLoading}
          />
          
          <StatCard
            label="Max Dwelling"
            value={stats.maxDwelling}
            unit="days"
            trend="up"
            trendValue="+10%"
            variant="critical"
            isLoading={isLoading}
          />
          
          <StatCard
            label="Min Dwelling"
            value={stats.minDwelling}
            unit="days"
            isLoading={isLoading}
          />
          
          <StatCard
            label="> 30 Days"
            value={stats.over30}
            isLoading={isLoading}
          />
          
          <StatCard
            label="> 90 Days"
            value={stats.over90}
            isLoading={isLoading}
          />
          
          <StatCard
            label="No Officer"
            value={stats.noOfficer}
            isLoading={isLoading}
          />
          
          <StatCard
            label="Unique POs"
            value={stats.uniquePOs}
            isLoading={isLoading}
          />
          
          <StatCard
            label="Recent Arrivals"
            value={stats.recentArrivals}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalContextBar;
