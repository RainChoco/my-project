import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import styles from '../styles/dashboard.module.css';

const CATEGORY_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function CategoryChart({ rankings = [] }) {
  const categoryMap = {};

  rankings.forEach(r => {
    const cat = r.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalPqm: 0, scored: 0 };
    categoryMap[cat].count += 1;
    if (r.pqmScore != null) {
      categoryMap[cat].totalPqm += r.pqmScore;
      categoryMap[cat].scored += 1;
    }
  });

  const data = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, { count, totalPqm, scored }]) => ({
      name,
      Count: count,
      AvgPQM: scored > 0 ? parseFloat((totalPqm / scored).toFixed(1)) : null
    }));

  const isEmpty = data.length === 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.6rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '0.85rem' }}><strong>{d.Count}</strong> tender{d.Count !== 1 ? 's' : ''}</div>
          {d.AvgPQM && <div style={{ fontSize: '0.85rem', color: '#2563eb' }}>Avg PQM: <strong>{d.AvgPQM}</strong></div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Tenders by Category</h3>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem' }}>
          <div style={{ fontSize: '2rem' }}>📂</div>
          <div style={{ fontSize: '0.9rem', textAlign: 'center' }}>No submissions yet for this contract</div>
        </div>
      ) : (
        <div style={{ height: 250, width: '100%' }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Count" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="Count" position="top" style={{ fontSize: '11px', fontWeight: 700 }} />
                {data.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
