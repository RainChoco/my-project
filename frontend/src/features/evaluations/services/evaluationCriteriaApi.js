import { apiClient } from '../../../lib';

// Requests time out after 15s so a slow/hung API surfaces as an error state
// rather than an indefinite spinner.
const REQUEST_TIMEOUT = 15000;

export const fetchCriteria = async (isActive) => {
  const params = isActive === undefined ? {} : { is_active: isActive };
  const { data } = await apiClient.get('/evaluation-criteria', { params, timeout: REQUEST_TIMEOUT });
  return data;
};

export const createCriterion = async (payload) => {
  const { data } = await apiClient.post('/evaluation-criteria', payload, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const updateCriterion = async (id, payload) => {
  const { data } = await apiClient.put(`/evaluation-criteria/${id}`, payload, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const deactivateCriterion = async (id) => {
  const { data } = await apiClient.delete(`/evaluation-criteria/${id}`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const reactivateCriterion = async (id) => {
  const { data } = await apiClient.post(`/evaluation-criteria/${id}/reactivate`, {}, { timeout: REQUEST_TIMEOUT });
  return data;
};

// Permanent hard delete - distinct from deactivateCriterion above. Only
// succeeds when the backend confirms the criterion was never used by an
// evaluation; otherwise it 409s and the criterion must be deactivated instead.
export const deleteCriterionPermanently = async (id) => {
  const { data } = await apiClient.delete(`/evaluation-criteria/${id}/permanent`, { timeout: REQUEST_TIMEOUT });
  return data;
};

// Read-only - computes which duplicate-name groups exist and what a cleanup
// would do, without changing anything.
export const previewDuplicateCleanup = async () => {
  const { data } = await apiClient.get('/evaluation-criteria/duplicates/preview', { timeout: REQUEST_TIMEOUT });
  return data;
};

// Hard-deletes only the unused duplicate rows the preview identified as safe.
// Never reactivates anything, never deletes a criterion used by an evaluation.
export const runDuplicateCleanup = async () => {
  const { data } = await apiClient.post('/evaluation-criteria/duplicates/cleanup', {}, { timeout: REQUEST_TIMEOUT });
  return data;
};
