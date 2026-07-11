const currencyFormatter = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? '-' : currencyFormatter.format(num);
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-SG');
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-SG');
}
