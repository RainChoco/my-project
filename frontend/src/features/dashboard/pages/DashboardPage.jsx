import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircle2, AlertCircle, Package, Trophy, ShieldAlert,
  Star, Download, Clock, Bell
} from 'lucide-react';
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
import SubmissionStatusChart from '../charts/SubmissionStatusChart';

import useDashboardFilters from '../hooks/useDashboardFilters';
import { fetchKPIs, fetchRankings, archiveRankings } from '../services/dashboardApi';
import { fetchContracts } from '../../contracts/services/contractApi';

// ── helpers ──────────────────────────────────────────────────────────────────
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

function SummaryCard({ icon, label, value, sub, subColor, detail }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '1rem 1.25rem',
      border: '1px solid #e5e7eb', flex: '1', minWidth: '160px',
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
    }}>
      <div style={{ flexShrink: 0, fontSize: '1.5rem' }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || '—'}
        </div>
        {sub && <div style={{ fontSize: '0.75rem', color: subColor || '#6b7280', fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
        {detail && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>{detail}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = '#3b82f6' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
    </div>
  );
}

function exportToCSV(data, filename) {
  if (!data?.length) return;
  const headers = ['Rank', 'Tender ID', 'Supplier', 'Category', 'Status', 'PQM Score', 'Risk Level'];
  const rows = data.map(r => [r.rank, r.tenderRefNo, r.supplierName, r.category, r.status, r.pqmScore?.toFixed(1) ?? 'Pending', r.riskLevel ?? 'Pending']);
  const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.setAttribute('download', filename);
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { filters, updateFilter, resetFilters } = useDashboardFilters();
  const navigate = useNavigate();
  const rankingRef = useRef(null);

  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archivedContracts, setArchivedContracts]     = useState(new Set());
  const [archiveVersion, setArchiveVersion]           = useState({});
  const [toast, setToast]                             = useState(null);

  const { data: availableContracts = [] } = useQuery({ queryKey: ['availableContracts'], queryFn: fetchContracts });
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

  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };
  const scrollToRankings = useCallback(() => rankingRef.current?.scrollIntoView({ behavior: 'smooth' }), []);
  const handleHighRiskClick = useCallback(() => { updateFilter('riskLevel', 'High'); scrollToRankings(); }, [updateFilter, scrollToRankings]);

  // ── Derived values ────────────────────────────────────────────────────
  const rankingsData     = rankings?.data ?? [];
  const totalTenders     = kpis?.totalTenders ?? 0;
  const avgPQM           = kpis?.averagePQM;
  const highRiskCount    = kpis?.highRiskTenders ?? 0;
  const highRiskPct      = totalTenders > 0 ? Math.round((highRiskCount / totalTenders) * 100) : 0;
  const pqmBadge         = avgPQM != null ? getPQMBadge(avgPQM) : null;
  const evaluatedCount   = rankingsData.filter(r => r.pqmScore != null).length;
  const pendingEvalCount = rankingsData.filter(r => r.pqmScore == null).length;

  const topSupplier  = rankingsData.find(r => r.rank === 1);
  const highestRisk  = rankingsData.find(r => r.riskLevel && r.riskLevel.toLowerCase() === 'high');
  const categoryAvgs = {};
  rankingsData.forEach(r => {
    if (r.pqmScore != null) {
      if (!categoryAvgs[r.category]) categoryAvgs[r.category] = { total: 0, count: 0 };
      categoryAvgs[r.category].total += r.pqmScore;
      categoryAvgs[r.category].count += 1;
    }
  });
  const bestCategory = Object.entries(categoryAvgs).map(([cat, { total, count }]) => ({ cat, avg: total / count })).sort((a, b) => b.avg - a.avg)[0];

  const closingDate = selectedContract?.closingDate ? new Date(selectedContract.closingDate) : null;
  const daysLeft    = closingDate ? Math.ceil((closingDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isArchived  = archivedContracts.has(filters.contractId);
  const archInfo    = archiveVersion[filters.contractId];

  // ── Notifications ─────────────────────────────────────────────────────
  const notifications = [];
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
    notifications.push({ type: 'warning', msg: `⚠ Contract closes in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.` });
  }
  if (pendingEvalCount > 0) {
    notifications.push({ type: 'info', msg: `${pendingEvalCount} supplier${pendingEvalCount !== 1 ? 's' : ''} still pending evaluation.` });
  }

  if (kpisError && !kpis) return <ErrorState message="Failed to load dashboard data." onRetry={() => window.location.reload()} />;

  return (
    <div className={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.title}>Strategic Rankings Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: '0.3rem', fontSize: '0.9rem' }}>Tender Process Automation · EmServices</p>
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

        {/* Contract Selector */}
        <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>Contract Opportunity:</label>
            <select
              value={filters.contractId}
              onChange={e => updateFilter('contractId', e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '280px', fontSize: '0.95rem', flex: 1 }}
            >
              <option value="">— Select a Contract —</option>
              {availableContracts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          {/* Contract summary */}
          {selectedContract && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              {[
                { label: 'Category', value: selectedContract.category || '—' },
                { label: 'Status', value: selectedContract.status, color: selectedContract.status === 'Open' ? '#166534' : '#b91c1c' },
                { label: 'Budget', value: selectedContract.budgetLimit ? `$${Number(selectedContract.budgetLimit).toLocaleString()}` : '—' },
                { label: 'Closing', value: closingDate?.toLocaleDateString() || '—', color: daysLeft !== null && daysLeft <= 7 ? '#c2410c' : '#111827' },
                { label: 'Submissions', value: String(kpis?.totalTenders ?? '—'), color: '#2563eb' },
                { label: 'Evaluated', value: `${evaluatedCount} / ${totalTenders}`, color: evaluatedCount === totalTenders && totalTenders > 0 ? '#059669' : '#d97706' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>{label}</span>
                  <div style={{ fontWeight: 700, color: color || '#111827', fontSize: '0.9rem' }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Evaluation Progress Bar */}
          {selectedContract && totalTenders > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>Evaluation Progress</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{evaluatedCount} / {totalTenders} completed</span>
              </div>
              <ProgressBar value={evaluatedCount} max={totalTenders} color={evaluatedCount === totalTenders ? '#059669' : '#3b82f6'} />
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
          {/* ── Notifications ─────────────────────────────────────────── */}
          {notifications.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {notifications.map((n, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1.25rem', borderRadius: '10px',
                  background: n.type === 'warning' ? '#fffbeb' : '#eff6ff',
                  border: `1px solid ${n.type === 'warning' ? '#fcd34d' : '#93c5fd'}`
                }}>
                  <Bell size={16} color={n.type === 'warning' ? '#b45309' : '#1d4ed8'} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: n.type === 'warning' ? '#92400e' : '#1e40af' }}>
                    {n.msg}
                  </span>
                  {n.type === 'info' && pendingEvalCount > 0 && (
                    <button
                      onClick={() => navigate('/evaluations')}
                      style={{ marginLeft: 'auto', padding: '0.3rem 0.75rem', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}
                    >
                      Evaluate Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Section: Overview ──────────────────────────────────────── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="Overview" subtitle="Key performance indicators for this contract" />
            <div className={styles.grid}>
              <KPICard
                title="Total Supplier Submissions"
                value={kpis?.totalTenders ?? '—'}
                isLoading={kpisLoading}
                subtitle={totalTenders === 1 ? '1 submission received' : `${totalTenders} submissions received`}
                onClick={scrollToRankings}
              />
              <KPICard
                title="Average PQM Score"
                value={avgPQM != null ? avgPQM.toFixed(1) : 'Pending'}
                isLoading={kpisLoading}
                badge={pqmBadge}
                subtitle={avgPQM == null ? 'Waiting for evaluator' : 'Price-Quality-Method score'}
                trend={avgPQM == null ? { direction: 'neutral', value: '🟡 Pending Evaluation' } : null}
              />
              <KPICard
                title="High Risk Suppliers"
                value={highRiskCount}
                isLoading={kpisLoading}
                subtitle={totalTenders > 0
                  ? (highRiskCount === 0 ? '🟢 No high risk suppliers' : `${highRiskPct}% of all suppliers`)
                  : 'No submissions yet'}
                trend={highRiskCount > 0 ? { direction: 'down', value: '🔴 Requires attention' } : { direction: 'neutral', value: '🟢 All clear' }}
                onClick={highRiskCount > 0 ? handleHighRiskClick : undefined}
              />
              <KPICard
                title="Recent Submissions (7d)"
                value={kpis?.recentSubmissions ?? '—'}
                isLoading={kpisLoading}
                subtitle="Submitted in the past 7 days"
                trend={kpis?.recentSubmissions > 0
                  ? { direction: 'up',     value: '🔵 Active' }
                  : { direction: 'neutral', value: '— No new submissions' }}
              />
            </div>
          </section>

          {/* ── Section: Ranking Summary ────────────────────────────────── */}
          {rankingsData.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <SectionHeader title="Ranking Summary" subtitle="Top performers for this contract" />
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {topSupplier && (
                  <SummaryCard
                    icon="🥇"
                    label="Top Supplier"
                    value={topSupplier.supplierName}
                    sub={topSupplier.pqmScore != null ? `PQM ${topSupplier.pqmScore.toFixed(1)}` : 'PQM Pending'}
                    subColor={topSupplier.pqmScore != null ? '#b45309' : '#9ca3af'}
                    detail={topSupplier.status ? `Status: ${topSupplier.status.replace(/_/g, ' ')}` : undefined}
                  />
                )}
                {highestRisk && (
                  <SummaryCard
                    icon="⚠️"
                    label="Highest Risk Supplier"
                    value={highestRisk.supplierName}
                    sub="High Risk"
                    subColor="#dc2626"
                    detail={highestRisk.tenderRefNo}
                  />
                )}
                {bestCategory && (
                  <SummaryCard
                    icon="🏆"
                    label="Best Category"
                    value={bestCategory.cat}
                    sub={`Avg PQM ${bestCategory.avg.toFixed(1)}`}
                    subColor="#7c3aed"
                  />
                )}
                {!topSupplier && !highestRisk && (
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', flex: 1 }}>
                    Ranking summary will appear after evaluations are completed.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Section: Performance Analytics ─────────────────────────── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <SectionHeader title="Performance Analytics" subtitle="Visual breakdown of evaluation outcomes and submission status" />
            <div className={styles.chartGrid}>
              <TrendChart rankings={rankingsData} />
              <CategoryChart rankings={rankingsData} />
              <SubmissionStatusChart rankings={rankingsData} />
            </div>
          </section>

          {/* ── Section: Supplier Rankings ──────────────────────────────── */}
          <section ref={rankingRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>Supplier Rankings</h2>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
                  Sorted by PQM score · {(rankings?.pagination?.totalRecords ?? 0)} result{(rankings?.pagination?.totalRecords ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
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
                    opacity: rankingsData.length === 0 ? 0.5 : 1
                  }}
                >
                  <Package size={16} />
                  {isArchived ? '✓ Rankings Archived' : 'Archive Final Rankings'}
                </button>
                {archInfo && (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', textAlign: 'right' }}>
                    Version v{archInfo.version} · Last archived {archInfo.date}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <FilterBar filters={filters} updateFilter={updateFilter} onReset={resetFilters} />
            </div>

            {rankingsLoading ? (
              <LoadingSkeleton />
            ) : rankingsError && !rankings ? (
              <ErrorState message="Failed to load rankings." />
            ) : rankingsData.length === 0 ? (
              <EmptyState
                pendingCount={0}
                message="No supplier submissions match the selected filters."
                action={{ label: 'Go to Evaluations', href: '/evaluations' }}
              />
            ) : (
              <>
                <RankingTable data={rankingsData} filters={filters} updateFilter={updateFilter} />
                <Pagination pagination={rankings?.pagination} updateFilter={updateFilter} />
              </>
            )}
          </section>

          <ArchiveDialog
            isOpen={isArchiveDialogOpen}
            contractId={filters.contractId}
            contractName={selectedContract?.name || ''}
            onClose={() => setIsArchiveDialogOpen(false)}
            onConfirm={reason => archiveMutation.mutate(reason)}
            isSubmitting={archiveMutation.isPending}
          />
        </>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
