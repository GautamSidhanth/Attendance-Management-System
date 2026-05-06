import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { fetchWithToken } from '../api';

export default function MonitoringOfficerDashboard() {
  const { getToken } = useAuth();
  const [summaries, setSummaries] = useState<any[]>([]);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const token = await getToken();
        const res = await fetchWithToken('/summary/programme', token);
        setSummaries(res);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchSummaries();
  }, [getToken]);

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Monitoring Officer Dashboard (Read-Only)</h2>
      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem' }}>Programme Summary</h3>
        {summaries.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Institution</th>
                <th style={{ padding: '0.5rem' }}>Total Records</th>
                <th style={{ padding: '0.5rem' }}>Present</th>
                <th style={{ padding: '0.5rem' }}>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s: any) => {
                const total = parseInt(s.total_attendance_records || '0');
                const present = parseInt(s.present_count || '0');
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr key={s.institution_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem' }}>{s.institution_name}</td>
                    <td style={{ padding: '0.5rem' }}>{total}</td>
                    <td style={{ padding: '0.5rem' }}>{present}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
                          <div style={{ width: `${rate}%`, background: rate > 75 ? '#10B981' : (rate > 50 ? '#F59E0B' : '#EF4444'), height: '100%', borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No data available.</p>
        )}
      </div>
    </div>
  );
}
