import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { fetchWithToken } from '../api';

export default function ProgrammeManagerDashboard() {
  const { getToken } = useAuth();
  const [summaries, setSummaries] = useState<any[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<number | null>(null);
  const [instDetails, setInstDetails] = useState<any[]>([]);

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

  const handleViewDetails = async (instId: number) => {
    try {
      const token = await getToken();
      const res = await fetchWithToken(`/summary/institutions/${instId}`, token);
      setInstDetails(res);
      setSelectedInstId(instId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Programme Manager Dashboard</h2>
      
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Global Programme Summary</h3>
        {summaries.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Institution</th>
                <th style={{ padding: '0.5rem' }}>Total Records</th>
                <th style={{ padding: '0.5rem' }}>Present</th>
                <th style={{ padding: '0.5rem' }}>Attendance Rate</th>
                <th style={{ padding: '0.5rem' }}>Action</th>
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
                    <td style={{ padding: '0.5rem' }}>
                      <button className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleViewDetails(s.institution_id)}>
                        Details
                      </button>
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

      {selectedInstId && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Detailed Breakdown (Institution #{selectedInstId})</h3>
          {instDetails.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Batch Name</th>
                  <th style={{ padding: '0.5rem' }}>Total Records</th>
                  <th style={{ padding: '0.5rem' }}>Present</th>
                </tr>
              </thead>
              <tbody>
                {instDetails.map((b: any) => (
                  <tr key={b.batch_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem' }}>{b.batch_name}</td>
                    <td style={{ padding: '0.5rem' }}>{b.total_attendance_records || 0}</td>
                    <td style={{ padding: '0.5rem' }}>{b.present_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No batches found for this institution.</p>
          )}
        </div>
      )}
    </div>
  );
}
