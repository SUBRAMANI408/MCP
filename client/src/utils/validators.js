export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone) => {
  return /^[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password) => {
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'badge-success',
    approved: 'badge-success',
    completed: 'badge-success',
    accepted: 'badge-success',
    pending: 'badge-pending',
    pending_approval: 'badge-pending',
    draft: 'badge-info',
    ongoing: 'badge-live',
    live: 'badge-live',
    inactive: 'badge-danger',
    rejected: 'badge-danger',
    cancelled: 'badge-danger',
    conflict: 'badge-danger',
    maintenance: 'badge-pending',
  };
  return colors[status] || 'badge-info';
};
