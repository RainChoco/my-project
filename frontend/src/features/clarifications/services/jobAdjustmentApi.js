import { apiClient, DEFAULT_TIMEOUT_MS } from '@/lib';

// Matches apiClient's own default so these requests get the same cold-start
// tolerance as everything else instead of timing out first at 15s.
const REQUEST_TIMEOUT = DEFAULT_TIMEOUT_MS;

export async function createJobAdjustmentRequest(logId, payload) {
  const { data } = await apiClient.post(`/clarification-logs/${logId}/job-adjustment-requests`, payload, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function listJobAdjustmentRequests(params) {
  const { data } = await apiClient.get('/job-adjustment-requests', { params, timeout: REQUEST_TIMEOUT });
  return data;
}

export async function updateJobAdjustmentRequest(id, approvalStatus) {
  const { data } = await apiClient.patch(
    `/job-adjustment-requests/${id}`,
    { approval_status: approvalStatus },
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
}

export async function createFollowUpNotification(id) {
  const { data } = await apiClient.post(`/job-adjustment-requests/${id}/follow-up-notification`, undefined, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}
