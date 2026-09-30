import api from './axios';

export const captainApi = {
  // Team details & stats
  getMyTeam: () => api.get('/teams/my-team'),
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),
  submitForApproval: (id) => api.put(`/teams/${id}/submit-approval`),

  // Player management
  invitePlayer: (id, data) => api.post(`/teams/${id}/invite`, data),
  removePlayer: (id, playerId) => api.delete(`/teams/${id}/players/${playerId}`),
  promoteViceCaptain: (id, data) => api.put(`/teams/${id}/promote-vice-captain`, data),

  // Friendly Match
  getFriendlyMatches: (params) => api.get('/friendly-matches', { params }),
  sendFriendlyRequest: (data) => api.post('/friendly-matches', data),
  acceptFriendlyMatch: (id) => api.put(`/friendly-matches/${id}/accept`),
  rejectFriendlyMatch: (id) => api.put(`/friendly-matches/${id}/reject`),
  rescheduleFriendlyMatch: (id, data) => api.put(`/friendly-matches/${id}/reschedule`, data),
  cancelFriendlyMatch: (id) => api.delete(`/friendly-matches/${id}`),

  // Grounds & Bookings
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),

  // Tournaments
  getTournaments: (params) => api.get('/tournaments', { params }),
  registerTournament: (id) => api.post(`/tournaments/${id}/register`),
  unregisterTournament: (id) => api.delete(`/tournaments/${id}/register`),
};
