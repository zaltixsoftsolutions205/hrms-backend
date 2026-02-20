export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const monthName = (month) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(month) - 1] || month;
};

export const getStatusBadge = (status) => {
  const map = {
    pending: 'badge-yellow',
    approved: 'badge-green',
    rejected: 'badge-red',
    present: 'badge-green',
    absent: 'badge-red',
    'half-day': 'badge-yellow',
    'not-started': 'badge-gray',
    'in-progress': 'badge-blue',
    completed: 'badge-green',
    new: 'badge-blue',
    interested: 'badge-yellow',
    'not-interested': 'badge-red',
    converted: 'badge-green',
    published: 'badge-green',
    generated: 'badge-blue',
    low: 'badge-gray',
    medium: 'badge-yellow',
    high: 'badge-red',
  };
  return map[status] || 'badge-gray';
};

// Converts "HH:mm" 24-hour string to "h:mm AM/PM"
export const formatTime12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ') : '';

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

export const daysUntil = (date) => {
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const sumMoney = (item) => {
  if (!item) return 0;
  if (Array.isArray(item)) return item.reduce((s, it) => s + (it?.amount || 0), 0);
  if (typeof item === 'object') return Object.values(item).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  return 0;
};
