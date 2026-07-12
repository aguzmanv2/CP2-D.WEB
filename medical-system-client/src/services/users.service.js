import api from './api.js';

const unwrap = (response) => response.data.data;

export const usersService = {
  async lookupByCedula(cedula) {
    const response = await api.get('/users/lookup', {
      params: { cedula }
    });

    return unwrap(response);
  },
  async list(params = {}) {
    const response = await api.get('/users', { params });
    return unwrap(response);
  },
  async update(id, payload) {
    return this.updateRole(id, payload);
  },
  async updateRole(id, payload) {
    const response = await api.patch(`/users/${id}/role`, payload);
    return unwrap(response);
  }
};
