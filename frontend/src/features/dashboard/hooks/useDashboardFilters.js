import { useState, useCallback } from 'react';

export default function useDashboardFilters() {
  const [filters, setFilters] = useState({
    contractId: '',
    status: '',
    category: '',
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
      ...(key !== 'page' && { page: 1 }) // Reset page on filter change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      contractId: '',
      status: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 10,
      sortBy: 'pqmScore',
      sortOrder: 'desc'
    });
  }, []);

  return { filters, updateFilter, resetFilters };
}
