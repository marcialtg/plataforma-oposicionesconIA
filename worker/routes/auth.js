import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { findUserByEmail, createUser, findUserById, updateUserProfile, getUserCount } from '../user-db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = new Hono()

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')

async function signToken(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

router.post('/register', async (c) => {
  try {
    const { email, password, name, comunidad, asignatura, cuerpo } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email y contraseña son obligatorios' }, 400)
    }
    if (!comunidad || !asignatura || !cuerpo) {
      return c.json({ error: 'Comunidad Autónoma, cuerpo y especialidad son obligatorios' }, 400)
    }

    const db = c.env.DB
    const existing = await findUserByEmail(db, email)
    if (existing) {
      return c.json({ error: 'Ya existe un usuario con ese email' }, 409)
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const count = await getUserCount(db)
    const user = await createUser(db, { email, password: hashedPassword, name, comunidad, asignatura, cuerpo, isAdmin: count === 0 })

    const token = await signToken(user.id)
    return c.json({ token, user: { id: user.id, email, name: name || '', comunidad, asignatura, cuerpo, is_admin: !!user.is_admin } }, 201)
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ error: 'Error al registrar usuario' }, 500)
  }
})

router.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email y contraseña son obligatorios' }, 400)
    }

    const db = c.env.DB
    const user = await findUserByEmail(db, email)
    if (!user) {
      return c.json({ error: 'Credenciales inválidas' }, 401)
    }
    if (!user.active) {
      return c.json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' }, 403)
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      return c.json({ error: 'Credenciales inválidas' }, 401)
    }

    const token = await signToken(user.id)
    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, comunidad: user.comunidad, asignatura: user.asignatura, cuerpo: user.cuerpo, is_admin: !!user.is_admin },
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Error al iniciar sesión' }, 500)
  }
})

router.put('/profile', authenticateToken, async (c) => {
  try {
    const { name, comunidad, asignatura, cuerpo } = await c.req.json()
    const db = c.env.DB
    const user = await updateUserProfile(db, c.get('userId'), { name, comunidad, asignatura, cuerpo })
    return c.json({ user: { ...user, is_admin: !!user.is_admin } })
  } catch (error) {
    console.error('Profile update error:', error)
    return c.json({ error: 'Error al actualizar perfil' }, 500)
  }
})

router.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) return c.json({ error: 'No autenticado' }, 401)

  try {
    const { jwtVerify } = await import('jose')
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const db = c.env.DB
    const user = await findUserById(db, payload.userId)
    if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)
    return c.json({ user: { ...user, is_admin: !!user.is_admin, active: !!user.active } })
  } catch {
    return c.json({ error: 'Token inválido' }, 403)
  }
})

export default router
