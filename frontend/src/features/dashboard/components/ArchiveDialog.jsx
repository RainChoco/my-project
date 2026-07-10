import React, { useState } from 'react';
import styles from '../styles/dashboard.module.css';
import { Loader2 } from 'lucide-react';

export default function ArchiveDialog({ isOpen, onClose, onConfirm, tenderId, isSubmitting }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Confirm Archive</h3>
        <p style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          Are you sure you want to archive the current rankings for <strong>{tenderId}</strong>?
          This action will create an immutable snapshot.
        </p>
        <input 
          type="text" 
          placeholder="Optional Reason..." 
          className={styles.input} 
          style={{ width: '100%', boxSizing: 'border-box' }}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button 
            className={styles.btnDanger} 
            onClick={() => onConfirm(reason)} 
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {isSubmitting ? 'Archiving...' : 'Confirm Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
