import React from 'react';
import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/dashboard.module.css';

export default function EmptyState({ message, action, pendingCount }) {
  const navigate = useNavigate();

  const body = pendingCount > 0
    ? `There ${pendingCount === 1 ? 'is' : 'are'} ${pendingCount} supplier${pendingCount !== 1 ? 's' : ''} waiting for evaluation.`
    : (message || 'Complete supplier evaluations to generate analytics.');

  return (
    <div className={styles.emptyState}>
      <ClipboardList size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: '#374151', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>
        {pendingCount > 0 ? 'No completed evaluations' : 'No evaluation results yet'}
      </p>
      <p style={{ color: '#6b7280', fontSize: '0.88rem', maxWidth: '320px', margin: '0 auto 1.2rem', lineHeight: 1.6 }}>
        {body}
      </p>
      {action && (
        <button
          onClick={() => navigate(action.href)}
          style={{
            padding: '0.5rem 1.25rem', background: '#2563eb', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
