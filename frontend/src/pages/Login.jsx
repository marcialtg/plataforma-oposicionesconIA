import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api/client';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await auth.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold text-primary-700">
          📚 Oposita<span className="text-primary-500">.</span>
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-center">Iniciar sesión</h2>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <div className="text-center text-sm">
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-800">¿Olvidaste tu contraseña?</Link>
            </div>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta? <Link to="/register" className="text-primary-600 hover:text-primary-800 font-medium">Crear cuenta</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">Al continuar aceptas que tus datos se guarden de forma segura.</p>
      </div>
    </div>
  );
}
