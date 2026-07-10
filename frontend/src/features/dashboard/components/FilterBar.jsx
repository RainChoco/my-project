import React from 'react';
import styles from '../styles/dashboard.module.css';

export default function FilterBar({ filters, updateFilter }) {
  return (
    <div className={styles.filterBar}>
      <select 
        className={styles.select} 
        value={filters.status} 
        onChange={e => updateFilter('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="Evaluating">Evaluating</option>
        <option value="Awarded">Awarded</option>
      </select>
      
      <select 
        className={styles.select} 
        value={filters.category} 
        onChange={e => updateFilter('category', e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="Cleaning">Cleaning</option>
        <option value="Maintenance">Maintenance</option>
        <option value="Landscaping">Landscaping</option>
      </select>
    </div>
  );
}
