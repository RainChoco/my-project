import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import styles from '../styles/dashboard.module.css';

const CATEGORY_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

/**
 * CategoryChart — shows tender count grouped by category.
 * Derives data from the real rankings array passed from DashboardPage.
 */
export default function CategoryChart({ rankings = [] }) {
  const categoryMap = {};

  rankings.forEach(r => {
    const cat = r.category || 'Uncategorised';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const data = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)   // highest count first
    .map(([name, count]) => ({ name, Count: count }));

  const isEmpty = data.length === 0;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle}>Tenders by Category</h3>
      {isEmpty ? (
        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          No evaluation data available for selected contract
        </div>
      ) : (
        <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v, 'Tenders']} />
              <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
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
