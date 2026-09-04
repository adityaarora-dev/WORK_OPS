import api from './api';

export const getDocuments = async (params = {}) => {
  const response = await api.get('/documents', { params });
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const downloadDocument = async (id, fileName) => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName || `document_${id}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const uploadDocument = async (formData) => {
  const response = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const archiveDocument = async (id) => {
  const response = await api.patch(`/documents/${id}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export default {
  getDocuments,
  getDocumentById,
  downloadDocument,
  uploadDocument,
  archiveDocument,
  deleteDocument,
};
