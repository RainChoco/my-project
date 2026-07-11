import { apiClient } from '@/lib';

// Thin wrappers around backend/src/routes/tenderRoutes.js's tender CRUD, document,
// and eligibility endpoints. apiClient (see src/lib/apiClient.js) attaches the
// Authorization: Bearer <token> header and redirects to /login on 401.

export async function listTenders(params) {
  const { data } = await apiClient.get('/tenders', { params });
  return data;
}

export async function getTender(id) {
  const { data } = await apiClient.get(`/tenders/${id}`);
  return data;
}

export async function createTender(payload) {
  const { data } = await apiClient.post('/tenders', payload);
  return data;
}

export async function updateTender(id, payload) {
  const { data } = await apiClient.patch(`/tenders/${id}`, payload);
  return data;
}

export async function deleteTender(id) {
  await apiClient.delete(`/tenders/${id}`);
}

export async function listTenderDocuments(id) {
  const { data } = await apiClient.get(`/tenders/${id}/documents`);
  return data.data;
}

export async function uploadTenderDocument(tenderId, file, fileType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  const { data } = await apiClient.post(`/tenders/${tenderId}/documents`, formData);
  return data;
}

export async function replaceTenderDocument(tenderId, documentId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.put(`/tenders/${tenderId}/documents/${documentId}`, formData);
  return data;
}

export async function listEligibilityChecks(id) {
  const { data } = await apiClient.get(`/tenders/${id}/eligibility-checks`);
  return data.data;
}

export async function triggerEligibilityCheck(id) {
  const { data } = await apiClient.post(`/tenders/${id}/eligibility-check`);
  return data;
}

export async function overrideEligibilityCheck(checkId, payload) {
  const { data } = await apiClient.patch(`/eligibility-checks/${checkId}`, payload);
  return data;
}
