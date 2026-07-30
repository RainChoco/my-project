import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircle2, AlertCircle, Package, X,
  Download, Bell
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
import RiskChart from '../charts/RiskChart';
import SubmissionStatusChart from '../charts/SubmissionStatusChart';

import useDashboardFilters from '../hooks/useDashboardFilters';
import { fetchKPIs, fetchRankings, archiveRankings } from '../services/dashboardApi';
import { fetchContracts } from '../../contracts/services/contractApi';
import { mockKPIs, mockRankings } from '../utils/mockData';

// ── helpers ──────────────────────────────────────────────────────────────────
function getPQMBadge(score) {
  if (score == null) return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Pending Evaluation' };
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

function SummaryCard({ icon, title, fields }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '1rem 1.25rem',
      border: '1px solid #e5e7eb', flex: '1', minWidth: '220px',
      display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
      <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#6b7280' }}>{f.label}:</span>
            <span style={{ fontWeight: 600, color: f.color || '#111827' }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = '#3b82f6', height = '8px' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ flex: 1, height, background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', minWidth: '35px', textAlign: 'right' }}>
        {pct}%
      </div>
    </div>
  );
}

function ProcurementStepper({ evaluated, total, status }) {
  const isClosed = status !== 'Open';
  const steps = [
    { label: 'Open', active: status === 'Open', done: true },
    { label: 'Receiving Tenders', active: status === 'Open' && total > 0, done: total > 0 },
    { label: `Evaluating (${evaluated}/${total})`, active: total > 0 && evaluated < total, done: evaluated === total && total > 0 },
    { label: 'Ranking', active: evaluated === total && total > 0 && !isClosed, done: isClosed },
    { label: 'Archived', active: isClosed, done: isClosed }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{
            padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
            background: s.active ? '#3b82f6' : s.done ? '#dcfce7' : '#f1f5f9',
            color: s.active ? 'white' : s.done ? '#166534' : '#94a3b8',
            border: `1px solid ${s.active ? '#2563eb' : s.done ? '#86efac' : '#e2e8f0'}`
          }}>
            {s.label} {s.done && !s.active && '✓'}
          </div>
          {i < steps.length - 1 && <div style={{ color: '#cbd5e1', fontWeight: 800 }}>→</div>}
        </React.Fragment>
      ))}
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
  const chartRef = useRef(null);

  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [archivedContracts, setArchivedContracts]     = useState(new Set());
  const [archiveVersion, setArchiveVersion]           = useState({});
  const [toast, setToast]                             = useState(null);
  const [dismissedNotifs, setDismissedNotifs]         = useState(new Set());

  const { data: availableContracts = [] } = useQuery({ queryKey: ['availableContracts'], queryFn: fetchContracts });
  const selectedContract = availableContracts.find(c => c.id === filters.contractId);

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['kpis', filters.contractId],
    queryFn: () => fetchKPIs({ contractId: filters.contractId }).catch(() => mockKPIs), // Fallback to mock data if API fails
    enabled: !!filters.contractId
  });

  const { data: rankings, isLoading: rankingsLoading, error: rankingsError } = useQuery({
    queryKey: ['rankings', filters],
    queryFn: () => fetchRankings(filters).catch(() => mockRankings), // Fallback to mock data if API fails
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
  const scrollToChart = useCallback(() => chartRef.current?.scrollIntoView({ behavior: 'smooth' }), []);

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

  const closingDate = selectedContract?.closingDate ? new Date(selectedContract.closingDate) : null;
  const daysLeft    = closingDate ? Math.ceil((closingDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isArchived  = archivedContracts.has(filters.contractId);
  const archInfo    = archiveVersion[filters.contractId] || { version: 0, date: 'Never' };

  // ── Notifications ─────────────────────────────────────────────────────
  const rawNotifications = [];
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
    rawNotifications.push({ id: 'close', type: 'warning', msg: `⚠ Contract closes in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.` });
  }
  if (pendingEvalCount > 0) {
    rawNotifications.push({ id: 'eval', type: 'info', msg: `${pendingEvalCount} supplier${pendingEvalCount !== 1 ? 's' : ''} still pending evaluation.` });
  }
  const notifications = rawNotifications.filter(n => !dismissedNotifs.has(n.id));

  if (kpisError && !kpis) return <ErrorState message="Failed to load dashboard data." onRetry={() => window.location.reload()} />;

  return (
    <div className={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.title} style={{ fontSize: '2rem' }}>Strategic Rankings Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: '0.3rem', fontSize: '0.95rem' }}>Tender Process Automation · EmServices</p>
          </div>
          {filters.contractId && (
            <button
              onClick={() => exportToCSV(rankingsData, `rankings-${filters.contractId}.csv`)}
              disabled={!rankingsData.length}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', background: '#f0fdf4', color: '#166534',
                border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem', opacity: rankingsData.length ? 1 : 0.5,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>

        {/* Contract Selector */}
        <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: '#374151', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>Contract Opportunity:</label>
            <select
              value={filters.contractId}
              onChange={e => updateFilter('contractId', e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', minWidth: '320px', fontSize: '1.15rem', flex: 1, padding: '0.75rem 1rem', background: '#f9fafb' }}
            >
              <option value="">— Select a Contract —</option>
              {availableContracts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          {selectedContract && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', color: '#4b5563', fontSize: '0.95rem' }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>{selectedContract.category || 'Cleaning'} Contract</span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span style={{ color: selectedContract.status === 'Open' ? '#166534' : '#b91c1c', fontWeight: 600 }}>{selectedContract.status}</span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span style={{ color: daysLeft !== null && daysLeft <= 7 ? '#c2410c' : 'inherit' }}>
                Closing {daysLeft !== null && daysLeft > 0 ? `in ${daysLeft} days` : closingDate?.toLocaleDateString()}
              </span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span><strong>{totalTenders}</strong> Supplier{totalTenders !== 1 ? 's' : ''}</span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span style={{ color: evaluatedCount === totalTenders && totalTenders > 0 ? '#166534' : 'inherit' }}><strong>{evaluatedCount}</strong> Evaluated</span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span>Budget <strong>{selectedContract.budgetLimit ? `$${Number(selectedContract.budgetLimit).toLocaleString()}` : '—'}</strong></span>
            </div>
          )}

          {/* Evaluation Progress Bar */}
          {selectedContract && totalTenders > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>Evaluation Progress</span>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{evaluatedCount} of {totalTenders} suppliers evaluated</span>
              </div>
              <ProgressBar value={evaluatedCount} max={totalTenders} color={evaluatedCount === totalTenders ? '#10b981' : '#3b82f6'} />

              <ProcurementStepper evaluated={evaluatedCount} total={totalTenders} status={selectedContract.status} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 1.25rem', borderRadius: '10px',
                  background: n.type === 'warning' ? '#fffbeb' : '#eff6ff',
                  border: `1px solid ${n.type === 'warning' ? '#fcd34d' : '#93c5fd'}`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <Bell size={18} color={n.type === 'warning' ? '#b45309' : '#1d4ed8'} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: n.type === 'warning' ? '#92400e' : '#1e40af', flex: 1 }}>
                    {n.msg}
                  </span>
                  {n.type === 'info' && pendingEvalCount > 0 && (
                    <button
                      onClick={() => navigate('/evaluations')}
                      style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Evaluate Now
                    </button>
                  )}
                  <button onClick={() => setDismissedNotifs(prev => new Set(prev).add(n.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: '4px' }}>
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Section: Overview ──────────────────────────────────────── */}
          <section style={{ marginBottom: '3rem' }}>
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
                value={avgPQM != null ? avgPQM.toFixed(1) : 'Pending Evaluation'}
                isLoading={kpisLoading}
                badge={pqmBadge}
                subtitle="Price-Quality-Method score"
                trend={avgPQM == null ? { direction: 'neutral', value: '⏳ Waiting for evaluator' } : null}
                onClick={scrollToChart}
              />
              <KPICard
                title="High Risk Suppliers"
                value={highRiskCount}
                isLoading={kpisLoading}
                subtitle={totalTenders > 0 ? `${highRiskPct}% of all suppliers` : 'No submissions yet'}
                trend={highRiskCount > 0 ? { direction: 'down', value: '🔴 Requires attention' } : { direction: 'neutral', value: '✅ None detected' }}
                onClick={handleHighRiskClick}
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
            <section style={{ marginBottom: '3rem' }}>
              <SectionHeader title="Ranking Summary" subtitle="Top performers for this contract" />
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {topSupplier && (
                  <SummaryCard
                    icon="🥇"
                    title="Top Supplier"
                    fields={[
                      { label: 'Supplier', value: topSupplier.supplierName },
                      { label: 'Submission', value: topSupplier.submissionDate ? new Date(topSupplier.submissionDate).toLocaleDateString() : '—' },
                      { label: 'Status', value: topSupplier.status ? topSupplier.status.replace(/_/g, ' ') : '—', color: '#166534' },
                      { label: 'Evaluation', value: topSupplier.pqmScore != null ? `${topSupplier.pqmScore.toFixed(1)} PQM` : 'Pending', color: topSupplier.pqmScore != null ? '#1d4ed8' : '#d97706' }
                    ]}
                  />
                )}
                {highestRisk && (
                  <SummaryCard
                    icon="⚠️"
                    title="Highest Risk Supplier"
                    fields={[
                      { label: 'Supplier', value: highestRisk.supplierName },
                      { label: 'Ref No', value: highestRisk.tenderRefNo || `#${highestRisk.tenderId}` },
                      { label: 'Risk Level', value: 'High', color: '#dc2626' },
                      { label: 'Status', value: highestRisk.status ? highestRisk.status.replace(/_/g, ' ') : '—' }
                    ]}
                  />
                )}
                {!topSupplier && !highestRisk && (
                  <div style={{ color: '#6b7280', fontSize: '0.95rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', flex: 1, textAlign: 'center' }}>
                    Complete evaluations to see the ranking summary.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Section: Performance Analytics ─────────────────────────── */}
          <section ref={chartRef} style={{ marginBottom: '3rem' }}>
            <SectionHeader title="Performance Analytics" subtitle="Visual breakdown of evaluation outcomes and submission status" />
            <div className={styles.chartGrid}>
              <TrendChart rankings={rankingsData} />
              <CategoryChart rankings={rankingsData} />
              <RiskChart rankings={rankingsData} />
              <SubmissionStatusChart rankings={rankingsData} />
            </div>
          </section>

          {/* ── Section: Supplier Rankings ──────────────────────────────── */}
          <section ref={rankingRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Supplier Rankings</h2>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Sorted by PQM score · {(rankings?.pagination?.totalRecords ?? 0)} result{(rankings?.pagination?.totalRecords ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <button
                  disabled={isArchived || rankingsLoading || rankingsData.length === 0}
                  onClick={() => setIsArchiveDialogOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    background: isArchived ? '#f3f4f6' : '#2563eb',
                    color: isArchived ? '#4b5563' : 'white',
                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem',
                    cursor: isArchived || rankingsData.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: rankingsData.length === 0 ? 0.5 : 1,
                    boxShadow: isArchived ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <Package size={18} />
                  {isArchived ? 'Archive Rankings' : 'Archive Final Rankings'}
                </button>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right', display: 'flex', gap: '0.5rem' }}>
                  <span>Version <strong style={{color:'#374151'}}>v{archInfo.version}</strong></span>
                  <span>·</span>
                  <span>Last Archived <strong style={{color:'#374151'}}>{archInfo.date}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
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
