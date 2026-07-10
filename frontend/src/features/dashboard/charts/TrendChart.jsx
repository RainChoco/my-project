import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../styles/dashboard.module.css';

const data = [
  { name: 'Jan', avgScore: 78 },
  { name: 'Feb', avgScore: 82 },
  { name: 'Mar', avgScore: 80 },
  { name: 'Apr', avgScore: 85 },
  { name: 'May', avgScore: 86 },
];

export default function TrendChart() {
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle}>Average PQM Trend (Months)</h3>
      <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="avgScore" stroke="#2563eb" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
