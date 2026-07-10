import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import styles from '../styles/dashboard.module.css';
import EmptyState from './EmptyState';

export default function RankingTable({ data, filters, updateFilter, onArchiveClick }) {
  if (!data || data.length === 0) return <EmptyState message="No rankings match your filters." />;

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

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th} onClick={() => handleSort('tenderId')} tabIndex={0}>Tender ID {renderSortIcon('tenderId')}</th>
            <th className={styles.th} onClick={() => handleSort('vendorName')} tabIndex={0}>Vendor {renderSortIcon('vendorName')}</th>
            <th className={styles.th} onClick={() => handleSort('pqmScore')} tabIndex={0}>PQM Score {renderSortIcon('pqmScore')}</th>
            <th className={styles.th} onClick={() => handleSort('riskLevel')} tabIndex={0}>Risk {renderSortIcon('riskLevel')}</th>
            <th className={styles.th} onClick={() => handleSort('rank')} tabIndex={0}>Rank {renderSortIcon('rank')}</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className={styles.td}>{row.tenderId}</td>
              <td className={styles.td}>{row.vendorName}</td>
              <td className={styles.td}><strong>{row.pqmScore.toFixed(1)}</strong></td>
              <td className={styles.td}>
                <span style={{ 
                  color: row.riskLevel === 'High' ? '#dc2626' : row.riskLevel === 'Medium' ? '#d97706' : '#059669',
                  fontWeight: 'bold'
                }}>
                  {row.riskLevel}
                </span>
              </td>
              <td className={styles.td}>#{row.rank}</td>
              <td className={styles.td}>
                <button className={styles.btnPrimary} onClick={() => onArchiveClick(row.tenderId)}>
                  Archive
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
