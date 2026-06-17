import { useState } from 'react';
import { auth } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { COMUNIDADES, CUERPOS, ESPECIALIDADES } from '../api/constants';

export default function Profile({ user, onUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [comunidad, setComunidad] = useState(user?.comunidad || '');
  const [cuerpo, setCuerpo] = useState(user?.cuerpo || '');
  const [especialidad, setEspecialidad] = useState(user?.asignatura || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const data = await auth.updateProfile({ name, comunidad, asignatura: especialidad, cuerpo });
      localStorage.setItem('user', JSON.stringify(data.user));
      onUpdate(data.user);
      setSuccess('Perfil actualizado');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👤 Mi Perfil</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{success}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={user?.email || ''} disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comunidad Autónoma</label>
          <select value={comunidad} onChange={(e) => setComunidad(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
            <option value="">Selecciona</option>
            {COMUNIDADES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo</label>
          <select value={cuerpo} onChange={(e) => setCuerpo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
            <option value="">Selecciona</option>
            {CUERPOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
          <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
            <option value="">Selecciona</option>
            {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
