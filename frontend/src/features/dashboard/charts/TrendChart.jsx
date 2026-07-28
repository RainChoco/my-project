import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import styles from '../styles/dashboard.module.css';

/**
 * TrendChart — shows average PQM score bucketed by submission month.
 * Derives data from the real rankings array passed from DashboardPage.
 * Falls back to an empty-state message if no data is available.
 */
export default function TrendChart({ rankings = [] }) {
  // Build month-bucket averages from real ranking data
  const monthMap = {};

  rankings.forEach(r => {
    if (r.pqmScore == null) return;
    // tenderRefNo carries the submission date indirectly; use a fixed ordering key
    // The month label comes from the tender's submission month if available.
    // We use the rank's position as a proxy if no date is available.
    const label = r.submissionMonth || r.tenderRefNo?.slice(0, 7) || 'Unknown';
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

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle}>Average PQM Score by Period</h3>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          No evaluation data available for selected contract
        </div>
      ) : (
        <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}`, 'Avg PQM']} />
              <Line type="monotone" dataKey="Avg PQM" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
