import React from 'react';
import { AlertCircle } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className={styles.errorState}>
      <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{message}</p>
      {onRetry && (
        <button className={styles.btn} onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}
