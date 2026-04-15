export const formatCurrency = (amount, currency = 'PKR', symbol = 'Rs ') => {
  return `${symbol}${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return '-';
  
  // SQLite datetime('now') returns 'YYYY-MM-DD HH:MM:SS' in UTC.
  // JavaScript Date needs 'T' separator and 'Z' suffix to parse as UTC.
  let formattedDateString = dateString;
  if (!dateString.includes('T') && !dateString.includes('Z')) {
    formattedDateString = dateString.replace(' ', 'T') + 'Z';
  }

  const date = new Date(formattedDateString);
  
  // Fallback for invalid dates
  if (isNaN(date.getTime())) return dateString;

  if (showTime) {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString();
};

export const formatNumber = (num) => {
  return Number(num).toLocaleString();
};
