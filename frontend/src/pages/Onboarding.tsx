import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser, UserButton } from '@clerk/react';
import { fetchWithToken } from '../api';

const ROLES = ['Student', 'Trainer', 'Institution', 'Programme Manager', 'Monitoring Officer'];

export default function Onboarding() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [role, setRole] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutions, setInstitutions] = useState<{id: number, name: string}[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await getToken();
        // Check if user already exists
        const meResponse = await fetchWithToken('/users/me', token);
        if (meResponse && meResponse.role) {
          // Already onboarded
          navigate('/dashboard');
        }
      } catch (err: any) {
        // 404 means not onboarded, which is fine
        if (err.message !== 'User not onboarded') {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [getToken, navigate]);

  useEffect(() => {
    if (role === 'Trainer') {
      const fetchInstitutions = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/institutions`);
          const data = await res.json();
          setInstitutions(data);
        } catch (e) {
          console.error('Failed to fetch institutions', e);
        }
      };
      fetchInstitutions();
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role.');
      return;
    }
    
    setLoading(true);
    try {
      const token = await getToken();
      await fetchWithToken('/users/onboard', token, {
        method: 'POST',
        body: JSON.stringify({
          name: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Unknown User',
          role,
          institutionName: role === 'Institution' ? institutionName : undefined,
          institutionId: role === 'Trainer' ? selectedInstitutionId : undefined
        }),
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to onboard');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div>
      <header className="header" style={{ padding: '1rem 2rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo" style={{ fontSize: '1.5rem', margin: 0 }}>SkillBridge</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{user?.fullName || 'User'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Onboarding</div>
          </div>
          <UserButton />
        </div>
      </header>
      
      <div className="container" style={{ maxWidth: '600px', marginTop: '10vh' }}>
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Welcome to SkillBridge!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
            Please complete your profile to continue.
          </p>

        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Your Role</label>
            <select 
              className="input-field" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>-- Select Role --</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {role === 'Institution' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Institution Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Govt ITI College" 
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
              />
            </div>
          )}

          {role === 'Trainer' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Institution</label>
              <select 
                className="input-field" 
                value={selectedInstitutionId} 
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                required
              >
                <option value="" disabled>-- Select Institution --</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
