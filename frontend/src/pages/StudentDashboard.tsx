import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { fetchWithToken } from '../api';

export default function StudentDashboard() {
  const { getToken } = useAuth();
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      const token = await getToken();
      const res = await fetchWithToken('/sessions/active', token);
      setSessions(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [getToken]);

  const handleJoinBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const token = await getToken();
      const decoded = atob(inviteToken);
      const batchId = decoded.replace('batch_', '');
      
      await fetchWithToken(`/batches/${batchId}/join`, token, {
        method: 'POST',
        body: JSON.stringify({ inviteToken }),
      });
      setMessage('Successfully joined batch!');
      setInviteToken('');
      fetchSessions();
    } catch (err: any) {
      setMessage(err.message || 'Failed to join batch');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (sessionId: number, status: string) => {
    try {
      const token = await getToken();
      await fetchWithToken(`/attendance/mark`, token, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, status }),
      });
      alert('Attendance marked as ' + status);
    } catch (err: any) {
      alert(err.message || 'Failed to mark attendance');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Student Dashboard</h2>
      
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Join a Batch</h3>
        <form onSubmit={handleJoinBatch} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Paste invite token here..." 
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            Join Batch
          </button>
        </form>
        {message && <p style={{ marginTop: '1rem', color: message.includes('Failed') ? '#EF4444' : '#10B981' }}>{message}</p>}
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem' }}>Active Sessions</h3>
        {sessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map((session) => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{session.title}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {session.batch_name} • {new Date(session.date).toLocaleDateString()} • {session.start_time} - {session.end_time}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trainer: {session.trainer_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleMarkAttendance(session.id, 'present')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Present</button>
                  <button onClick={() => handleMarkAttendance(session.id, 'late')} className="btn-primary" style={{ background: '#F59E0B', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Late</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No active sessions found. Join a batch to see your sessions.</p>
        )}
      </div>
    </div>
  );
}
