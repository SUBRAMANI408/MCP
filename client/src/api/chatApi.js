import api from './axios';

export const chatApi = {
  getGroup: (id) => api.get(`/groups/${id}`),
  getMessages: (id, params) => api.get(`/groups/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/groups/${id}/messages`, data),
  pinMessage: (msgId) => api.put(`/groups/messages/${msgId}/pin`),
  markRead: (msgId) => api.put(`/groups/messages/${msgId}/read`),
  searchMessages: (id, q) => api.get(`/groups/${id}/messages/search`, { params: { q } }),
  deleteMessage: (msgId) => api.delete(`/groups/messages/${msgId}`),
};
