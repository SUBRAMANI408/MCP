import api from './axios';

export const matchApi = {
  getMatches: (params) => api.get('/matches', { params }),
  getLiveMatches: () => api.get('/matches/live'),
  getMatch: (id) => api.get(`/matches/${id}`),
  getMatchSummary: (id) => api.get(`/matches/${id}/summary`),
  startMatch: (id) => api.post(`/matches/${id}/start`),
  addEvent: (id, data) => api.post(`/matches/${id}/event`, data),
  completeMatch: (id, data) => api.put(`/matches/${id}/complete`, data),
};
