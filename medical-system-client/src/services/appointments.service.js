import api from './api.js';

const unwrap = (response) => response.data.data;

export const appointmentsService = {
  async list(params = {}) {
    const response = await api.get('/appointments', { params });
    return unwrap(response);
  },
  async getById(id) {
    const response = await api.get(`/appointments/${id}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post('/appointments', payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/appointments/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/appointments/${id}`);
    return unwrap(response);
  }
};

export const appointmentsMetaService = {
  async load() {
    const [patients, doctors, specialties] = await Promise.all([
      api.get('/patients', { params: { limit: 500, estado: 'Activo' } }),
      api.get('/doctors', { params: { limit: 200, estado: 'Activo' } }),
      api.get('/specialties', { params: { limit: 200, estado: 'Activo' } })
    ]);

    return {
      patients: patients.data.data.items,
      doctors: doctors.data.data.items,
      specialties: specialties.data.data.items
    };
  }
};
