import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import styles from '../styles/dashboard.module.css';

const COLOR_SUBMISSIONS = '#E31E24'; // brand red

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#374151' }}>{label}</p>
        <p style={{ margin: 0, color: COLOR_SUBMISSIONS, fontWeight: 700, fontSize: '0.85rem' }}>
          Submissions: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ rankings = [] }) {
  // Aggregate submission totals by month
  const monthData = {};
  rankings.forEach(r => {
    if (!r.submissionDate) return;
    const d = new Date(r.submissionDate);
    if (isNaN(d)) return;
    const month = d.toLocaleString('default', { month: 'short' });
    if (!monthData[month]) {
      monthData[month] = { submissions: 0, time: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
    }
    monthData[month].submissions += 1;
  });

  const data = Object.entries(monthData)
    .sort((a, b) => a[1].time - b[1].time)
    .map(([month, stats]) => ({
      name: month,
      Submissions: stats.submissions
    }));

  const isEmpty = data.length === 0;

  return (
    <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
      <h3 className={styles.cardTitle}>Tender Submissions Over Time</h3>
      <div style={{ height: 260, width: '100%', position: 'relative' }}>
        {isEmpty ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#9ca3af', fontWeight: 600 }}>Waiting for submissions...</div>
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                label={{ value: 'Month', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                dy={5}
              />
              <YAxis
                allowDecimals={false}
                label={{ value: 'Submission Count', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="Submissions" name="Submissions" fill={COLOR_SUBMISSIONS} radius={[4, 4, 0, 0]} maxBarSize={32}>
                <LabelList dataKey="Submissions" position="top" style={{ fontSize: '11px', fontWeight: 700, fill: '#374151' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
