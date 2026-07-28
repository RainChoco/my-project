import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from '../styles/dashboard.module.css';

const RISK_COLORS = {
  low:    '#10b981',   // green
  medium: '#f59e0b',   // amber
  high:   '#ef4444'    // red
};
const RISK_LABELS = {
  low:    'Low Risk',
  medium: 'Medium Risk',
  high:   'High Risk'
};

/**
 * RiskChart — shows vendor risk distribution as a donut chart.
 * Derives counts from the real rankings array passed from DashboardPage.
 */
export default function RiskChart({ rankings = [] }) {
  const riskMap = { low: 0, medium: 0, high: 0 };

  rankings.forEach(r => {
    const level = (r.riskLevel || 'low').toLowerCase();
    if (level in riskMap) riskMap[level] += 1;
    else riskMap.low += 1;  // unknown → treat as low
  });

  const data = Object.entries(riskMap)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name:  RISK_LABELS[key] || key,
      Count: count,
      color: RISK_COLORS[key] || '#94a3b8'
    }));

  const isEmpty = data.length === 0;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle}>Vendor Risk Distribution</h3>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          No evaluation data available for selected contract
        </div>
      ) : (
        <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="Count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
