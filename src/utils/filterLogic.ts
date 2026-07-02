/**
 * Apply a single filter to a data row
 * @param {Object} row - Data row
 * @param {Object} filter - Filter configuration
 * @returns {boolean} - Whether the row matches the filter
 */
export const applyFilter = (row, filter) => {
  const { column, operator, value } = filter;
  
  // Get the cell value
  const cellValue = row[column];
  
  // Handle empty/null values
  if (operator === 'is empty') {
    return !cellValue || cellValue.toString().trim() === '';
  }
  
  if (operator === 'is not empty') {
    return cellValue && cellValue.toString().trim() !== '';
  }
  
  // For other operators, if value is empty, don't filter
  if (!value || value.trim() === '') {
    return true;
  }
  
  // Convert to strings for comparison (case-insensitive)
  const cellStr = (cellValue || '').toString().toLowerCase();
  const filterStr = value.toLowerCase();
  
  switch (operator) {
    case 'contains':
      return cellStr.includes(filterStr);
    
    case 'equals':
      return cellStr === filterStr;
    
    case 'starts with':
      return cellStr.startsWith(filterStr);
    
    case 'ends with':
      return cellStr.endsWith(filterStr);
    
    case 'is any of': {
      // Split by comma and check if cell value matches any
      const values = filterStr.split(',').map(v => v.trim());
      return values.some(v => cellStr === v);
    }
    
    default:
      return true;
  }
};

/**
 * Apply multiple filters to data with AND logic
 * @param {Array} data - Array of data rows
 * @param {Array} filters - Array of filter configurations
 * @returns {Array} - Filtered data
 */
export const applyFilters = (data, filters) => {
  // If no filters, return all data
  if (!filters || filters.length === 0) {
    return data;
  }
  
  // Filter data using AND logic (all filters must match)
  return data.filter(row => {
    return filters.every(filter => applyFilter(row, filter));
  });
};

/**
 * Check if a filter is valid (has column and operator selected)
 * @param {Object} filter - Filter configuration
 * @returns {boolean} - Whether the filter is valid
 */
export const isValidFilter = (filter) => {
  if (!filter.column || !filter.operator) {
    return false;
  }
  
  // For 'is empty' and 'is not empty', value is not required
  if (filter.operator === 'is empty' || filter.operator === 'is not empty') {
    return true;
  }
  
  // For other operators, value is required
  return filter.value && filter.value.trim() !== '';
};
