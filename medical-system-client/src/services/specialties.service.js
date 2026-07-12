import api from './api.js';

const unwrap = (response) => response.data.data;

export const specialtiesService = {
  async list(params = {}) {
    const response = await api.get('/specialties', { params });
    return unwrap(response);
  },
  async getById(id) {
    const response = await api.get(`/specialties/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/specialties', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/specialties/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/specialties/${id}`);
    return unwrap(response);
  }
};

