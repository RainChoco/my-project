import apiClient from '../../../lib/apiClient';

const API_BASE_URL = '/v1/dashboard';

const cleanFilters = (filters) => Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));

export const fetchKPIs = async (filters) => {
  const { data } = await apiClient.get(`${API_BASE_URL}/kpis`, {
    params: cleanFilters(filters),
  });
  return data.data;
};

export const fetchRankings = async (filters) => {
  const { data } = await apiClient.get(`${API_BASE_URL}/rankings`, {
    params: cleanFilters(filters),
  });
  return data;
};

// F4: contractId is the primary field (backend also accepts tenderReferenceId)
export const archiveRankings = async (contractId, archiveReason) => {
  const { data } = await apiClient.post(
    `${API_BASE_URL}/archive`,
    { contractId, archiveReason }
  );
  return data;
};
