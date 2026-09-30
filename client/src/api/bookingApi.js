import api from './axios';

export const bookingApi = {
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  approveBooking: (id) => api.put(`/bookings/${id}/approve`),
  rejectBooking: (id, data) => api.put(`/bookings/${id}/reject`, data),
  getCalendar: (params) => api.get('/bookings/calendar', { params }),
  getReports: (params) => api.get('/bookings/reports', { params }),
  getDashboard: () => api.get('/bookings/dashboard'),
  updateGroundStatus: (id, status) => api.patch(`/grounds/${id}/status`, { status }),
};
