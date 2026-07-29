import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchContractById, fetchContractTenders } from '../services/contractApi';
import {
  ArrowLeft, Building2, Calendar, DollarSign, Tag, FileText,
  AlertTriangle, Eye, ClipboardCheck, Users, CheckCircle2,
  Clock, TrendingUp, Package
} from 'lucide-react';

// ── Status helpers ───────────────────────────────────────────────────────────
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
      borderRadius: '6px', padding: '0.2rem 0.6rem',
      fontSize: '0.76rem', fontWeight: 600, textTransform: 'capitalize'
    }}>
      {status?.replace(/_/g, ' ') ?? '—'}
    </span>
  );
}

function RiskBadge({ risk }) {
  if (!risk) return <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Pending</span>;
  const colors = {
    low:    { bg: '#f0fdf4', color: '#166534', icon: '🟢' },
    medium: { bg: '#fefce8', color: '#854d0e', icon: '🟠' },
    high:   { bg: '#fef2f2', color: '#b91c1c', icon: '🔴' },
  };
  const s = colors[risk?.toLowerCase()] ?? colors.medium;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: '6px',
      padding: '0.2rem 0.6rem', fontSize: '0.76rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '4px'
    }}>
      {s.icon} {risk}
    </span>
  );
}

// ── KPI Summary Card ─────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, iconColor, iconBg, label, value, sub, subColor }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb',
      padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        background: iconBg, borderRadius: '10px', padding: '0.7rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: subColor || '#6b7280', marginTop: '3px', fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#3b82f6', label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{value} / {max} ({pct}%)</span>
      </div>
      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: '4px', transition: 'width 0.6s ease'
        }} />
      </div>
    </div>
  );
}

// ── Tender Workflow Steps ─────────────────────────────────────────────────────
const WORKFLOW_STEPS = ['draft', 'submitted', 'under_evaluation', 'approved'];
const STEP_LABELS = { draft: 'Draft', submitted: 'Submitted', under_evaluation: 'Evaluating', approved: 'Ranked' };

