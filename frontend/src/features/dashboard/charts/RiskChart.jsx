import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from '../styles/dashboard.module.css';

const data = [
  { name: 'Low Risk', value: 25 },
  { name: 'Medium Risk', value: 10 },
  { name: 'High Risk', value: 7 },
];
const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function RiskChart() {
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.cardTitle}>Vendor Risk Distribution</h3>
      <div style={{ height: 250, width: '100%', marginTop: '1rem' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
