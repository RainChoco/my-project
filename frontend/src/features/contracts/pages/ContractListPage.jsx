import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContracts, deleteContract } from '../services/contractApi';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Filter, AlertTriangle, X } from 'lucide-react';

function DeleteConfirmModal({ contract, onConfirm, onCancel, isDeleting }) {
  if (!contract) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '2rem',
        width: '420px', maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'modalPop 0.18s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '0.6rem', display: 'flex' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>Delete Contract</h2>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem', display: 'flex', borderRadius: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: '#374151', marginBottom: '0.5rem', lineHeight: 1.6 }}>
          Are you sure you want to delete this contract?
        </p>
        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{contract.name}</div>
          <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {contract.id} &nbsp;Â·&nbsp; {contract.category} &nbsp;Â·&nbsp;
            <span style={{ color: '#ef4444', fontWeight: 600 }}>${parseFloat(contract.budgetLimit).toLocaleString()}</span>
          </div>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          This action <strong>cannot be undone</strong>. All data associated with this contract will be permanently removed.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={isDeleting}
            style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: isDeleting ? '#fca5a5' : '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '110px', justifyContent: 'center' }}>
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContractListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contractToDelete, setContractToDelete] = useState(null);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setContractToDelete(null);
    },
    onError: () => {
      setContractToDelete(null);
    }
  });

  const filteredContracts = contracts?.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  }) || [];

  const statusBadge = (status) => {
    const styles = {
      Open:       { background: '#dcfce7', color: '#166534' },
      Draft:      { background: '#f3f4f6', color: '#4b5563' },
      Evaluating: { background: '#fef9c3', color: '#854d0e' },
      Awarded:    { background: '#dbeafe', color: '#1e40af' },
    };
    const s = styles[status] || styles.Draft;
    return (
      <span style={{ ...s, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes modalPop { from { transform: scale(0.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

      <DeleteConfirmModal
        contract={contractToDelete}
        onConfirm={() => deleteMutation.mutate(contractToDelete.id)}
        onCancel={() => setContractToDelete(null)}
        isDeleting={deleteMutation.isPending}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Contract Opportunities</h1>
        <Link to="/contracts/new" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          <Plus size={20} /> Create Contract
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '1.15rem' }}
          />
        </div>
        <div style={{ position: 'relative', width: '200px' }}>
          <Filter size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', appearance: 'none', fontSize: '1.15rem', background: 'white' }}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Open">Open</option>
            <option value="Evaluating">Evaluating</option>
            <option value="Awarded">Awarded</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Contract ID</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Budget</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredContracts.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No contracts found.</td></tr>
            ) : filteredContracts.map(contract => (
              <tr key={contract.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{contract.id}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#111827' }}>{contract.name}</td>
                <td style={{ padding: '1rem', color: '#4b5563' }}>{contract.category}</td>
                <td style={{ padding: '1rem', color: '#4b5563' }}>${parseFloat(contract.budgetLimit).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>{statusBadge(contract.status)}</td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/contracts/${contract.id}`} style={{ padding: '0.5rem', color: '#2563eb', background: '#eff6ff', borderRadius: '6px', display: 'inline-flex' }} title="View detail">
                    <Search size={18} />
                  </Link>
                  <Link to={`/contracts/${contract.id}/edit`} style={{ padding: '0.5rem', color: '#4b5563', background: '#f3f4f6', borderRadius: '6px', display: 'inline-flex' }}>
                    <Edit2 size={18} />
                  </Link>
                  <button
                    onClick={() => setContractToDelete(contract)}
                    style={{ padding: '0.5rem', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


