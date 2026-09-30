import api from './axios';

export const tournamentApi = {
  createTournament: (data) => api.post('/tournaments', data),
  getTournaments: (params) => api.get('/tournaments', { params }),
  getTournament: (id) => api.get(`/tournaments/${id}`),
  updateTournament: (id, data) => api.put(`/tournaments/${id}`, data),
  submitForApproval: (id) => api.put(`/tournaments/${id}/submit`),
  approveTournament: (id) => api.put(`/tournaments/${id}/approve`),
  rejectTournament: (id, data) => api.put(`/tournaments/${id}/reject`, data),
  registerTeam: (id) => api.post(`/tournaments/${id}/register`),
  unregisterTeam: (id) => api.delete(`/tournaments/${id}/register`),
  generateFixtures: (id) => api.post(`/tournaments/${id}/generate-fixtures`),
  startTournament: (id) => api.put(`/tournaments/${id}/start`),
  completeTournament: (id) => api.put(`/tournaments/${id}/complete`),
  getTournamentReports: (id) => api.get(`/tournaments/${id}/reports`),
  getDashboard: () => api.get('/tournaments/dashboard'),
};
