import axios from 'axios';

// Ensure this matches the backend URL during development
const API_BASE_URL = 'http://localhost:5000/api/dashboard';

export const fetchKPIs = async (filters) => {
  const { data } = await axios.get(`${API_BASE_URL}/kpis`, { params: filters });
  return data.data;
};

export const fetchRankings = async (filters) => {
  const { data } = await axios.get(`${API_BASE_URL}/rankings`, { params: filters });
  return data;
};

export const archiveRankings = async (tenderReferenceId, archiveReason) => {
  const { data } = await axios.post(`${API_BASE_URL}/archive`, { tenderReferenceId, archiveReason });
  return data;
};
