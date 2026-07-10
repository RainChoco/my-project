import React from 'react';
import styles from '../styles/dashboard.module.css';

export default function KPICard({ title, value, isLoading }) {
  if (isLoading) {
    return <div className={`${styles.card} ${styles.skeleton}`} style={{ height: '100px' }} />;
  }
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  );
}
