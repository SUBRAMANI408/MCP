import api from './axios';

export const teamApi = {
  createTeam: (data) => api.post('/teams', data),
  getTeams: (params) => api.get('/teams', { params }),
  getTeam: (id) => api.get(`/teams/${id}`),
  getMyTeam: () => api.get('/teams/my-team'),
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),
  invitePlayer: (id, data) => api.post(`/teams/${id}/invite`, data),
  removePlayer: (id, playerId) => api.delete(`/teams/${id}/players/${playerId}`),
  promoteViceCaptain: (id, data) => api.put(`/teams/${id}/promote-vice-captain`, data),
  submitForApproval: (id) => api.put(`/teams/${id}/submit-approval`),
};
