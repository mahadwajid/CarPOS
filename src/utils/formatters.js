export const formatCurrency = (amount, currency = 'USD', symbol = '$') => {
  return `${symbol}${Number(amount).toFixed(2)}`;
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
