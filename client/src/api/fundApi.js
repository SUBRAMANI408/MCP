import api from './axios';

export const fundApi = {
  collectIncome: (data) => api.post('/funds/income', data),
  createExpenseRequest: (data) => api.post('/funds/expense-request', data),
  getFunds: (params) => api.get('/funds', { params }),
  getFund: (id) => api.get(`/funds/${id}`),
  getBalance: (associationId) => api.get(`/funds/${associationId}/balance`),
  getReports: (associationId) => api.get(`/funds/${associationId}/reports`),
  approveExpense: (id) => api.put(`/funds/expenses/${id}/approve`),
  rejectExpense: (id) => api.put(`/funds/expenses/${id}/reject`),
};
