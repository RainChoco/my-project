import React, { useState } from 'react';
import styles from '../styles/dashboard.module.css';
import { Loader2, Archive, X } from 'lucide-react';

export default function ArchiveDialog({ isOpen, onClose, onConfirm, contractId, contractName, isSubmitting }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#e0f2fe', padding: '0.5rem', borderRadius: '50%', color: '#0ea5e9' }}>
              <Archive size={20} />
            </div>
            <h3 className={styles.title} style={{ fontSize: '1.2rem', margin: 0 }}>Archive Final Rankings</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: '#4b5563', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Are you sure you want to archive the finalized ranking list for <strong style={{ color: '#111827' }}>{contractName} ({contractId})</strong>?
            This action will create an immutable snapshot that cannot be modified.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Reason for Archiving (Optional)</label>
            <textarea 
              placeholder="e.g. Final board approval received on..." 
              className={styles.input} 
              style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalActions} style={{ padding: '1.25rem 1.5rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', margin: 0 }}>
          <button 
            className={styles.btnSecondary} 
            onClick={onClose} 
            disabled={isSubmitting}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 500, border: '1px solid #d1d5db', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            className={styles.btnArchive} 
            onClick={() => onConfirm(reason)} 
            disabled={isSubmitting}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {isSubmitting ? 'Archiving...' : 'Confirm Archive'}
          </button>
        </div>

      </div>
    </div>
  );
}
