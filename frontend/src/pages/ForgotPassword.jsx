import { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordReset } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const data = await passwordReset.forgot(email);
      setMessage(data.message);
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
          <h2 className="text-xl font-semibold mb-2 text-center">Restablecer contraseña</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Te enviaremos un enlace para restablecer tu contraseña.</p>
          {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4">{message}</div>}
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="tu@email.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-primary-600 hover:text-primary-800 font-medium">Volver a iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
