import React from 'react';
import { Filter, Tags } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function FilterBar({ filters, updateFilter }) {
  return (
    <div className={styles.filterBar}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
          <Filter size={16} />
        </div>
        <select 
          className={styles.select} 
          style={{ paddingLeft: '32px', height: '40px', minWidth: '180px' }}
          value={filters.status} 
          onChange={e => updateFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Evaluating">Evaluating</option>
          <option value="Awarded">Awarded</option>
        </select>
      </div>
      
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
          <Tags size={16} />
        </div>
        <select 
          className={styles.select} 
          style={{ paddingLeft: '32px', height: '40px', minWidth: '180px' }}
          value={filters.category} 
          onChange={e => updateFilter('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Landscaping">Landscaping</option>
        </select>
      </div>
    </div>
  );
}
