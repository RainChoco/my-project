import React from 'react';
import { ArrowUp, ArrowDown, Eye, FileText, ClipboardCheck, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/dashboard.module.css';
import EmptyState from './EmptyState';

function getRankDisplay(rank) {
  if (rank === 1) return { emoji: '🥇', color: '#b45309', bg: '#fef08a', border: '#fde047' }; // Gold
  if (rank === 2) return { emoji: '🥈', color: '#334155', bg: '#f1f5f9', border: '#e2e8f0' }; // Silver
  if (rank === 3) return { emoji: '🥉', color: '#92400e', bg: '#ffedd5', border: '#fed7aa' }; // Bronze
  return { emoji: null, color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' };
}

function getPQMBadge(score) {
  if (score == null) return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Pending Evaluation', icon: '🟡' };
  if (score >= 90)   return { bg: '#dcfce7', color: '#166534', border: '#86efac', label: score.toFixed(1) };
  if (score >= 80)   return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: score.toFixed(1) };
  if (score >= 70)   return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: score.toFixed(1) };
  return             { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: score.toFixed(1) };
}

function getRiskPill(level) {
  if (!level) {
    return (
      <span style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        ⚪ Not Calculated
      </span>
    );
  }
  const map = {
    High:   { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '🔴' },
    Medium: { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa', icon: '🟠' },
    Low:    { bg: '#dcfce7', color: '#166534', border: '#86efac', icon: '🟢' },
  };
  const key = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  const s = map[key] || map.Low;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {s.icon} {key}
    </span>
  );
}

function getStatusPill(status) {
  const map = {
    draft:            { bg: '#f1f5f9', color: '#64748b' },
    submitted:        { bg: '#e0e7ff', color: '#4338ca' },
    under_evaluation: { bg: '#fefce8', color: '#854d0e' },
    Evaluating:       { bg: '#fefce8', color: '#854d0e' },
    approved:         { bg: '#f0fdf4', color: '#166534' },
    Awarded:          { bg: '#fce7f3', color: '#be185d' },
    rejected:         { bg: '#fee2e2', color: '#b91c1c' },
    withdrawn:        { bg: '#f9fafb', color: '#6b7280' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' };
  const label = status ? status.replace(/_/g, ' ') : '—';
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', textTransform: 'capitalize' }}>
      {label}
    </span>
  );
}

export default function RankingTable({ data, filters, updateFilter, onArchiveClick }) {
  const navigate = useNavigate();

  const handleSort = (field) => {
    if (filters.sortBy === field) {
      updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      updateFilter('sortBy', field);
      updateFilter('sortOrder', 'desc');
    }
  };

  const renderSortIcon = (field) => {
    if (filters.sortBy !== field) return <span style={{ color: '#d1d5db', marginLeft: '2px' }}>↕</span>;
    return filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  const TH = ({ field, children, style }) => (
    <th
      className={styles.th}
      onClick={() => handleSort(field)}
      tabIndex={0}
      style={{ ...style, whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {children} {renderSortIcon(field)}
      </span>
    </th>
  );

  const pendingCount = (data || []).filter(r => r.pqmScore == null).length;


  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <TH field="rank" style={{ width: '70px' }}>Rank</TH>
            <TH field="tenderId">Tender ID</TH>
            <TH field="supplierName">Supplier</TH>
            <TH field="category">Category</TH>
            <TH field="status">Status</TH>
            <TH field="pqmScore">PQM Score</TH>
            <TH field="riskLevel">Risk</TH>
            <th className={styles.th} style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!data || data.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ padding: '4rem 0' }}>
                <EmptyState
                  pendingCount={pendingCount}
                  message="No supplier submissions match the selected filters."
                  action={{ label: 'Go to Evaluations', href: '/evaluations' }}
                />
              </td>
            </tr>
          ) : data.map((row) => {
            const rankStyle = getRankDisplay(row.rank);
            const pqmBadge  = getPQMBadge(row.pqmScore);
            return (
              <tr key={row.tenderId} className={styles.tr}>
                {/* Rank */}
                <td className={styles.td}>
                  <span style={{
                    background: rankStyle.bg, color: rankStyle.color, border: `1px solid ${rankStyle.border}`,
                    padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    {rankStyle.emoji ? rankStyle.emoji : `#${row.rank}`}
                  </span>
                </td>
                {/* Tender Ref */}
                <td className={styles.td}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    {row.tenderRefNo || `#${row.tenderId}`}
                  </span>
                </td>
                {/* Supplier */}
                <td className={styles.td} style={{ fontWeight: 600, color: '#111827' }}>
                  {row.supplierName}
                </td>
                {/* Category */}
                <td className={styles.td} style={{ color: '#4b5563' }}>{row.category}</td>
                {/* Status */}
                <td className={styles.td}>{getStatusPill(row.status)}</td>
                {/* PQM Score */}
                <td className={styles.td}>
                  <span style={{
                    background: pqmBadge.bg, color: pqmBadge.color, border: `1px solid ${pqmBadge.border}`,
                    padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    {pqmBadge.icon && <span>{pqmBadge.icon}</span>} {pqmBadge.label}
                  </span>
                </td>
                {/* Risk */}
                <td className={styles.td}>{getRiskPill(row.riskLevel)}</td>
                {/* Actions */}
                <td className={styles.td}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button
                      title="View Tender"
                      onClick={() => navigate(`/tenders/${row.tenderId}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', background: '#eff6ff', color: '#1d4ed8',
                        border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      title="Evaluate"
                      onClick={() => navigate(`/evaluations?tenderId=${row.tenderId}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', background: '#f0fdf4', color: '#166534',
                        border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}
                    >
                      <ClipboardCheck size={16} />
                    </button>
                    <button
                      title="Documents"
                      onClick={() => navigate(`/tenders/${row.tenderId}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', background: '#f3f4f6', color: '#4b5563',
                        border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}
                    >
                      <FileCheck size={16} />
                    </button>
                    {onArchiveClick && (
                      <button
                        title="Archive"
                        className={styles.btnPrimary}
                        onClick={() => onArchiveClick(row.tenderId)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 0.6rem', height: '32px', borderRadius: '6px', cursor: 'pointer'
                        }}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
