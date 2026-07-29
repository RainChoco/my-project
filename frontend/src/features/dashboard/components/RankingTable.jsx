import React from 'react';
import { ArrowUp, ArrowDown, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/dashboard.module.css';
import EmptyState from './EmptyState';

function getRankDisplay(rank) {
  if (rank === 1) return { emoji: '🥇', color: '#b45309', bg: '#fef3c7' };
  if (rank === 2) return { emoji: '🥈', color: '#475569', bg: '#f1f5f9' };
  if (rank === 3) return { emoji: '🥉', color: '#92400e', bg: '#fef3c7' };
  return { emoji: null, color: '#4b5563', bg: '#f3f4f6' };
}

function getPQMBadge(score) {
  if (score == null) return { bg: '#f3f4f6', color: '#6b7280' };
  if (score >= 90) return { bg: '#dcfce7', color: '#166534' };
  if (score >= 80) return { bg: '#eff6ff', color: '#1d4ed8' };
  if (score >= 70) return { bg: '#fff7ed', color: '#c2410c' };
  return { bg: '#fee2e2', color: '#991b1b' };
}

function getRiskPill(level) {
  const map = {
    High:   { bg: '#fee2e2', color: '#991b1b', icon: '🔴' },
    Medium: { bg: '#fef3c7', color: '#92400e', icon: '🟠' },
    Low:    { bg: '#dcfce7', color: '#166534', icon: '🟢' },
  };
  const s = map[level] || map.Low;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {s.icon} {level || 'Low'}
    </span>
  );
}

function getStatusPill(status) {
  const map = {
    Evaluating: { bg: '#e0e7ff', color: '#4338ca' },
    Awarded:    { bg: '#fce7f3', color: '#be185d' },
    Archived:   { bg: '#f3f4f6', color: '#6b7280' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem' }}>
      {status}
    </span>
  );
}

export default function RankingTable({ data, filters, updateFilter }) {
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
            <th className={styles.th} style={{ whiteSpace: 'nowrap' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!data || data.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ padding: '4rem 0' }}>
                <EmptyState
                  message="No supplier submissions match the selected filters."
                  action={{ label: 'Go to Evaluations', href: '/evaluations' }}
                />
              </td>
            </tr>
          ) : data.map((row) => {
            const rankStyle = getRankDisplay(row.rank);
            const pqmStyle = getPQMBadge(row.pqmScore);
            return (
              <tr key={row.tenderId} className={styles.tr}>
                {/* Rank */}
                <td className={styles.td}>
                  <span style={{
                    background: rankStyle.bg, color: rankStyle.color,
                    padding: '4px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    {rankStyle.emoji ? rankStyle.emoji : `#${row.rank}`}
                  </span>
                </td>
                {/* Tender Ref */}
                <td className={styles.td}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#6b7280' }}>
                    {row.tenderRefNo}
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
                    background: pqmStyle.bg, color: pqmStyle.color,
                    padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem'
                  }}>
                    {row.pqmScore != null ? row.pqmScore.toFixed(1) : '—'}
                  </span>
                </td>
                {/* Risk */}
                <td className={styles.td}>{getRiskPill(row.riskLevel)}</td>
                {/* Actions */}
                <td className={styles.td}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      title="View Tender"
                      onClick={() => navigate(`/tenders/${row.tenderId}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8',
                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 500
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      title="View Evaluations"
                      onClick={() => navigate(`/evaluations?tenderId=${row.tenderId}`)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', background: '#f0fdf4', color: '#166534',
                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 500
                      }}
                    >
                      <FileText size={13} /> Eval
                    </button>
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
