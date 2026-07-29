import React from 'react';
import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/dashboard.module.css';

export default function EmptyState({ message = 'No results found', action }) {
  const navigate = useNavigate();
  return (
    <div className={styles.emptyState}>
      <ClipboardList size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: '#374151', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.4rem' }}>
        No evaluation results yet
      </p>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto 1.2rem' }}>
        {message}
      </p>
      {action && (
        <button
          onClick={() => navigate(action.href)}
          style={{
            padding: '0.5rem 1.2rem', background: '#2563eb', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
