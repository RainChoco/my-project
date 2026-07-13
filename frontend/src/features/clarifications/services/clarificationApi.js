import { apiClient } from '@/lib';

// Thin wrappers around backend/src/routes/clarificationRoutes.js's clarification
// log/message endpoints. apiClient attaches the Authorization header and redirects
// to /login on 401 (see src/lib/apiClient.js).
const REQUEST_TIMEOUT = 15000;

export async function detectDeviation(tenderId) {
  const { data } = await apiClient.post(
    `/tenders/${tenderId}/clarification-logs/detect-deviation`,
    undefined,
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
}

export async function listClarificationLogs(params) {
  const { data } = await apiClient.get('/clarification-logs', { params, timeout: REQUEST_TIMEOUT });
  return data;
}

export async function getClarificationLog(id) {
  const { data } = await apiClient.get(`/clarification-logs/${id}`, { timeout: REQUEST_TIMEOUT });
  return data;
}

export async function draftMessage(logId) {
  const { data } = await apiClient.post(`/clarification-logs/${logId}/draft-message`, undefined, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function editMessage(messageId, payload) {
  const { data } = await apiClient.patch(`/clarification-messages/${messageId}`, payload, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function approveMessage(messageId) {
  const { data } = await apiClient.post(`/clarification-messages/${messageId}/approve`, undefined, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function sendClarification(logId, dispatchChannel) {
  const { data } = await apiClient.post(
    `/clarification-logs/${logId}/send`,
    { dispatch_channel: dispatchChannel },
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
}

export async function recordResponse(logId, payload) {
  const { data } = await apiClient.post(`/clarification-logs/${logId}/responses`, payload, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function addAttachment(messageId, file) {
  const formData = new FormData();
  formData.append('file', file);
  // No explicit timeout - file uploads can legitimately take longer than REQUEST_TIMEOUT.
  const { data } = await apiClient.post(`/clarification-messages/${messageId}/attachments`, formData);
  return data;
}

export async function resendClarification(logId) {
  const { data } = await apiClient.post(`/clarification-logs/${logId}/resend`, undefined, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function escalateClarification(logId) {
  const { data } = await apiClient.post(`/clarification-logs/${logId}/escalate`, undefined, {
    timeout: REQUEST_TIMEOUT,
  });
  return data;
}

export async function resolveClarification(logId, outcomeNotes) {
  const { data } = await apiClient.post(
    `/clarification-logs/${logId}/resolve`,
    { outcome_notes: outcomeNotes },
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
}
