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
