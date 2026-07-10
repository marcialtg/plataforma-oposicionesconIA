export async function findUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
}

export async function createUser(db, { email, password, name = '', comunidad = '', asignatura = '', cuerpo = '', isAdmin = 0 }) {
  const { meta } = await db.prepare(`
    INSERT INTO users (email, password, name, comunidad, asignatura, cuerpo, is_admin, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(email, password, name, comunidad, asignatura, cuerpo, isAdmin ? 1 : 0).run()
  return findUserById(db, meta.last_row_id)
}

export async function findUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
}

export async function updateUserProfile(db, id, { name, comunidad, asignatura, cuerpo }) {
  await db.prepare(`
    UPDATE users SET name = ?, comunidad = ?, asignatura = ?, cuerpo = ? WHERE id = ?
  `).bind(name || '', comunidad || '', asignatura || '', cuerpo || '', id).run()
  return findUserById(db, id)
}

export async function getAllUsers(db) {
  const { results } = await db.prepare(
    'SELECT id, email, name, is_admin, active, created_at FROM users ORDER BY created_at DESC'
  ).all()
  return results
}

export async function setUserActiveStatus(db, id, active) {
  await db.prepare('UPDATE users SET active = ? WHERE id = ?').bind(active ? 1 : 0, id).run()
}

export async function getUserCount(db) {
  const row = await db.prepare('SELECT COUNT(*) as count FROM users').first()
  return row.count
}
