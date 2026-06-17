import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Temario from './pages/Temario';
import Supuestos from './pages/Supuestos';
import Programacion from './pages/Programacion';
import Situaciones from './pages/Situaciones';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import { auth } from './api/client';

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      setUser(JSON.parse(stored));
      auth.me().then((res) => {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Cargando...</div>;

  return (
    <Layout user={user} onLogout={() => setUser(null)}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={(u) => { setUser(u); }} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register onRegister={(u) => { setUser(u); }} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/temario" element={<ProtectedRoute user={user}><Temario user={user} /></ProtectedRoute>} />
        <Route path="/supuestos" element={<ProtectedRoute user={user}><Supuestos user={user} /></ProtectedRoute>} />
        <Route path="/programacion" element={<ProtectedRoute user={user}><Programacion user={user} /></ProtectedRoute>} />
        <Route path="/situaciones" element={<ProtectedRoute user={user}><Situaciones user={user} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute user={user}><Admin user={user} /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute user={user}><Profile user={user} onUpdate={(u) => { setUser(u); }} /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}
