import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function Pagination({ pagination, updateFilter }) {
  if (!pagination) return null;
  const { page, totalPages, totalRecords } = pagination;

  return (
    <div className={styles.pagination}>
      <span style={{ color: '#6b7280' }}>Total: {totalRecords} records</span>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className={styles.btnSecondary} 
          disabled={page <= 1}
          onClick={() => updateFilter('page', page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>Page {page} of {totalPages || 1}</span>
        <button 
          className={styles.btnSecondary} 
          disabled={page >= totalPages}
          onClick={() => updateFilter('page', page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
