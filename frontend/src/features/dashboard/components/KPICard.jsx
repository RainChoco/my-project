import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function KPICard({ title, value, subtitle, trend, badge, onClick, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeleton} style={{ height: '0.9rem', width: '60%', marginBottom: '0.75rem' }} />
        <div className={styles.skeleton} style={{ height: '2rem', width: '40%', marginBottom: '0.5rem' }} />
        <div className={styles.skeleton} style={{ height: '0.75rem', width: '80%' }} />
      </div>
    );
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
    <div
      className={styles.card}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={onClick ? 'Click to filter' : undefined}
    >
      <div className={styles.cardTitle}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div className={styles.cardValue}>{value ?? '—'}</div>
        {badge && (
          <span style={{
            padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem',
            fontWeight: 700, background: badge.bg, color: badge.color,
            border: `1px solid ${badge.border || badge.bg}`
          }}>
            {badge.label}
          </span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem' }}>{subtitle}</div>
      )}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.4rem', fontSize: '0.82rem', color: trendColor }}>
          <TrendIcon size={13} />
          <span>{trend.value}</span>
        </div>
      )}
      {onClick && (
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.5rem', letterSpacing: '0.02em' }}>
          Click to filter ↗
        </div>
      )}
    </div>
  );
}
