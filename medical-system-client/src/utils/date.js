export const formatDate = (value, locale = 'es-CO') => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
};

export const formatDateTime = (dateValue, timeValue, locale = 'es-CO') => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  const dateText = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date);

  return timeValue ? `${dateText} - ${timeValue}` : dateText;
};

export const toDateInputValue = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

