import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, SignIn, SignUp } from '@clerk/react';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import './styles/global.css';

function App() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <div className="loading-screen">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Clerk Auth Routes */}
        <Route path="/sign-in/*" element={<div className="auth-container"><SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/onboarding" /></div>} />
        <Route path="/sign-up/*" element={<div className="auth-container"><SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/onboarding" /></div>} />

        {/* Protected Routes */}
        <Route 
          path="/onboarding" 
          element={isSignedIn ? <Onboarding /> : <Navigate to="/sign-in" />} 
        />
        <Route 
          path="/dashboard/*" 
          element={isSignedIn ? <Dashboard /> : <Navigate to="/sign-in" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
