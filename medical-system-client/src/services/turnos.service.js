import api from './api.js';

const unwrap = (response) => response.data.data;

export const turnosService = {
  async registerArrival(payload) {
    const response = await api.post('/turnos/registrar-llegada', payload);
    return unwrap(response);
  },
  async queue(params = {}) {
    const response = await api.get('/turnos/cola', { params });
    return unwrap(response);
  },
  async current(params = {}) {
    const response = await api.get('/turnos/actual', { params });
    return unwrap(response);
  },
  async next(params = {}) {
    const response = await api.get('/turnos/siguiente', { params });
    return unwrap(response);
  },
  async patient(params = {}) {
    const response = await api.get('/turnos/paciente', { params });
    return unwrap(response);
  },
  async startAttention(payload) {
    const response = await api.post('/turnos/atender', payload);
    return unwrap(response);
  },
  async finishAttention(payload) {
    const response = await api.post('/turnos/finalizar', payload);
    return unwrap(response);
  },
  async history(params = {}) {
    const response = await api.get('/turnos/historial', { params });
    return unwrap(response);
  }
};

