import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../styles/dashboard.module.css';

const data = [
  { name: 'Cleaning', count: 12 },
  { name: 'Maintenance', count: 19 },
  { name: 'Landscaping', count: 8 },
  { name: 'Security', count: 3 },
];

export default function CategoryChart() {
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle}>Tenders by Category</h3>
      <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
