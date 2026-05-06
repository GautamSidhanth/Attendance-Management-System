import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { fetchWithToken } from '../api';

export default function TrainerDashboard() {
  const { getToken } = useAuth();
  
  const [data, setData] = useState<{batches: any[], sessions: any[]}>({ batches: [], sessions: [] });
  const [loading, setLoading] = useState(true);

  const [batchName, setBatchName] = useState('');
  const [batchIdForInvite, setBatchIdForInvite] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStart, setSessionStart] = useState('');
  const [sessionEnd, setSessionEnd] = useState('');
  const [sessionBatchId, setSessionBatchId] = useState('');

  const [attendanceSessionId, setAttendanceSessionId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const res = await fetchWithToken('/summary/trainer/data', token);
      setData(res);
      
      // Auto-select first item if available and not set
      if (res.batches.length > 0 && !batchIdForInvite) setBatchIdForInvite(res.batches[0].id);
      if (res.batches.length > 0 && !sessionBatchId) setSessionBatchId(res.batches[0].id);
      if (res.sessions.length > 0 && !attendanceSessionId) setAttendanceSessionId(res.sessions[0].id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getToken]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetchWithToken('/batches', token, {
        method: 'POST',
        body: JSON.stringify({ name: batchName }),
      });
      alert(`Batch created successfully! Your new Batch ID is: ${res.id}`);
      setBatchName('');
      fetchData(); // Refresh data to get new batch
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchIdForInvite) return alert('Please select a batch first.');
    try {
      const token = await getToken();
      const res = await fetchWithToken(`/batches/${batchIdForInvite}/invite`, token, {
        method: 'POST',
      });
      setInviteToken(res.inviteToken);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionBatchId) return alert('Please select a batch first.');
    try {
      const token = await getToken();
      const res = await fetchWithToken('/sessions', token, {
        method: 'POST',
        body: JSON.stringify({
          batch_id: sessionBatchId,
          title: sessionTitle,
          date: sessionDate,
          start_time: sessionStart,
          end_time: sessionEnd,
        }),
      });
      alert(`Session created successfully! Your new Session ID is: ${res.id}`);
      setSessionTitle('');
      setSessionDate('');
      setSessionStart('');
      setSessionEnd('');
      fetchData(); // Refresh data to get new session
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceSessionId) return alert('Please select a session first.');
    try {
      const token = await getToken();
      const res = await fetchWithToken(`/sessions/${attendanceSessionId}/attendance`, token);
      setAttendanceRecords(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-screen">Loading Trainer Data...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Trainer Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Create Batch</h3>
          <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" className="input-field" placeholder="Batch Name" value={batchName} onChange={(e) => setBatchName(e.target.value)} required />
            <button type="submit" className="btn-primary">Create Batch</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>Generate Invite Link</h3>
          <form onSubmit={handleGenerateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select className="input-field" value={batchIdForInvite} onChange={(e) => setBatchIdForInvite(e.target.value)} required>
              {data.batches.length === 0 && <option value="" disabled>No batches available</option>}
              {data.batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} (ID: {b.id})</option>
              ))}
            </select>
            <button type="submit" className="btn-primary" disabled={data.batches.length === 0}>Generate</button>
          </form>
          {inviteToken && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', wordBreak: 'break-all' }}>
              <strong>Invite Token:</strong> <br/> {inviteToken}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Create Session</h3>
        <form onSubmit={handleCreateSession} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <select className="input-field" value={sessionBatchId} onChange={(e) => setSessionBatchId(e.target.value)} required>
            {data.batches.length === 0 && <option value="" disabled>No batches available</option>}
            {data.batches.map(b => (
              <option key={b.id} value={b.id}>{b.name} (ID: {b.id})</option>
            ))}
          </select>
          <input type="text" className="input-field" placeholder="Session Title" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} required />
          <input type="date" className="input-field" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="time" className="input-field" value={sessionStart} onChange={(e) => setSessionStart(e.target.value)} required />
            <input type="time" className="input-field" value={sessionEnd} onChange={(e) => setSessionEnd(e.target.value)} required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={data.batches.length === 0}>Create Session</button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem' }}>View Attendance</h3>
        <form onSubmit={handleViewAttendance} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select className="input-field" style={{ flex: 1 }} value={attendanceSessionId} onChange={(e) => setAttendanceSessionId(e.target.value)} required>
            {data.sessions.length === 0 && <option value="" disabled>No sessions available</option>}
            {data.sessions.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.batch_name} - {new Date(s.date).toLocaleDateString()})</option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={data.sessions.length === 0}>View</button>
        </form>
        {attendanceRecords.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Student</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem' }}>{r.student_name}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: r.status === 'present' ? '#10B981' : (r.status === 'late' ? '#F59E0B' : '#EF4444') 
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{new Date(r.marked_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          data.sessions.length > 0 && attendanceSessionId && <p style={{ color: 'var(--text-muted)' }}>No attendance records found for this session yet.</p>
        )}
      </div>
    </div>
  );
}
