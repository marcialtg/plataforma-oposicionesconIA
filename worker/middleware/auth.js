import { jwtVerify } from 'jose'
import { findUserById } from '../user-db.js'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')

export async function authenticateToken(c, next) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return c.json({ error: 'Token de autenticación requerido' }, 401)
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())
    c.set('userId', payload.userId)

    const user = await findUserById(c.env.DB, payload.userId)
    if (!user) {
      return c.json({ error: 'Usuario no encontrado' }, 404)
    }
    if (!user.active) {
      return c.json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' }, 403)
    }

    await next()
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 403)
  }
}

export async function requireAdmin(c, next) {
  const user = await findUserById(c.env.DB, c.get('userId'))
  if (!user || !user.is_admin) {
    return c.json({ error: 'Acceso denegado. Se requieren permisos de administrador.' }, 403)
  }
  await next()
}
