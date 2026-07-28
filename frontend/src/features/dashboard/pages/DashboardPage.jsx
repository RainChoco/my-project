import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Archive } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

import KPICard from '../components/KPICard';
import FilterBar from '../components/FilterBar';
import RankingTable from '../components/RankingTable';
import Pagination from '../components/Pagination';
import ErrorState from '../components/ErrorState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ArchiveDialog from '../components/ArchiveDialog';
import EmptyState from '../components/EmptyState';

import TrendChart from '../charts/TrendChart';
import CategoryChart from '../charts/CategoryChart';
import RiskChart from '../charts/RiskChart';

import useDashboardFilters from '../hooks/useDashboardFilters';
import { fetchKPIs, fetchRankings, archiveRankings } from '../services/dashboardApi';
// mockData removed — dashboard uses real API data via dashboardApi.js
import { fetchContracts } from '../../contracts/services/contractApi';

export default function DashboardPage() {
  const { filters, updateFilter } = useDashboardFilters();
  
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archivedContracts, setArchivedContracts] = useState(new Set());
  const [toast, setToast] = useState(null);

  const { data: availableContracts = [] } = useQuery({ 
    queryKey: ['availableContracts'], 
    queryFn: fetchContracts 
  });

  const selectedContractName = availableContracts.find(c => c.id === filters.contractId)?.name || '';

  // TanStack Query for data fetching
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['kpis', filters.contractId],
    queryFn: () => fetchKPIs({ contractId: filters.contractId }),
    enabled: !!filters.contractId
  });

  const { data: rankings, isLoading: rankingsLoading, error: rankingsError } = useQuery({
    queryKey: ['rankings', filters],
    queryFn: () => fetchRankings(filters),
    enabled: !!filters.contractId
  });

  const archiveMutation = useMutation({
    mutationFn: (reason) => archiveRankings(filters.contractId, reason),
    onSuccess: () => {
      showToast('Successfully archived final rankings', 'success');
      setArchivedContracts(prev => new Set(prev).add(filters.contractId));
      setIsArchiveDialogOpen(false);
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || 'Failed to archive rankings', 'error');
      setIsArchiveDialogOpen(false);
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
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 600, color: '#334155' }}>Contract Opportunity:</label>
          <select 
            value={filters.contractId} 
            onChange={(e) => updateFilter('contractId', e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '300px', fontSize: '1rem' }}
          >
            <option value="">-- Select a Contract --</option>
            {availableContracts.map(contract => (
              <option key={contract.id} value={contract.id}>{contract.name}</option>
            ))}
          </select>
        </div>
      </header>
      
      {!filters.contractId ? (
        <div style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
          <EmptyState message="Please select a Contract Opportunity above to view rankings and analytics." />
        </div>
      ) : (
        <>
          {/* KPI Section */}
          <div className={styles.grid}>
            <KPICard title="Total Tenders" value={kpis?.totalTenders} isLoading={kpisLoading} />
            <KPICard title="Average PQM Score" value={kpis?.averagePQM ? kpis.averagePQM.toFixed(1) : '-'} isLoading={kpisLoading} />
            <KPICard title="High Risk Suppliers" value={kpis?.highRiskTenders} isLoading={kpisLoading} />
            <KPICard title="Recent Submissions" value={kpis?.recentSubmissions} isLoading={kpisLoading} />
          </div>

          {/* Charts Section — driven by real rankings data */}
          <div className={styles.chartGrid}>
            <TrendChart rankings={rankings?.data ?? []} />
            <CategoryChart rankings={rankings?.data ?? []} />
            <RiskChart rankings={rankings?.data ?? []} />
          </div>

          {/* Main Table Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', marginTop: '2rem' }}>
            <div>
              <h2 className={styles.title} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Supplier Rankings</h2>
              <FilterBar filters={filters} updateFilter={updateFilter} />
            </div>
            
            <button 
              className={archivedContracts.has(filters.contractId) ? styles.btnSecondary : styles.btnArchive}
              disabled={archivedContracts.has(filters.contractId) || rankingsLoading || (rankings?.data?.length === 0)}
              onClick={() => setIsArchiveDialogOpen(true)}
              style={archivedContracts.has(filters.contractId) ? { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'not-allowed', opacity: 0.7 } : { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
               <Archive size={18} /> 
               {archivedContracts.has(filters.contractId) ? 'Rankings Archived' : 'Archive Final Rankings'}
            </button>
          </div>
          
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
              />
              <Pagination pagination={rankings?.pagination} updateFilter={updateFilter} />
            </>
          )}

          {/* Archive Flow */}
          <ArchiveDialog 
            isOpen={isArchiveDialogOpen} 
            contractId={filters.contractId}
            contractName={selectedContractName}
            onClose={() => setIsArchiveDialogOpen(false)} 
            onConfirm={handleArchiveConfirm}
            isSubmitting={archiveMutation.isPending}
          />
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
