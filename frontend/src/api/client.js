const API_BASE = import.meta.env.VITE_API_URL
  || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://marcialtg-oposiciones-api.hf.space/api'
    : '/api');

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, name, comunidad, asignatura, cuerpo) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, comunidad, asignatura, cuerpo }) }),
  me: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const temario = {
  lookup: (consulta) => request('/temario/lookup', { method: 'POST', body: JSON.stringify({ consulta }) }),
  generar: (enunciado, instrucciones) =>
    request('/temario/generar', { method: 'POST', body: JSON.stringify({ enunciado, instrucciones }) }),
  listar: () => request('/temario'),
  obtener: (id) => request(`/temario/${id}`),
  eliminar: (id) => request(`/temario/${id}`, { method: 'DELETE' }),
};

export const passwordReset = {
  forgot: (email) => request('/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  reset: (token, password) => request('/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

export const supuestos = {
  formato: () => request('/supuestos/formato', { method: 'POST' }),
  generar: (formato) => request('/supuestos/generar', { method: 'POST', body: JSON.stringify({ formato }) }),
  listar: () => request('/supuestos'),
  obtener: (id) => request(`/supuestos/${id}`),
};

export const programacion = {
  generar: (curso, numUnidades, enfoque, contexto_centro) =>
    request('/programacion/generar', { method: 'POST', body: JSON.stringify({ curso, numUnidades, enfoque, contexto_centro }) }),
  listar: () => request('/programacion'),
  obtener: (id) => request(`/programacion/${id}`),
};

export const admin = {
  getUsers: () => request('/admin/users'),
  deactivateUser: (id) => request(`/admin/users/${id}/deactivate`, { method: 'POST' }),
  activateUser: (id) => request(`/admin/users/${id}/activate`, { method: 'POST' }),
};

export const situaciones = {
  generar: (titulo, curso, duracion, producto_final, pautas) =>
    request('/situaciones/generar', { method: 'POST', body: JSON.stringify({ titulo, curso, duracion, producto_final, pautas }) }),
  listar: () => request('/situaciones'),
  obtener: (id) => request(`/situaciones/${id}`),
};
