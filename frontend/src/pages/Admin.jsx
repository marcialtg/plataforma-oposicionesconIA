import { useState, useEffect } from 'react';
import { admin } from '../api/client';

export default function Admin({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await admin.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const toggleUser = async (u) => {
    try {
      if (u.active) {
        await admin.deactivateUser(u.id);
      } else {
        await admin.activateUser(u.id);
      }
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarUsuario = async (u) => {
    if (!window.confirm(`¿Eliminar a ${u.name || u.email}? Esta acción no se puede deshacer.`)) return;
    try {
      await admin.deleteUser(u.id);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user.is_admin) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-2">Acceso denegado</h2>
        <p>No tienes permisos de administrador para acceder a esta página.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Panel de Administración</h1>
        <p className="text-gray-500 mt-1">Gestiona los usuarios de la plataforma.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-8">Cargando usuarios...</div>
      ) : (
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Comunidad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cuerpo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Especialidad</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Admin</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Acción</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Eliminar</th>
                </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.comunidad || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.cuerpo || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.asignatura || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {u.is_admin ? (
                      <span className="text-yellow-600">👑</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.id === user.id ? (
                      <span className="text-xs text-gray-400">Eres tú</span>
                    ) : u.active ? (
                      <button
                        onClick={() => toggleUser(u)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleUser(u)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Reactivar
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.id === user.id ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <button
                        onClick={() => eliminarUsuario(u)}
                        className="text-xs text-red-700 hover:text-red-900 font-semibold"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-50 px-4 py-3 text-xs text-gray-400 border-t">
            Total: {users.length} usuarios
          </div>
        </div>
      )}
    </div>
  );
}
