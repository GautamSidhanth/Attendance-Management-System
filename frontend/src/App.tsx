import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, RedirectToSignIn, RedirectToSignUp } from '@clerk/react';
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

        {/* Protected Routes */}
        <Route 
          path="/onboarding" 
          element={isSignedIn ? <Onboarding /> : <RedirectToSignIn />} 
        />
        <Route 
          path="/dashboard/*" 
          element={isSignedIn ? <Dashboard /> : <RedirectToSignIn />} 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
