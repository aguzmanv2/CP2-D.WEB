import api from './api.js';

const unwrap = (response) => response.data.data;

export const patientsService = {
  async list(params = {}) {
    const response = await api.get('/patients', { params });
    return unwrap(response);
  },
  async getById(id) {
    const response = await api.get(`/patients/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/patients', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/patients/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/patients/${id}`);
    return unwrap(response);
  }
};

