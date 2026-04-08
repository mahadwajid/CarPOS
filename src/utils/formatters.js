export const formatCurrency = (amount, currency = 'PKR', symbol = 'Rs ') => {
  return `${symbol}${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString, showTime = false) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (showTime) {
    return date.toLocaleString();
  }
  return date.toLocaleDateString();
};

export const formatNumber = (num) => {
  return Number(num).toLocaleString();
};
