import api from './api.js';

const unwrap = (response) => response.data.data;

const buildExportBlob = async (format, params = {}) => {
  const response = await api.get(`/reports/export/${format}`, {
    params,
    responseType: 'blob'
  });

  const contentDisposition = response.headers?.['content-disposition'] || '';
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || `reporte.${format}`;

  return {
    blob: response.data,
    filename
  };
};

export const reportsService = {
  async dashboard(params = {}) {
    const response = await api.get('/reports/dashboard', { params });
    return unwrap(response);
  },
  async table(params = {}) {
    const response = await api.get('/reports/table', { params });
    return unwrap(response);
  },
  async exportCsv(params = {}) {
    return buildExportBlob('csv', params);
  },
  async exportExcel(params = {}) {
    return buildExportBlob('excel', params);
  },
  async exportPdf(params = {}) {
    return buildExportBlob('pdf', params);
  }
};

