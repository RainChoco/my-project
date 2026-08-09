import { apiClient, DEFAULT_TIMEOUT_MS } from '../../../lib';

// Matches apiClient's own default so these requests get the same cold-start
// tolerance as everything else instead of timing out first at 15s.
const REQUEST_TIMEOUT = DEFAULT_TIMEOUT_MS;

export const fetchEvaluationsForTender = async (tenderId) => {
  const { data } = await apiClient.get(`/tenders/${tenderId}/evaluations`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const createEvaluationFromTender = async (tenderId) => {
  const { data } = await apiClient.post(`/tenders/${tenderId}/evaluations`, {}, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const fetchEvaluation = async (id) => {
  const { data } = await apiClient.get(`/evaluations/${id}`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const saveDraftScores = async (id, scores) => {
  const { data } = await apiClient.patch(`/evaluations/${id}/scores`, { scores }, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const submitEvaluation = async (id) => {
  const { data } = await apiClient.post(`/evaluations/${id}/submit`, {}, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const reprocessEvaluation = async (id) => {
  const { data } = await apiClient.post(`/evaluations/${id}/reprocess`, {}, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const fetchCompletedEvaluations = async (params) => {
  const { data } = await apiClient.get('/evaluations', { params, timeout: REQUEST_TIMEOUT });
  return data;
};
