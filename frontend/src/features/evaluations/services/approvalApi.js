import { apiClient } from '../../../lib';

const REQUEST_TIMEOUT = 15000;

export const fetchApprovals = async (evaluationId) => {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/approvals`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const createApproval = async (evaluationId, payload) => {
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/approvals`, payload, { timeout: REQUEST_TIMEOUT });
  return data;
};
