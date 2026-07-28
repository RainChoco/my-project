import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContractById, createContract, updateContract } from '../services/contractApi';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Cleaning',
    description: '',
    budgetLimit: '',
    openingDate: '',
    closingDate: '',
    status: 'Draft'
  });

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id),
    enabled: isEditing
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name,
        category: contract.category,
        description: contract.description || '',
        budgetLimit: contract.budgetLimit,
        openingDate: contract.openingDate.split('T')[0],
        closingDate: contract.closingDate.split('T')[0],
        status: contract.status
      });
    }
  }, [contract]);

  const saveMutation = useMutation({
    mutationFn: (data) => isEditing ? updateContract(id, data) : createContract(data),
    onSuccess: () => {
      setToast('Contract saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setTimeout(() => navigate('/contracts'), 1500);
    },
    onError: () => {
      setErrors({ form: 'An error occurred while saving. Please try again.' });
    }
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Contract name is required.';
    if (!formData.budgetLimit || parseFloat(formData.budgetLimit) <= 0) {
      newErrors.budgetLimit = 'Budget Limit must be greater than SGD 0 (e.g. 500.00).';
    }
    if (formData.openingDate && formData.closingDate) {
      if (new Date(formData.openingDate) > new Date(formData.closingDate)) {
        newErrors.dates = 'Closing date must be after opening date.';
      }
    } else {
      newErrors.dates = 'Both opening and closing dates are required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  if (isEditing && isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <button onClick={() => navigate('/contracts')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem' }}>
        <ArrowLeft size={20} /> Back to Contracts
      </button>

      {toast && (
        <div style={{ padding: '1rem', marginBottom: '2rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 500 }}>{toast}</span>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#111827' }}>
          {isEditing ? 'Edit Contract' : 'Create New Contract Opportunity'}
        </h1>

        {errors.form && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 500 }}>{errors.form}</div>}

        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Contract Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Zone A Cleaning Services 2026"
                value={formData.name} 
                onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  if(errors.name) setErrors({...errors, name: null});
                }} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`, boxSizing: 'border-box' }} 
              />
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', background: 'white' }}
              >
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Landscaping">Landscaping</option>
                <option value="Lift Maintenance">Lift Maintenance</option>
                <option value="Pest Control">Pest Control</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Description</label>
            <textarea 
              placeholder="Routine cleaning services for residential blocks in Zone A..."
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Budget Limit (SGD) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 500 }}>$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={formData.budgetLimit} 
                  onChange={e => {
                    setFormData({...formData, budgetLimit: e.target.value});
                    if(errors.budgetLimit) setErrors({...errors, budgetLimit: null});
                  }} 
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 1.75rem', borderRadius: '6px', border: `1px solid ${errors.budgetLimit ? '#ef4444' : '#d1d5db'}`, boxSizing: 'border-box' }} 
                />
              </div>
              {errors.budgetLimit && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.budgetLimit}</span>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Opening Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="date" 
                value={formData.openingDate} 
                onChange={e => {
                  setFormData({...formData, openingDate: e.target.value});
                  if(errors.dates) setErrors({...errors, dates: null});
                }} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${errors.dates ? '#ef4444' : '#d1d5db'}`, boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Closing Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="date" 
                value={formData.closingDate} 
                onChange={e => {
                  setFormData({...formData, closingDate: e.target.value});
                  if(errors.dates) setErrors({...errors, dates: null});
                }} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${errors.dates ? '#ef4444' : '#d1d5db'}`, boxSizing: 'border-box' }} 
              />
            </div>
          </div>
          {errors.dates && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '-1rem', display: 'block' }}>{errors.dates}</span>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})} 
                disabled={!isEditing}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', background: !isEditing ? '#f3f4f6' : 'white', color: !isEditing ? '#6b7280' : '#111827' }}
              >
                <option value="Draft">Draft</option>
                <option value="Open">Open</option>
                <option value="Evaluating">Evaluating</option>
                <option value="Awarded">Awarded</option>
              </select>
              {!isEditing && <span style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>New contracts start as Drafts.</span>}
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => navigate('/contracts')} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saveMutation.isPending || !!toast} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: (saveMutation.isPending || !!toast) ? 0.7 : 1 }}>
              {saveMutation.isPending ? 'Saving...' : 'Save Contract'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


