import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import styles from '../styles/dashboard.module.css';

const STATUS_MAP = {
  draft:            { label: 'Draft',            color: '#9ca3af' }, // Grey
  submitted:        { label: 'Submitted',         color: '#3b82f6' }, // Blue
  under_evaluation: { label: 'Under Evaluation',  color: '#f59e0b' }, // Orange
  Evaluating:       { label: 'Evaluating',        color: '#f59e0b' },
  approved:         { label: 'Evaluated',         color: '#10b981' }, // Green
  Awarded:          { label: 'Awarded',           color: '#10b981' },
  rejected:         { label: 'Rejected',          color: '#ef4444' }, // Red
  withdrawn:        { label: 'Withdrawn',         color: '#ef4444' }, // Red
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.6rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 700, color: d.payload.color }}>{d.name}</div>
        <div style={{ fontSize: '0.9rem' }}><strong>{d.value}</strong> tender{d.value !== 1 ? 's' : ''}</div>
      </div>
    );
  }
  return null;
};

export default function SubmissionStatusChart({ rankings = [] }) {
  const statusMap = {};

  rankings.forEach(r => {
    let key = r.status || 'draft';
    if (r.pqmScore != null && key === 'under_evaluation') {
      key = 'approved'; // if it has a score, consider it evaluated for this chart's sake
    }
    statusMap[key] = (statusMap[key] || 0) + 1;
  });

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const data = Object.entries(statusMap)
    .map(([key, count]) => ({
      name:  STATUS_MAP[key]?.label || key,
      Count: count,
      color: STATUS_MAP[key]?.color || '#9ca3af',
      pct:   total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.Count - a.Count);

  const isEmpty = data.length === 0;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle} style={{ marginBottom: '0.25rem' }}>Submission Status Breakdown</h3>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '0.5rem' }}>
          <div style={{ fontSize: '2rem' }}>📋</div>
          <div style={{ fontSize: '0.9rem', textAlign: 'center' }}>No submissions yet for this contract</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {data.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: d.color }} />
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 700 }}>({d.Count})</span>
              </div>
            ))}
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="Count">
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
