import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import styles from '../styles/dashboard.module.css';

import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import RankingTable from '../components/RankingTable';
import Pagination from '../components/Pagination';
import ErrorState from '../components/ErrorState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ArchiveDialog from '../components/ArchiveDialog';

import TrendChart from '../charts/TrendChart';
import CategoryChart from '../charts/CategoryChart';
import RiskChart from '../charts/RiskChart';

import useDashboardFilters from '../hooks/useDashboardFilters';
import { fetchKPIs, fetchRankings, archiveRankings } from '../services/dashboardApi';
import { mockKPIs, mockRankings } from '../utils/mockData';

export default function DashboardPage() {
  const { filters, updateFilter } = useDashboardFilters();
  
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [toast, setToast] = useState(null);

  // TanStack Query for data fetching
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['kpis', filters],
    queryFn: () => fetchKPIs(filters).catch(() => mockKPIs) // Fallback to mock data if API fails
  });

  const { data: rankings, isLoading: rankingsLoading, error: rankingsError } = useQuery({
    queryKey: ['rankings', filters],
    queryFn: () => fetchRankings(filters).catch(() => mockRankings) // Fallback to mock data if API fails
  });

  const archiveMutation = useMutation({
    mutationFn: (reason) => archiveRankings(archiveTarget, reason),
    onSuccess: () => {
      showToast('Successfully archived scoring list', 'success');
      setArchiveTarget(null);
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || 'Failed to archive', 'error');
      setArchiveTarget(null);
    }
  });

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleArchiveConfirm = (reason) => {
    archiveMutation.mutate(reason);
  };

  if (kpisError && !kpis) {
    return <ErrorState message="Failed to load dashboard data." onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Strategic Rankings Dashboard</h1>
      </header>
      
      {/* KPI Section */}
      <div className={styles.grid}>
        <KPICard title="Total Tenders" value={kpis?.totalTenders} isLoading={kpisLoading} />
        <KPICard title="Average PQM Score" value={kpis?.averagePQM ? kpis.averagePQM.toFixed(1) : '-'} isLoading={kpisLoading} />
        <KPICard title="High Risk Vendors" value={kpis?.highRiskTenders} isLoading={kpisLoading} />
        <KPICard title="Recent Submissions" value={kpis?.recentSubmissions} isLoading={kpisLoading} />
      </div>

      {/* Charts Section */}
      <div className={styles.chartGrid}>
        <TrendChart />
        <CategoryChart />
        <RiskChart />
      </div>

      {/* Main Table Section */}
      <h2 className={styles.title} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Vendor Rankings</h2>
      <FilterBar filters={filters} updateFilter={updateFilter} />
      
      {rankingsLoading ? (
        <LoadingSkeleton />
      ) : rankingsError && !rankings ? (
        <ErrorState message="Failed to load rankings." />
      ) : (
        <>
          <RankingTable 
            data={rankings?.data} 
            filters={filters} 
            updateFilter={updateFilter}
            onArchiveClick={setArchiveTarget}
          />
          <Pagination pagination={rankings?.pagination} updateFilter={updateFilter} />
        </>
      )}

      {/* Archive Flow */}
      <ArchiveDialog 
        isOpen={!!archiveTarget} 
        tenderId={archiveTarget}
        onClose={() => setArchiveTarget(null)} 
        onConfirm={handleArchiveConfirm}
        isSubmitting={archiveMutation.isPending}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
