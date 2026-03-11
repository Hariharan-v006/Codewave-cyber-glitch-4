import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Report from './pages/Report';
import Auth from './pages/Auth';
import History from './pages/History';
import './index.css';

function Navigation() {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) return null; // Hide navigation on auth page

  return (
    <nav style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
      {location.pathname !== '/' && (
        <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>Home</Link>
      )}
      <Link to="/history" style={{ color: 'var(--success)', textDecoration: 'none', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>My History</Link>
      <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/auth'; }} style={{ color: 'var(--danger)', border: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Logout</button>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" />;
}

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="title" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>SafeScan</h1>
        <p className="subtitle">Product Authenticity & Ingredient Safety Checker</p>
        <Navigation />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/report/:barcode" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
