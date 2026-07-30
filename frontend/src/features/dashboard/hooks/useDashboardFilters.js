import { useState, useCallback } from 'react';

export default function useDashboardFilters() {
  const [filters, setFilters] = useState({
    contractId: '',
    status: '',
    category: '',
    riskLevel: '',
    supplierSearch: '',
    pqmMin: '',
    pqmMax: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 10,
    sortBy: 'pqmScore',
    sortOrder: 'desc'
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 })
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      contractId: prev.contractId,
      status: '',
      category: '',
      riskLevel: '',
      supplierSearch: '',
      pqmMin: '',
      pqmMax: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 10,
      sortBy: 'pqmScore',
      sortOrder: 'desc'
    }));
  }, []);

  return { filters, updateFilter, resetFilters };
}
