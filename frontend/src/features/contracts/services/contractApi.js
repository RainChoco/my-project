import axios from 'axios';

// Use Vite proxy (/api → http://localhost:5050) so this works in all envs
const API_BASE_URL = '/api/v1/contracts';

// Helper: inject JWT token from localStorage
const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchContracts = async () => {
  const { data } = await axios.get(API_BASE_URL, { headers: authHeader() });
  return data.data;
};

export const fetchContractById = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/${id}`, { headers: authHeader() });
  return data.data;
};

export const createContract = async (contractData) => {
  const { data } = await axios.post(API_BASE_URL, contractData, { headers: authHeader() });
  return data.data;
};

export const updateContract = async (id, contractData) => {
  const { data } = await axios.put(`${API_BASE_URL}/${id}`, contractData, { headers: authHeader() });
  return data.data;
};

export const deleteContract = async (id) => {
  const { data } = await axios.delete(`${API_BASE_URL}/${id}`, { headers: authHeader() });
  return data.data;
};
