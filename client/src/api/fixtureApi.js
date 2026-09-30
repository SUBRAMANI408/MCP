import api from './axios';

export const fixtureApi = {
  getFixtures: (params) => api.get('/fixtures', { params }),
  getFixture: (id) => api.get(`/fixtures/${id}`),
  scheduleFixture: (id, data) => api.put(`/fixtures/${id}/schedule`, data),
  updateFixture: (id, data) => api.put(`/fixtures/${id}`, data),
};
