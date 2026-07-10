import React from 'react';
import styles from '../styles/dashboard.module.css';

export default function LoadingSkeleton() {
  return (
    <div className={styles.tableWrapper}>
      <div style={{ padding: '1rem' }}>
        <div className={styles.skeleton} style={{ height: '40px', marginBottom: '1rem' }} />
        <div className={styles.skeleton} style={{ height: '40px', marginBottom: '1rem' }} />
        <div className={styles.skeleton} style={{ height: '40px', marginBottom: '1rem' }} />
        <div className={styles.skeleton} style={{ height: '40px' }} />
      </div>
    </div>
  );
}
