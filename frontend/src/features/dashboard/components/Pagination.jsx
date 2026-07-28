import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function Pagination({ pagination, updateFilter }) {
  if (!pagination) return null;
  const { page, totalPages, totalRecords } = pagination;

  const btnStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid #d1d5db',
    background: 'white',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const disabledStyle = {
    ...btnStyle,
    background: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed',
    border: '1px solid #e5e7eb'
  };

  return (
    <div className={styles.pagination} style={{ padding: '1.5rem', borderRadius: '0 0 12px 12px' }}>
      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total: {totalRecords} records</span>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          style={page <= 1 ? disabledStyle : btnStyle}
          disabled={page <= 1}
          onClick={() => updateFilter('page', page - 1)}
          onMouseOver={(e) => { if (page > 1) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; } }}
          onMouseOut={(e) => { if (page > 1) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; } }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>Page {page} of {totalPages || 1}</span>
        <button 
          style={page >= totalPages ? disabledStyle : btnStyle}
          disabled={page >= totalPages}
          onClick={() => updateFilter('page', page + 1)}
          onMouseOver={(e) => { if (page < totalPages) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; } }}
          onMouseOut={(e) => { if (page < totalPages) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; } }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
