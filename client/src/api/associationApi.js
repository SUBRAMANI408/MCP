import api from './axios';

export const associationApi = {
  getAssociation: (id) => api.get(`/associations/${id}`),
  updateAssociation: (id, data) => api.put(`/associations/${id}`, data),
  getDashboard: (id) => api.get(`/associations/${id}/dashboard`),
  getTeams: (id, params) => api.get(`/associations/${id}/teams`, { params }),
  getMembers: (id) => api.get(`/associations/${id}/members`),
  
  // Officers
  createOrganizer: (id, data) => api.post(`/associations/${id}/organizers`, data),
  createGroundOfficer: (id, data) => api.post(`/associations/${id}/ground-officers`, data),
  createFundsOfficer: (id, data) => api.post(`/associations/${id}/funds-officers`, data),
  updateOfficer: (id, officerId, data) => api.put(`/associations/${id}/officers/${officerId}`, data),
  deleteOfficer: (id, officerId) => api.delete(`/associations/${id}/officers/${officerId}`),

  // Temp organizer
  assignTempOrganizer: (id, data) => api.post(`/associations/${id}/temp-organizer`, data),
  revokeTempOrganizer: (id, captainId) => api.delete(`/associations/${id}/temp-organizer/${captainId}`),

  // Team controls
  approveTeam: (teamId) => api.put(`/associations/teams/${teamId}/approve`),
  rejectTeam: (teamId, data) => api.put(`/associations/teams/${teamId}/reject`, data),
  suspendTeam: (teamId) => api.put(`/associations/teams/${teamId}/suspend`),
  reactivateTeam: (teamId) => api.put(`/associations/teams/${teamId}/reactivate`),
};
