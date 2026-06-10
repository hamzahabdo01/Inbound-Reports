import { parse } from 'date-fns';

/**
 * Parse CSV data into structured objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} - Array of shipment records
 */
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);
    
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index].trim();
      });
      data.push(record);
    }
  }
  
  return data;
};

/**
 * Parse a CSV line handling quoted values with commas
 * @param {string} line - CSV line
 * @returns {Array} - Array of values
 */
const parseCSVLine = (line) => {
  const values = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue);
  return values;
};

/**
 * Parse date string in format "May 11th, 2024"
 * @param {string} dateStr - Date string
 * @returns {Date|null} - Parsed date or null
 */
export const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Remove ordinal suffixes (st, nd, rd, th)
    const cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
    return parse(cleanedDate, 'MMMM d, yyyy', new Date());
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
};

/**
 * Parse quantity string with commas (e.g., "5,555" -> 5555)
 * @param {string} quantityStr - Quantity string
 * @returns {number} - Parsed number
 */
export const parseQuantity = (quantityStr) => {
  if (!quantityStr || quantityStr.trim() === '') return 0;
  return parseInt(quantityStr.replace(/,/g, ''), 10) || 0;
};

/**
 * Parse dwelling time to integer
 * @param {string} dwellingTimeStr - Dwelling time string
 * @returns {number} - Dwelling time in days
 */
export const parseDwellingTime = (dwellingTimeStr) => {
  if (!dwellingTimeStr || dwellingTimeStr.trim() === '') return 0;
  return parseInt(dwellingTimeStr, 10) || 0;
};
