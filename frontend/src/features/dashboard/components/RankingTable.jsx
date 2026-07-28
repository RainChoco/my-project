import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import styles from '../styles/dashboard.module.css';
import EmptyState from './EmptyState';

export default function RankingTable({ data, filters, updateFilter }) {
  const handleSort = (field) => {
    if (filters.sortBy === field) {
      updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      updateFilter('sortBy', field);
      updateFilter('sortOrder', 'desc');
    }
  };

  const renderSortIcon = (field) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const getRiskPill = (level) => {
    let bg = '#dcfce7'; let col = '#166534'; let icon = '🟢';
    if (level === 'High') { bg = '#fee2e2'; col = '#991b1b'; icon = '🔴'; }
    else if (level === 'Medium') { bg = '#fef3c7'; col = '#92400e'; icon = '🟡'; }
    return (
      <span style={{ background: bg, color: col, padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {icon} {level}
      </span>
    );
  };

  const getStatusPill = (status) => {
    let bg = '#e0e7ff'; let col = '#4338ca'; 
    if (status === 'Awarded') { bg = '#fce7f3'; col = '#be185d'; }
    if (status === 'Archived') { bg = '#f3f4f6'; col = '#6b7280'; }
    return (
      <span style={{ background: bg, color: col, padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem' }}>
        {status}
      </span>
    );
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th} onClick={() => handleSort('tenderId')} tabIndex={0}>Tender ID {renderSortIcon('tenderId')}</th>
            <th className={styles.th} onClick={() => handleSort('supplierName')} tabIndex={0}>Supplier {renderSortIcon('supplierName')}</th>
            <th className={styles.th} onClick={() => handleSort('category')} tabIndex={0}>Category {renderSortIcon('category')}</th>
            <th className={styles.th} onClick={() => handleSort('status')} tabIndex={0}>Status {renderSortIcon('status')}</th>
            <th className={styles.th} onClick={() => handleSort('pqmScore')} tabIndex={0}>PQM Score {renderSortIcon('pqmScore')}</th>
            <th className={styles.th} onClick={() => handleSort('riskLevel')} tabIndex={0}>Risk {renderSortIcon('riskLevel')}</th>
            <th className={styles.th} onClick={() => handleSort('rank')} tabIndex={0}>Rank {renderSortIcon('rank')}</th>
          </tr>
        </thead>
        <tbody>
          {!data || data.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ padding: '4rem 0' }}>
                <EmptyState message="No supplier submissions match the selected filters." />
              </td>
            </tr>
          ) : data.map((row) => (
            <tr key={row.tenderId} className={styles.tr}>
              <td className={styles.td}>{row.tenderId}</td>
              <td className={styles.td} style={{ fontWeight: 'bold', color: '#111827' }}>{row.supplierName}</td>
              <td className={styles.td} style={{ color: '#4b5563' }}>{row.category}</td>
              <td className={styles.td}>{getStatusPill(row.status)}</td>
              <td className={styles.td}>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {row.pqmScore.toFixed(1)}
                </span>
              </td>
              <td className={styles.td}>
                {getRiskPill(row.riskLevel)}
              </td>
              <td className={styles.td}>
                <span style={{ background: row.rank === 1 ? '#fef3c7' : '#f3f4f6', color: row.rank === 1 ? '#b45309' : '#4b5563', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  #{row.rank}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
