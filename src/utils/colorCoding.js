/**
 * Get color coding for dwelling time based on days
 * @param {number} days - Number of dwelling days
 * @returns {Object} - Color configuration with background and text colors
 */
export const getDwellingTimeColor = (days) => {
  if (days <= 30) {
    return {
      bg: '#10B981', // Success green
      text: '#FFFFFF', // White text
      label: 'Optimal'
    };
  } else if (days <= 60) {
    return {
      bg: '#D97706', // Warning yellow/amber
      text: '#FFFFFF', // White text
      label: 'Warning'
    };
  } else if (days <= 90) {
    return {
      bg: '#F97316', // Orange
      text: '#FFFFFF', // White text
      label: 'Concerning'
    };
  } else {
    return {
      bg: '#BA1A1A', // Error red
      text: '#FFFFFF', // White text
      label: 'Critical'
    };
  }
};

/**
 * Get Tailwind CSS classes for dwelling time cell
 * @param {number} days - Number of dwelling days
 * @returns {string} - Tailwind classes
 */
export const getDwellingTimeClasses = (days) => {
  if (days <= 30) {
    return 'bg-success text-white';
  } else if (days <= 60) {
    return 'bg-warning text-white';
  } else if (days <= 90) {
    return 'bg-orange text-white';
  } else {
    return 'bg-error text-white';
  }
};

/**
 * Get risk level based on dwelling time
 * @param {number} days - Number of dwelling days
 * @returns {Object} - Risk level with label and color
 */
export const getRiskLevel = (days) => {
  if (days <= 30) {
    return { label: 'LOW', color: 'text-success', bgColor: 'bg-success/10' };
  } else if (days <= 60) {
    return { label: 'MEDIUM', color: 'text-warning', bgColor: 'bg-warning/10' };
  } else if (days <= 90) {
    return { label: 'HIGH', color: 'text-orange', bgColor: 'bg-orange/10' };
  } else {
    return { label: 'CRITICAL', color: 'text-error', bgColor: 'bg-error/10' };
  }
};

/**
 * Get status dot color based on risk level
 * @param {number} days - Number of dwelling days
 * @returns {string} - Dot color class
 */
export const getStatusDotColor = (days) => {
  if (days <= 30) {
    return 'bg-success';
  } else if (days <= 60) {
    return 'bg-warning';
  } else if (days <= 90) {
    return 'bg-orange';
  } else {
    return 'bg-error';
  }
};
