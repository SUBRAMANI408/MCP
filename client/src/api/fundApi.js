import api from './axios';

export const fundApi = {
  collectIncome: (data) => api.post('/funds/income', data),
  createExpenseRequest: (data) => api.post('/funds/expense-request', data),
  getFunds: (params) => api.get('/funds', { params }),
  getDashboard: () => api.get('/funds/dashboard'),
  getFund: (id) => api.get(`/funds/${id}`),
  getBalance: (associationId) => api.get(`/funds/${associationId}/balance`),
  getReports: (associationId) => api.get(`/funds/${associationId}/reports`),
  approveExpense: (id) => api.put(`/funds/expenses/${id}/approve`),
  rejectExpense: (id) => api.put(`/funds/expenses/${id}/reject`),

  // Modern structured Expense Requests (/api/v1/expenses)
  getExpenses: (params) => api.get('/expenses', { params }),
  createExpense: (data) => api.post('/expenses', data),
  getExpense: (id) => api.get(`/expenses/${id}`),
  reviewExpense: (id, data) => api.put(`/expenses/${id}/review`, data),
  payExpense: (id, data) => api.post(`/expenses/${id}/pay`, data),

  // Payment History
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
};
