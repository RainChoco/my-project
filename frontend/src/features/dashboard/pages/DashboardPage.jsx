import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Archive, Trophy, ShieldAlert, Star, Download, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { fetchContracts } from '../../contracts/services/contractApi';

// ── helpers ────────────────────────────────────────────────────────────────
function getPQMBadge(score) {
  if (score == null) return null;
  if (score >= 90) return { bg: '#dcfce7', color: '#166534', border: '#86efac', label: 'Excellent' };
  if (score >= 80) return { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd', label: 'Good' };
  if (score >= 70) return { bg: '#fff7ed', color: '#c2410c', border: '#fdba74', label: 'Fair' };
  return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'Low' };
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>{subtitle}</p>}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color = '#2563eb' }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '1rem 1.25rem',
      border: '1px solid #e5e7eb', flex: '1', minWidth: '160px',
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
    }}>
      <div style={{ background: `${color}18`, color, borderRadius: '8px', padding: '0.5rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{value || '—'}</div>
        {sub && <div style={{ fontSize: '0.75rem', color, fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Export helpers ──────────────────────────────────────────────────────────
function exportToCSV(data, filename) {
  if (!data?.length) return;
  const headers = ['Rank', 'Tender ID', 'Supplier', 'Category', 'Status', 'PQM Score', 'Risk Level'];
  const rows = data.map(r => [
    r.rank, r.tenderRefNo, r.supplierName, r.category, r.status,
    r.pqmScore?.toFixed(1) ?? '', r.riskLevel ?? ''
  ]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.setAttribute('download', filename);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { filters, updateFilter, resetFilters } = useDashboardFilters();
  const navigate = useNavigate();
  const rankingRef = useRef(null);

  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archivedContracts, setArchivedContracts]     = useState(new Set());
  const [toast, setToast] = useState(null);
  const [archiveVersion, setArchiveVersion] = useState({});

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: availableContracts = [] } = useQuery({
    queryKey: ['availableContracts'],
    queryFn: fetchContracts
  });

  const selectedContract = availableContracts.find(c => c.id === filters.contractId);

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

  // ── Mutations ───────────────────────────────────────────────────────────
  const archiveMutation = useMutation({
    mutationFn: (reason) => archiveRankings(filters.contractId, reason),
    onSuccess: () => {
      showToast('Successfully archived final rankings', 'success');
      setArchivedContracts(prev => new Set(prev).add(filters.contractId));
      setArchiveVersion(prev => ({
        ...prev,
        [filters.contractId]: { version: (prev[filters.contractId]?.version || 0) + 1, date: new Date().toLocaleDateString() }
      }));
      setIsArchiveDialogOpen(false);
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || 'Failed to archive rankings', 'error');
      setIsArchiveDialogOpen(false);
    }
  });

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── KPI click handlers ──────────────────────────────────────────────────
  const scrollToRankings = useCallback(() => {
    rankingRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleHighRiskClick = useCallback(() => {
    updateFilter('riskLevel', 'High');
    scrollToRankings();
  }, [updateFilter, scrollToRankings]);

  // ── Derived data ────────────────────────────────────────────────────────
  const rankingsData   = rankings?.data ?? [];
  const topSupplier    = rankingsData.find(r => r.rank === 1);
  const highestRisk    = rankingsData.find(r => r.riskLevel === 'High');

  const categoryAvgs = {};
  rankingsData.forEach(r => {
    if (r.pqmScore != null) {
      if (!categoryAvgs[r.category]) categoryAvgs[r.category] = { total: 0, count: 0 };
      categoryAvgs[r.category].total += r.pqmScore;
      categoryAvgs[r.category].count += 1;
    }
  });
  const bestCategory = Object.entries(categoryAvgs)
    .map(([cat, { total, count }]) => ({ cat, avg: total / count }))
    .sort((a, b) => b.avg - a.avg)[0];

  const highRiskCount  = kpis?.highRiskTenders ?? 0;
  const totalTenders   = kpis?.totalTenders ?? 0;
  const highRiskPct    = totalTenders > 0 ? Math.round((highRiskCount / totalTenders) * 100) : 0;
  const avgPQM         = kpis?.averagePQM;
  const pqmBadge       = getPQMBadge(avgPQM);
  const archInfo       = archiveVersion[filters.contractId];
  const isArchived     = archivedContracts.has(filters.contractId);

  if (kpisError && !kpis) {
    return <ErrorState message="Failed to load dashboard data." onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.title}>Strategic Rankings Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: '0.3rem', fontSize: '0.9rem' }}>
              Tender Process Automation · EmServices
            </p>
          </div>
          {filters.contractId && (
            <button
              onClick={() => exportToCSV(rankingsData, `rankings-${filters.contractId}.csv`)}
              disabled={!rankingsData.length}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', background: '#f0fdf4', color: '#166534',
                border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', opacity: rankingsData.length ? 1 : 0.5
              }}
            >
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>

        {/* Contract Selector + Summary */}
        <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>Contract Opportunity:</label>
            <select
              value={filters.contractId}
              onChange={(e) => updateFilter('contractId', e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '280px', fontSize: '0.95rem', flex: 1 }}
            >
              <option value="">— Select a Contract —</option>
              {availableContracts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          {/* Contract summary panel */}
          {selectedContract && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Category</span>
                <div style={{ fontWeight: 700, color: '#111827' }}>{selectedContract.category || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Status</span>
                <div>
                  <span style={{ fontWeight: 700, color: selectedContract.status === 'Open' ? '#166534' : '#b91c1c' }}>
                    {selectedContract.status}
                  </span>
                </div>
              </div>
              {selectedContract.budgetLimit && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Budget Limit</span>
                  <div style={{ fontWeight: 700, color: '#111827' }}>
                    ${Number(selectedContract.budgetLimit).toLocaleString()}
                  </div>
                </div>
              )}
              {selectedContract.closingDate && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Closing Date</span>
                  <div style={{ fontWeight: 700, color: new Date(selectedContract.closingDate) < new Date() ? '#b91c1c' : '#111827' }}>
                    {new Date(selectedContract.closingDate).toLocaleDateString()}
                    {new Date(selectedContract.closingDate) < new Date() && (
                      <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#b91c1c' }}>Closed</span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Submissions</span>
                <div style={{ fontWeight: 700, color: '#2563eb' }}>{kpis?.totalTenders ?? '—'}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {!filters.contractId ? (
        <div style={{ padding: '5rem 0', display: 'flex', justifyContent: 'center' }}>
          <EmptyState
            message="Select a contract above to view rankings, KPIs, and analytics."
            action={{ label: 'Go to Contracts', href: '/contracts' }}
          />
        </div>
      ) : (
        <>
          {/* ── Section: Overview ──────────────────────────────────────── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="Overview" subtitle="Key performance indicators for this contract" />
            <div className={styles.grid}>
              {/* Total Submissions */}
              <KPICard
                title="Total Supplier Submissions"
                value={kpis?.totalTenders ?? '—'}
                isLoading={kpisLoading}
                subtitle={totalTenders === 1 ? '1 submission received' : `${totalTenders} submissions received`}
                onClick={scrollToRankings}
              />
              {/* Average PQM */}
              <KPICard
                title="Average PQM Score"
                value={avgPQM != null ? avgPQM.toFixed(1) : '—'}
                isLoading={kpisLoading}
                badge={pqmBadge}
                subtitle="Price-Quality-Method weighted score"
              />
              {/* High Risk */}
              <KPICard
                title="High Risk Suppliers"
                value={highRiskCount}
                isLoading={kpisLoading}
                subtitle={totalTenders > 0 ? `${highRiskPct}% of all suppliers` : 'No submissions yet'}
                trend={highRiskCount > 0 ? { direction: 'down', value: 'Requires attention' } : { direction: 'neutral', value: 'All clear' }}
                onClick={highRiskCount > 0 ? handleHighRiskClick : undefined}
              />
              {/* Recent Submissions */}
              <KPICard
                title="Recent Submissions (7d)"
                value={kpis?.recentSubmissions ?? '—'}
                isLoading={kpisLoading}
                subtitle="Submitted in the past 7 days"
                trend={kpis?.recentSubmissions > 0 ? { direction: 'up', value: 'Active' } : { direction: 'neutral', value: 'No new submissions' }}
              />
            </div>
          </section>

          {/* ── Section: Ranking Summary ───────────────────────────────── */}
          {rankingsData.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <SectionHeader title="Ranking Summary" subtitle="Top performers for this contract" />
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {topSupplier && (
                  <SummaryCard
                    icon={<Trophy size={20} />}
                    label="🥇 Top Supplier"
                    value={topSupplier.supplierName}
                    sub={`PQM ${topSupplier.pqmScore?.toFixed(1) ?? '—'}`}
                    color="#b45309"
                  />
                )}
                {highestRisk && (
                  <SummaryCard
                    icon={<ShieldAlert size={20} />}
                    label="⚠️ Highest Risk"
                    value={highestRisk.supplierName}
                    sub="High Risk"
                    color="#dc2626"
                  />
                )}
                {bestCategory && (
                  <SummaryCard
                    icon={<Star size={20} />}
                    label="🏆 Best Category"
                    value={bestCategory.cat}
                    sub={`Avg PQM ${bestCategory.avg.toFixed(1)}`}
                    color="#7c3aed"
                  />
                )}
              </div>
            </section>
          )}

          {/* ── Section: Performance Analytics ────────────────────────── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="Performance Analytics" subtitle="Visual breakdown of evaluation outcomes" />
            <div className={styles.chartGrid}>
              <TrendChart rankings={rankingsData} />
              <CategoryChart rankings={rankingsData} />
              <RiskChart rankings={rankingsData} />
            </div>
          </section>

          {/* ── Section: Supplier Rankings ─────────────────────────────── */}
          <section ref={rankingRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>Supplier Rankings</h2>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
                  Sorted by PQM score · {rankingsData.length} result{rankingsData.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Archive button with version info */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <button
                  disabled={isArchived || rankingsLoading || rankingsData.length === 0}
                  onClick={() => setIsArchiveDialogOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.55rem 1.1rem',
                    background: isArchived ? '#f3f4f6' : '#0ea5e9',
                    color: isArchived ? '#374151' : 'white',
                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
                    cursor: isArchived || rankingsData.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: rankingsData.length === 0 ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <Package size={16} />
                  {isArchived ? '✓ Rankings Archived' : 'Archive Final Rankings'}
                </button>
                {archInfo && (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', textAlign: 'right' }}>
                    v{archInfo.version} · Last archived {archInfo.date}
                  </div>
                )}
                {!archInfo && isArchived && (
                  <div style={{ fontSize: '0.72rem', color: '#059669' }}>Archived today</div>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ marginBottom: '1rem' }}>
              <FilterBar filters={filters} updateFilter={updateFilter} onReset={resetFilters} />
            </div>

            {rankingsLoading ? (
              <LoadingSkeleton />
            ) : rankingsError && !rankings ? (
              <ErrorState message="Failed to load rankings." />
            ) : (
              <>
                <RankingTable data={rankingsData} filters={filters} updateFilter={updateFilter} />
                <Pagination pagination={rankings?.pagination} updateFilter={updateFilter} />
              </>
            )}
          </section>

          {/* Archive Dialog */}
          <ArchiveDialog
            isOpen={isArchiveDialogOpen}
            contractId={filters.contractId}
            contractName={selectedContract?.name || ''}
            onClose={() => setIsArchiveDialogOpen(false)}
            onConfirm={(reason) => archiveMutation.mutate(reason)}
            isSubmitting={archiveMutation.isPending}
          />
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
