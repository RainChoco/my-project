import React from 'react';
import { Filter, Tags, Search, ShieldAlert, BarChart2, X } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function FilterBar({ filters, updateFilter, onReset }) {
  const hasActiveFilters = filters.status || filters.category || filters.riskLevel ||
    filters.supplierSearch || filters.pqmMin || filters.pqmMax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className={styles.filterBar}>
        {/* Supplier Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search supplier..."
            className={styles.input}
            style={{ paddingLeft: '32px', height: '40px', width: '100%', boxSizing: 'border-box' }}
            value={filters.supplierSearch}
            onChange={e => updateFilter('supplierSearch', e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <Filter size={16} />
          </div>
          <select
            className={styles.select}
            style={{ paddingLeft: '32px', height: '40px', minWidth: '160px' }}
            value={filters.status}
            onChange={e => updateFilter('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Evaluating">Evaluating</option>
            <option value="Awarded">Awarded</option>
          </select>
        </div>

        {/* Category filter */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <Tags size={16} />
          </div>
          <select
            className={styles.select}
            style={{ paddingLeft: '32px', height: '40px', minWidth: '160px' }}
            value={filters.category}
            onChange={e => updateFilter('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Landscaping">Landscaping</option>
            <option value="Electrical">Electrical</option>
            <option value="IT">IT</option>
          </select>
        </div>

        {/* Risk filter */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            <ShieldAlert size={16} />
          </div>
          <select
            className={styles.select}
            style={{ paddingLeft: '32px', height: '40px', minWidth: '140px' }}
            value={filters.riskLevel}
            onChange={e => updateFilter('riskLevel', e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟠 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>

        {/* PQM Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BarChart2 size={16} color="#6b7280" />
          <span style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>PQM:</span>
          <input
            type="number"
            placeholder="Min"
            className={styles.input}
            style={{ width: '70px', height: '40px', textAlign: 'center' }}
            value={filters.pqmMin}
            min={0} max={100}
            onChange={e => updateFilter('pqmMin', e.target.value)}
          />
          <span style={{ color: '#9ca3af' }}>–</span>
          <input
            type="number"
            placeholder="Max"
            className={styles.input}
            style={{ width: '70px', height: '40px', textAlign: 'center' }}
            value={filters.pqmMax}
            min={0} max={100}
            onChange={e => updateFilter('pqmMax', e.target.value)}
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0 0.75rem', height: '40px', background: '#fee2e2',
              color: '#b91c1c', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
            }}
          >
            <X size={14} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
