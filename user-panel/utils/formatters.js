export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/** e.g. 125 → "2 min 5 sec", 0 → "0 sec" */
export const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) {
    return r > 0 ? `${m} min ${r} sec` : `${m} min`;
  }
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (rm === 0 && r === 0) return `${h} hr`;
  if (r === 0) return `${h} hr ${rm} min`;
  return `${h} hr ${rm} min ${r} sec`;
};