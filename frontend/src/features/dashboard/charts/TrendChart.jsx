import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import styles from '../styles/dashboard.module.css';

export default function TrendChart({ rankings = [] }) {
  const monthMap = {};

  rankings.forEach(r => {
    if (r.pqmScore == null) return;
    const label = r.submissionMonth || (r.tenderRefNo?.slice(0, 7)) || 'Period';
    if (!monthMap[label]) monthMap[label] = { total: 0, count: 0 };
    monthMap[label].total += r.pqmScore;
    monthMap[label].count += 1;
  });

  const data = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, { total, count }]) => ({
      name,
      'Avg PQM': parseFloat((total / count).toFixed(1))
    }));

  const isEmpty = data.length === 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const color = score >= 90 ? '#166534' : score >= 80 ? '#1d4ed8' : score >= 70 ? '#c2410c' : '#991b1b';
      return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.6rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color }}>PQM {score}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 className={styles.cardTitle}>Average PQM Score Over Time</h3>
        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>per submission period</span>
      </div>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem' }}>
          <div style={{ fontSize: '2rem' }}>📈</div>
          <div style={{ fontSize: '0.9rem', textAlign: 'center' }}>Score trend will appear after evaluations are scored</div>
        </div>
      ) : (
        <div style={{ height: 240, width: '100%', marginTop: '0.5rem' }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="pqmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '80', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <Area
                type="monotone"
                dataKey="Avg PQM"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#pqmGradient)"
                dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