function TenderWorkflow({ status }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(status ?? 'draft');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {WORKFLOW_STEPS.map((step, i) => {
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <React.Fragment key={step}>
            <div style={{
              padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700,
              whiteSpace: 'nowrap',
              background: isCurrent ? '#3b82f6' : isDone ? '#dcfce7' : '#f3f4f6',
              color: isCurrent ? 'white' : isDone ? '#166534' : '#9ca3af'
            }}>
              {isDone ? '✓ ' : ''}{STEP_LABELS[step]}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div style={{ color: '#d1d5db', fontSize: '0.7rem' }}>→</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contract, isLoading: contractLoading, isError: contractError } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: tenders = [], isLoading: tendersLoading } = useQuery({
    queryKey: ['contractTenders', id],
    queryFn: () => fetchContractTenders(id),
    enabled: !!id,
  });

  if (contractLoading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading contract…</div>
      </div>
    );
  }
  if (contractError || !contract) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#b91c1c', fontWeight: 600 }}>Contract not found</div>
        <button onClick={() => navigate('/contracts')} style={{ marginTop: '1rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Contracts
        </button>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const closingDate  = contract.closingDate ? new Date(contract.closingDate) : null;
  const openingDate  = contract.openingDate ? new Date(contract.openingDate) : null;
  const isPastDeadline = closingDate && closingDate < new Date();
  const daysLeft     = closingDate ? Math.ceil((closingDate - new Date()) / (1000*60*60*24)) : null;

  const evaluatedCount = tenders.filter(t =>
    t.evaluations && t.evaluations.length > 0 && t.evaluations[0].pqm_score != null
  ).length;

  return (
    <div style={{
      padding: '1.75rem', maxWidth: '1200px', margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', gap: '1.5rem'
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/contracts')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.85rem', padding: 0, marginBottom: '0.75rem' }}
        >
          <ArrowLeft size={14} /> Back to Contracts
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0 }}>{contract.name}</h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.25rem 0 0', fontFamily: 'monospace' }}>{contract.id}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <StatusBadge status={contract.status} />
            <button
              onClick={() => navigate(`/contracts/${id}/edit`)}
              style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '0.55rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
            >
              Edit Contract
            </button>
          </div>
        </div>
      </div>

      {/* ── Alert Banner ───────────────────────────────────────────────── */}
      {isPastDeadline && contract.status !== 'Archived' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color="#b45309" />
          <span style={{ color: '#92400e', fontWeight: 600, fontSize: '0.875rem' }}>
            This contract's closing date has passed ({closingDate.toLocaleDateString()}). Consider updating its status.
          </span>
        </div>
      )}

      {/* ── Closing Soon notification ────────────────────────────────── */}
      {!isPastDeadline && daysLeft !== null && daysLeft <= 7 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '10px', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={18} color="#c2410c" />
          <span style={{ color: '#9a3412', fontWeight: 600, fontSize: '0.875rem' }}>
            ⚠ Contract closes in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
            {tenders.filter(t => !t.evaluations?.length).length > 0 &&
              ` ${tenders.filter(t => !t.evaluations?.length).length} supplier(s) still pending evaluation.`}
          </span>
        </div>
      )}

      {/* ── KPI Summary Cards ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <SummaryCard
          icon={DollarSign}
          iconColor="#059669" iconBg="#f0fdf4"
          label="Budget Limit"
          value={contract.budgetLimit ? `$${parseFloat(contract.budgetLimit).toLocaleString()}` : '—'}
          sub={contract.category}
        />
        <SummaryCard
          icon={Calendar}
          iconColor={isPastDeadline ? '#b91c1c' : daysLeft !== null && daysLeft <= 7 ? '#c2410c' : '#3b82f6'}
          iconBg={isPastDeadline ? '#fef2f2' : daysLeft !== null && daysLeft <= 7 ? '#fff7ed' : '#eff6ff'}
          label="Closing Date"
          value={closingDate ? closingDate.toLocaleDateString() : '—'}
          sub={isPastDeadline ? 'Deadline passed' : daysLeft !== null ? `${daysLeft} days remaining` : ''}
          subColor={isPastDeadline ? '#b91c1c' : daysLeft !== null && daysLeft <= 7 ? '#c2410c' : '#3b82f6'}
        />
        <SummaryCard
          icon={Users}
          iconColor="#7c3aed" iconBg="#faf5ff"
          label="Suppliers"
          value={tendersLoading ? '…' : tenders.length}
          sub={tenders.length === 1 ? '1 submission received' : `${tenders.length} submissions received`}
        />
        <SummaryCard
          icon={ClipboardCheck}
          iconColor={evaluatedCount === tenders.length && tenders.length > 0 ? '#059669' : '#f59e0b'}
          iconBg={evaluatedCount === tenders.length && tenders.length > 0 ? '#f0fdf4' : '#fffbeb'}
          label="Evaluated"
          value={tendersLoading ? '…' : `${evaluatedCount} / ${tenders.length}`}
          sub={evaluatedCount === tenders.length && tenders.length > 0 ? 'All evaluated' : 'Pending evaluations'}
          subColor={evaluatedCount === tenders.length && tenders.length > 0 ? '#059669' : '#d97706'}
        />
      </div>

      {/* ── Contract Details + Progress ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Details card */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem' }}>Contract Details</h2>
          {contract.description && (
            <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>{contract.description}</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: Tag,        label: 'Category',     value: contract.category },
              { icon: DollarSign, label: 'Budget Limit', value: contract.budgetLimit ? `$${parseFloat(contract.budgetLimit).toLocaleString()}` : '—' },
              { icon: Calendar,   label: 'Opening Date', value: openingDate?.toLocaleDateString() },
              { icon: Calendar,   label: 'Closing Date', value: closingDate?.toLocaleDateString() },
              { icon: Building2,  label: 'Status',       value: contract.status },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexShrink: 0 }}>
                  <Icon size={16} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>{value ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress panel */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Procurement Progress</h2>

          <ProgressBar
            label="Supplier Submissions"
            value={tenders.length}
            max={Math.max(tenders.length, 1)}
            color="#3b82f6"
          />
          <ProgressBar
            label="Evaluations Completed"
            value={evaluatedCount}
            max={Math.max(tenders.length, 1)}
            color={evaluatedCount === tenders.length && tenders.length > 0 ? '#059669' : '#f59e0b'}
          />

          {/* Award Status */}
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Award Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: evaluatedCount > 0 ? '#059669' : '#f59e0b'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                {evaluatedCount > 0 ? 'Ready for Review' : 'Pending Evaluations'}
              </span>
            </div>
          </div>

          {/* View on Dashboard button */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', background: '#f0fdf4', color: '#166534',
              border: '1px solid #86efac', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', width: '100%'
            }}
          >
            <TrendingUp size={14} /> View on Dashboard
          </button>
        </div>
      </div>

      {/* ── Submitted Tenders ──────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Submitted Tenders</h2>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
              {tenders.length} tender(s) linked to this contract
            </p>
          </div>
          <button
            onClick={() => navigate('/tenders/new', { state: { contractId: contract.id } })}
            style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={14} /> New Tender
          </button>
        </div>

        {tendersLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Loading tenders…</div>
        ) : tenders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f9fafb', borderRadius: '10px', border: '1px dashed #d1d5db' }}>
            <FileText size={32} color="#d1d5db" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#6b7280', fontWeight: 600, marginBottom: '0.25rem' }}>No tenders submitted yet</p>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Be the first to submit a tender for this contract.</p>
            <button
              onClick={() => navigate('/tenders/new', { state: { contractId: contract.id } })}
              style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Submit First Tender
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f9fafb' }}>
                  {['Ref No.', 'Supplier / Vendor', 'Submission Date', 'Workflow', 'PQM Score', 'Risk', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.7rem 0.85rem', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenders.map((t) => {
                  const latestEval = t.evaluations?.[0];
                  return (
                    <tr key={t.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.8rem 0.85rem', fontWeight: 600, color: '#1e3a5f', fontFamily: 'monospace' }}>{t.tender_ref_no}</td>
                      <td style={{ padding: '0.8rem 0.85rem', color: '#374151', fontWeight: 500 }}>{t.vendor_name}</td>
                      <td style={{ padding: '0.8rem 0.85rem', color: '#6b7280' }}>
                        {t.submission_date ? new Date(t.submission_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.8rem 0.85rem' }}>
                        <TenderWorkflow status={t.status} />
                      </td>
                      <td style={{ padding: '0.8rem 0.85rem' }}>
                        {latestEval?.pqm_score != null ? (
                          <span style={{
                            background: latestEval.pqm_score >= 80 ? '#eff6ff' : '#fff7ed',
                            color: latestEval.pqm_score >= 80 ? '#1d4ed8' : '#c2410c',
                            borderRadius: '6px', padding: '0.2rem 0.6rem',
                            fontSize: '0.82rem', fontWeight: 700
                          }}>
                            {latestEval.pqm_score.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.82rem', fontStyle: 'italic' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '0.8rem 0.85rem' }}><RiskBadge risk={latestEval?.risk_level} /></td>
                      <td style={{ padding: '0.8rem 0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(`/tenders/${t.id}`)}
                            style={{ background: '#eff6ff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', cursor: 'pointer', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.78rem' }}
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => navigate(`/evaluations?tenderId=${t.id}`)}
                            style={{ background: '#f0fdf4', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', cursor: 'pointer', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.78rem' }}
                          >
                            <ClipboardCheck size={12} /> Evaluate
                          </button>
                        </div>
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
