import { apiClient } from '../../../lib';

const REQUEST_TIMEOUT = 15000;

export const fetchEvaluationsForTender = async (tenderId) => {
  const { data } = await apiClient.get(`/tenders/${tenderId}/evaluations`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const processTenderForEvaluation = async (tenderId, documentIds) => {
  const { data } = await apiClient.post(
    `/tenders/${tenderId}/evaluations`,
    { document_ids: documentIds },
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
};

export const fetchEvaluation = async (id) => {
  const { data } = await apiClient.get(`/evaluations/${id}`, { timeout: REQUEST_TIMEOUT });
  return data;
};

export const confirmEvaluationInputs = async (id, aiExtractedInputs) => {
  const { data } = await apiClient.patch(
    `/evaluations/${id}/confirm-inputs`,
    { ai_extracted_inputs: aiExtractedInputs },
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
};

export const reprocessEvaluation = async (id, documentIds) => {
  const { data } = await apiClient.post(
    `/evaluations/${id}/reprocess`,
    { document_ids: documentIds },
    { timeout: REQUEST_TIMEOUT }
  );
  return data;
};
