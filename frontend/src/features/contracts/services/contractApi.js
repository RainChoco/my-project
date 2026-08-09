import apiClient from '../../../lib/apiClient';

const API_BASE_URL = '/v1/contracts';

export const fetchContracts = async () => {
  const { data } = await apiClient.get(API_BASE_URL);
  return data.data;
};

export const fetchContractById = async (id) => {
  const { data } = await apiClient.get(`${API_BASE_URL}/${id}`);
  return data.data;
};

export const createContract = async (contractData) => {
  const { data } = await apiClient.post(API_BASE_URL, contractData);
  return data.data;
};

export const updateContract = async (id, contractData) => {
  const { data } = await apiClient.put(`${API_BASE_URL}/${id}`, contractData);
  return data.data;
};

export const deleteContract = async (id) => {
  const { data } = await apiClient.delete(`${API_BASE_URL}/${id}`);
  return data.data;
};

export const fetchContractTenders = async (contractId) => {
  const { data } = await apiClient.get(`${API_BASE_URL}/${contractId}/tenders`);
  return data.data;
};
