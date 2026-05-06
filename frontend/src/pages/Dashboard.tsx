import { useState, useEffect } from 'react';
import { useAuth, UserButton } from '@clerk/react';
import { fetchWithToken } from '../api';

// Placeholder components, to be implemented
import StudentDashboard from './StudentDashboard';
import TrainerDashboard from './TrainerDashboard';
import InstitutionDashboard from './InstitutionDashboard';
import ProgrammeManagerDashboard from './ProgrammeManagerDashboard';
import MonitoringOfficerDashboard from './MonitoringOfficerDashboard';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getToken();
        const me = await fetchWithToken('/users/me', token);
        setUserProfile(me);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [getToken]);

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

  if (error) {
    if (error === 'User not onboarded') {
      window.location.href = '/onboarding';
      return <div className="loading-screen">Redirecting to onboarding...</div>;
    }

    return (
      <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#EF4444' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userProfile?.role) {
      case 'Student': return <StudentDashboard />;
      case 'Trainer': return <TrainerDashboard />;
      case 'Institution': return <InstitutionDashboard />;
      case 'Programme Manager': return <ProgrammeManagerDashboard />;
      case 'Monitoring Officer': return <MonitoringOfficerDashboard />;
      default: return <div>Unknown Role</div>;
    }
  };

  return (
    <div>
      <header className="header" style={{ padding: '1rem 2rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo" style={{ fontSize: '1.5rem', margin: 0 }}>SkillBridge</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{userProfile?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userProfile?.role}</div>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="container">
        {renderDashboard()}
      </main>
    </div>
  );
}
