import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchContractById, fetchContractTenders } from '../services/contractApi';
import {
  ArrowLeft, Building2, Calendar, DollarSign, Tag, Info, FileText, TrendingUp, AlertTriangle, Eye
} from 'lucide-react';

// ── Status badge helpers ───────────────────────────────────────────────────
const STATUS_COLORS = {
  Draft:     { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  Open:      { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  Closed:    { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  Archived:  { bg: '#faf5ff', color: '#7c3aed', border: '#c4b5fd' },
  Cancelled: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.Draft;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '20px', padding: '0.25rem 0.75rem',
      fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em'
    }}>
      {status}
    </span>
  );
}

const TENDER_STATUS_COLORS = {
  draft:            { bg: '#f1f5f9', color: '#64748b' },
  submitted:        { bg: '#eff6ff', color: '#1d4ed8' },
  under_evaluation: { bg: '#fefce8', color: '#854d0e' },
  approved:         { bg: '#f0fdf4', color: '#166534' },
  rejected:         { bg: '#fef2f2', color: '#b91c1c' },
  withdrawn:        { bg: '#f9fafb', color: '#6b7280' },
};

function TenderStatusBadge({ status }) {
  const s = TENDER_STATUS_COLORS[status] ?? TENDER_STATUS_COLORS.draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: '6px', padding: '0.15rem 0.55rem',
      fontSize: '0.76rem', fontWeight: 600
    }}>
      {status?.replace(/_/g, ' ') ?? '—'}
    </span>
  );
}

function InfoField({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{
        background: '#eff6ff', borderRadius: '8px', padding: '0.5rem',
        display: 'flex', flexShrink: 0
      }}>
        <Icon size={16} color="#3b82f6" />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>{value ?? '—'}</div>
      </div>
    </div>
  );
}

function RiskBadge({ risk }) {
  if (!risk) return <span style={{ color: '#9ca3af' }}>—</span>;
  const colors = {
    low:    { bg: '#f0fdf4', color: '#166534' },
    medium: { bg: '#fefce8', color: '#854d0e' },
    high:   { bg: '#fef2f2', color: '#b91c1c' },
  };
  const s = colors[risk?.toLowerCase()] ?? colors.medium;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: '6px',
      padding: '0.15rem 0.55rem', fontSize: '0.76rem', fontWeight: 600
    }}>
      {risk}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: contract,
    isLoading: contractLoading,
    isError: contractError,
  } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id),
  });

  const { data: tenders = [], isLoading: tendersLoading } = useQuery({
    queryKey: ['contract-tenders', id],
    queryFn: () => fetchContractTenders(id),
    enabled: !!contract,
  });

  if (contractLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            height: i === 1 ? '120px' : '200px',
            background: '#f1f5f9', borderRadius: '12px', animation: 'pulse 1.5s infinite'
          }} />
        ))}
      </div>
    );
  }

  if (contractError || !contract) {
    return (
      <div style={{
        background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px',
        padding: '2rem', textAlign: 'center', color: '#b91c1c'
      }}>
        <AlertTriangle size={32} style={{ margin: '0 auto 1rem' }} />
        <p style={{ fontWeight: 700 }}>Contract not found</p>
        <button onClick={() => navigate('/contracts')} style={{
          marginTop: '1rem', background: '#ef4444', color: 'white', border: 'none',
          borderRadius: '8px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600
        }}>
          Back to Contracts
        </button>
      </div>
    );
  }

  const closingDate = contract.closingDate ? new Date(contract.closingDate) : null;
  const openingDate = contract.openingDate ? new Date(contract.openingDate) : null;
  const isPastDeadline = closingDate && closingDate < new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Header ── */}
      <div>
        <button
          onClick={() => navigate('/contracts')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: '#6b7280', fontSize: '0.85rem', padding: 0, marginBottom: '0.75rem'
          }}
        >
          <ArrowLeft size={14} /> Back to Contracts
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>{contract.name}</h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>{contract.id}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <StatusBadge status={contract.status} />
            <button
              onClick={() => navigate(`/contracts/${id}/edit`)}
              style={{
                background: '#3b82f6', color: 'white', border: 'none',
                borderRadius: '8px', padding: '0.55rem 1.1rem', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem'
              }}
            >
              Edit Contract
            </button>
          </div>
        </div>
      </div>

      {isPastDeadline && contract.status !== 'Archived' && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px',
          padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <AlertTriangle size={18} color="#b45309" />
          <span style={{ color: '#92400e', fontWeight: 600, fontSize: '0.875rem' }}>
            This contract's closing date has passed ({closingDate.toLocaleDateString()}). Consider updating its status.
          </span>
        </div>
      )}

      {/* ── Contract Details ── */}
      <div style={{
        background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb',
        padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem' }}>
          Contract Details
        </h2>
        {contract.description && (
          <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>
            {contract.description}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <InfoField icon={Tag} label="Category" value={contract.category} />
          <InfoField icon={DollarSign} label="Budget Limit" value={`$${parseFloat(contract.budgetLimit).toLocaleString()}`} />
          <InfoField icon={Calendar} label="Opening Date" value={openingDate?.toLocaleDateString()} />
          <InfoField icon={Calendar} label="Closing Date" value={closingDate?.toLocaleDateString()} />
          <InfoField icon={Building2} label="Status" value={contract.status} />
        </div>
      </div>

      {/* ── Submitted Tenders ── */}
      <div style={{
        background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb',
        padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Submitted Tenders</h2>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
              {tenders.length} tender(s) linked to this contract
            </p>
          </div>
          <button
            onClick={() => navigate('/tenders/new')}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <FileText size={14} /> New Tender
          </button>
        </div>

        {tendersLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Loading tenders…</div>
        ) : tenders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            background: '#f9fafb', borderRadius: '10px', border: '1px dashed #d1d5db'
          }}>
            <FileText size={32} color="#d1d5db" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#9ca3af', fontWeight: 500 }}>No tenders submitted yet for this contract.</p>
            <button
              onClick={() => navigate('/tenders/new')}
              style={{
                marginTop: '1rem', background: '#3b82f6', color: 'white', border: 'none',
                borderRadius: '8px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600
              }}
            >
              Submit First Tender
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Ref No.', 'Supplier / Vendor', 'Submission Date', 'Status', 'PQM Score', 'Risk', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '0.6rem 0.75rem', textAlign: 'left',
                      color: '#6b7280', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenders.map((t) => {
                  const latestEval = t.evaluations?.[0];
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#1e3a5f' }}>{t.tender_ref_no}</td>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>{t.vendor_name}</td>
                      <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                        {t.submission_date ? new Date(t.submission_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}><TenderStatusBadge status={t.status} /></td>
                      <td style={{ padding: '0.75rem', color: '#374151', fontWeight: 600 }}>
                        {latestEval?.pqm_score != null ? latestEval.pqm_score.toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}><RiskBadge risk={latestEval?.risk_level} /></td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => navigate(`/tenders/${t.id}`)}
                          style={{
                            background: '#f1f5f9', border: 'none', borderRadius: '6px',
                            padding: '0.35rem 0.7rem', cursor: 'pointer', color: '#374151',
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontWeight: 600, fontSize: '0.8rem'
                          }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
