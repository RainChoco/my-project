import { apiClient, DEFAULT_TIMEOUT_MS } from '../../../lib';

// Matches apiClient's own default so these requests get the same cold-start
// tolerance as everything else instead of timing out first at 15s.
const REQUEST_TIMEOUT = DEFAULT_TIMEOUT_MS;

export const fetchApprovals = async (evaluationId) => {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/approvals`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const createApproval = async (evaluationId, payload) => {
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/approvals`, payload, { timeout: REQUEST_TIMEOUT });
  return data;
};
