import api from './axios';

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Association management
  createAssociation: (data) => api.post('/admin/associations', data),
  getAssociations: (params) => api.get('/admin/associations', { params }),
  updateAssociation: (id, data) => api.put(`/admin/associations/${id}`, data),
  deleteAssociation: (id) => api.delete(`/admin/associations/${id}`),

  // User management
  createUser: (data) => api.post('/admin/users', data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetUserPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  bulkDeleteUsers: (data) => api.post('/admin/users/bulk-delete', data),
  toggleUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),

  // Notifications
  sendNotification: (data) => api.post('/admin/notifications/send', data),

  // Audit logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),

  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),

  // Monitoring (reuses dashboard + specific queries)
  getMonitoring: () => api.get('/admin/dashboard'),

  // System configuration
  getSystemConfig: () => api.get('/admin/system-config'),
  updateSystemConfig: (data) => api.put('/admin/system-config', data),

  // Feedback management
  getFeedback: (params) => api.get('/admin/feedback', { params }),
  replyToFeedback: (id, data) => api.put(`/admin/feedback/${id}/reply`, data),
  resolveFeedback: (id) => api.patch(`/admin/feedback/${id}/resolve`),

  // Security
  forceLogoutUser: (id) => api.post(`/admin/users/${id}/force-logout`),
  getLoginAttempts: (params) => api.get('/admin/security/login-attempts', { params }),
};
