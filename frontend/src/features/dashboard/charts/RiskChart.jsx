import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import styles from '../styles/dashboard.module.css';

const RISK_COLORS = {
  low:    '#10b981',
  medium: '#f59e0b',
  high:   '#ef4444'
};
const RISK_LABELS = {
  low:    'Low',
  medium: 'Medium',
  high:   'High'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.6rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 700, color: d.payload.color }}>{d.name}</div>
        <div style={{ fontSize: '0.9rem' }}><strong>{d.value}</strong> supplier{d.value !== 1 ? 's' : ''}</div>
      </div>
    );
  }
  return null;
};

export default function RiskChart({ rankings = [] }) {
  const riskMap = { low: 0, medium: 0, high: 0 };

  rankings.forEach(r => {
    const level = (r.riskLevel || 'low').toLowerCase();
    if (level in riskMap) riskMap[level] += 1;
    else riskMap.low += 1;
  });

  const total = Object.values(riskMap).reduce((a, b) => a + b, 0);

  const data = Object.entries(riskMap)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name:  RISK_LABELS[key] || key,
      Count: count,
      color: RISK_COLORS[key] || '#94a3b8',
      pct:   total > 0 ? Math.round((count / total) * 100) : 0
    }));

  const isEmpty = data.length === 0;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle} style={{ marginBottom: '0.25rem' }}>Vendor Risk Distribution</h3>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem' }}>
          <div style={{ fontSize: '2rem' }}>🛡️</div>
          <div style={{ fontSize: '0.9rem', textAlign: 'center' }}>Complete evaluations to see risk data</div>
        </div>
      ) : (
        <>
          {/* Legend with counts */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {data.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 700 }}>({d.Count})</span>
                <span style={{ color: '#9ca3af' }}>{d.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="Count"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
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
