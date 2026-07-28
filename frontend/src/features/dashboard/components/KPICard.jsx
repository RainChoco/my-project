import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

/**
 * KPICard — displays a single KPI metric.
 * `trend` is optional: { value: string, direction: 'up'|'down'|'neutral' }
 * When not provided, no trend indicator is shown (avoids hardcoded fake data).
 */
export default function KPICard({ title, value, isLoading, trend }) {
  if (isLoading) {
    return <div className={`${styles.card} ${styles.skeleton}`} style={{ height: '100px' }} />;
  }

  const trendColor = {
    up:      '#059669',
    down:    '#dc2626',
    neutral: '#94a3b8'
  }[trend?.direction ?? 'neutral'];

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus;

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardValue}>{value ?? '—'}</div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem', color: trendColor }}>
          <TrendIcon size={14} />
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
