import axios from 'axios';
import { getAuthHeader } from '../../../utils/auth';

// Use Vite proxy (/api → http://127.0.0.1:5000) so this works in all envs
const API_BASE_URL = '/api/v1/dashboard';

const cleanFilters = (filters) => Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));

export const fetchKPIs = async (filters) => {
  const { data } = await axios.get(`${API_BASE_URL}/kpis`, {
    params: cleanFilters(filters),
    headers: getAuthHeader()
  });
  return data.data;
};

export const fetchRankings = async (filters) => {
  const { data } = await axios.get(`${API_BASE_URL}/rankings`, {
    params: cleanFilters(filters),
    headers: getAuthHeader()
  });
  return data;
};

// F4: contractId is the primary field (backend also accepts tenderReferenceId)
export const archiveRankings = async (contractId, archiveReason) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/archive`,
    { contractId, archiveReason },
    { headers: getAuthHeader() }
  );
  return data;
};
