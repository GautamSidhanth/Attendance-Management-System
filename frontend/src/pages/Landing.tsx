import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { LogIn, UserPlus } from 'lucide-react';

export default function Landing() {
  const { isSignedIn } = useAuth();

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <h1 className="logo" style={{ fontSize: '3rem', marginBottom: '1rem' }}>SkillBridge</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px' }}>
        The state-level attendance management system for modern skilling programmes.
      </p>
      
      <div className="glass-card" style={{ display: 'flex', gap: '1rem' }}>
        {isSignedIn ? (
          <Link to="/dashboard">
            <button className="btn-primary">Go to Dashboard</button>
          </Link>
        ) : (
          <>
            <Link to="/sign-in">
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={18} /> Sign In
              </button>
            </Link>
            <Link to="/sign-up">
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} /> Register
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
