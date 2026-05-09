/**
 * Format number to currency string (VND)
 */
export const formatCurrency = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return '0 ₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
};

/**
 * Format ISO date string to localized time string
 */
export const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

/**
 * Format ISO date string to DD/MM/YYYY
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
};

/**
 * Format ISO date string to HH:mm
 */
export const formatOnlyTime = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    return '—';
  }
};
