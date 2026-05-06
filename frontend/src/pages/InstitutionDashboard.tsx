import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { fetchWithToken } from '../api';

export default function InstitutionDashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<{batches: any[], trainers: any[]}>({ batches: [], trainers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await fetchWithToken('/summary/institution/data', token);
        setData(res);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken]);

  if (loading) return <div className="loading-screen">Loading Institution Data...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Institution Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Our Batches</h3>
          {data.batches.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No batches created yet. A Trainer must create a batch.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Batch Name</th>
                </tr>
              </thead>
              <tbody>
                {data.batches.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem' }}>{b.id}</td>
                    <td style={{ padding: '0.5rem' }}>{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Our Trainers</h3>
          {data.trainers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No trainers registered yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {data.trainers.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem' }}>{t.id}</td>
                    <td style={{ padding: '0.5rem' }}>{t.name}</td>
                    <td style={{ padding: '0.5rem' }}>{t.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
