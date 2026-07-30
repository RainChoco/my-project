import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import styles from '../styles/dashboard.module.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#374151' }}>{label}</p>
        <p style={{ margin: 0, color: '#2563eb', fontWeight: 700 }}>
          Avg PQM: {payload[0].value.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ rankings = [] }) {
  // Filter for evaluated tenders only
  const evaluated = rankings.filter(r => r.pqmScore != null);

  // Aggregate average score by submission month
  const monthData = {};
  evaluated.forEach(r => {
    if (!r.submissionDate) return;
    const d = new Date(r.submissionDate);
    if (isNaN(d)) return;
    const month = d.toLocaleString('default', { month: 'short' });
    if (!monthData[month]) {
      monthData[month] = { total: 0, count: 0, time: d.getTime() };
    }
    monthData[month].total += r.pqmScore;
    monthData[month].count += 1;
  });

  const data = Object.entries(monthData)
    .sort((a, b) => a[1].time - b[1].time)
    .map(([month, stats]) => ({
      name: month,
      Score: stats.total / stats.count
    }));

  const isEmpty = data.length === 0;

  // Empty state timeline
  const emptyData = [
    { name: 'Jun', Score: null },
    { name: 'Jul', Score: null },
    { name: 'Aug', Score: null }
  ];

  return (
    <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
      <h3 className={styles.cardTitle}>Average PQM Score Over Time <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8rem' }}>per submission period</span></h3>
      <div style={{ height: 260, width: '100%', position: 'relative' }}>
        {isEmpty && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
            <div style={{ color: '#9ca3af', fontWeight: 600 }}>Waiting for evaluations...</div>
          </div>
        )}
        <ResponsiveContainer>
          <AreaChart data={isEmpty ? emptyData : data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={isEmpty ? 0.1 : 0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            {!isEmpty && <Tooltip content={<CustomTooltip />} />}
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target (80)', fill: '#10b981', fontSize: 11 }} />
            <Area type="monotone" dataKey="Score" stroke={isEmpty ? '#d1d5db' : '#3b82f6'} strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
