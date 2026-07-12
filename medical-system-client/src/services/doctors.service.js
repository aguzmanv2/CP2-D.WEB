import api from './api.js';

const unwrap = (response) => response.data.data;

export const doctorsService = {
  async list(params = {}) {
    const response = await api.get('/doctors', { params });
    return unwrap(response);
  },
  async getById(id) {
    const response = await api.get(`/doctors/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/doctors', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/doctors/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/doctors/${id}`);
    return unwrap(response);
  }
};

