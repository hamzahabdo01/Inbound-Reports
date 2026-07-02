const LoadingSkeleton = ({ rows = 10 }) => {
  return (
    <div className="bg-white">
      <div className="max-w-container mx-auto px-margin-side">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline">
                {[...Array(10)].map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-3 bg-surface-container rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(rows)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-outline">
                  {[...Array(10)].map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3.5">
                      <div 
                        className="h-4 bg-surface-container rounded animate-pulse" 
                        style={{ 
                          width: `${50 + Math.random() * 50}%`,
                          animationDelay: `${rowIndex * 50 + colIndex * 20}ms`
                        }} 
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
