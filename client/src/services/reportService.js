import api from './api';

export const getOverview = async (params = {}) => {
  const response = await api.get('/reports/overview', { params });
  return response.data?.data;
};

export const getEmployeesReport = async (params = {}) => {
  const response = await api.get('/reports/employees', { params });
  return response.data?.data;
};

export const getAttendanceReport = async (params = {}) => {
  const response = await api.get('/reports/attendance', { params });
  return response.data?.data;
};

export const getLeaveReport = async (params = {}) => {
  const response = await api.get('/reports/leave', { params });
  return response.data?.data;
};

export const getPayrollReport = async (params = {}) => {
  const response = await api.get('/reports/payroll', { params });
  return response.data?.data;
};

export const getPerformanceReport = async (params = {}) => {
  const response = await api.get('/reports/performance', { params });
  return response.data?.data;
};

export const getRecruitmentReport = async (params = {}) => {
  const response = await api.get('/reports/recruitment', { params });
  return response.data?.data;
};

/**
 * Downloads a report as CSV file using browser Blob.
 */
export const exportReportCsv = async (endpoint, filename) => {
  const response = await api.get(endpoint, {
    params: { export: 'csv' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
