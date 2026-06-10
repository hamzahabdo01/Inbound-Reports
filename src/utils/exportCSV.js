/**
 * Convert data array to CSV string
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column names to include
 * @returns {string} - CSV formatted string
 */
export const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(column => {
      let value = row[column] || '';
      
      // Convert to string
      value = String(value);
      
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  return [headers, ...rows].join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename) => {
  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link attributes
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV file
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column names to include
 * @param {string} filename - Name of the file (optional)
 */
export const exportDataToCSV = (data, columns, filename) => {
  // Generate filename with timestamp if not provided
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const finalFilename = filename || `Shipment_Dwelling_Time_Export_${timestamp}.csv`;
  
  // Convert data to CSV
  const csvContent = convertToCSV(data, columns);
  
  // Download the file
  downloadCSV(csvContent, finalFilename);
};
