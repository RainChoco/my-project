import { apiClient } from '@/lib';

const REQUEST_TIMEOUT = 15000;

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
