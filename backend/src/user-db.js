import db from './db.js';

export async function findUserByEmail(email) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return user || null;
}

export async function createUser({ email, password, name, comunidad, asignatura, cuerpo, isAdmin }) {
  const stmt = db.prepare(`
    INSERT INTO users (email, password, name, comunidad, asignatura, cuerpo, is_admin, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const result = stmt.run(email, password, name || '', comunidad || '', asignatura || '', cuerpo || '', isAdmin ? 1 : 0);
  return findUserById(result.lastInsertRowid);
}

export async function findUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return user || null;
}

export async function updateUserProfile(id, { name, comunidad, asignatura, cuerpo }) {
  db.prepare(`
    UPDATE users SET name = ?, comunidad = ?, asignatura = ?, cuerpo = ? WHERE id = ?
  `).run(name || '', comunidad || '', asignatura || '', cuerpo || '', id);
  return findUserById(id);
}

export async function getAllUsers() {
  return db.prepare('SELECT id, email, name, is_admin, active, created_at FROM users ORDER BY created_at DESC').all();
}

export async function setUserActiveStatus(id, active) {
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

export async function getUserCount() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return row.count;
}
