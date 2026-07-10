import React from 'react';
import { SearchX } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

export default function EmptyState({ message = "No results found" }) {
  return (
    <div className={styles.emptyState}>
      <SearchX size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: '#6b7280' }}>{message}</p>
    </div>
  );
}
