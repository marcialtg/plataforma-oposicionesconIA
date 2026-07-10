import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { findUserByEmail } from '../user-db.js'

function randomHex(bytes) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

const router = new Hono()

router.post('/forgot', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email) return c.json({ error: 'Email es obligatorio' }, 400)

    const db = c.env.DB
    const user = await findUserByEmail(db, email)

    if (!user) {
      return c.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' })
    }

    const token = randomHex(32)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await db.prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)')
      .bind(email, token, expiresAt).run()

    const origin = process.env.FRONTEND_URL || `${c.req.url.split('/api')[0]}`
    const resetUrl = `${origin}/reset-password?token=${token}`

    console.log(`Password reset URL for ${email}: ${resetUrl}`)

    return c.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return c.json({ error: 'Error al procesar la solicitud' }, 500)
  }
})

router.post('/reset', async (c) => {
  try {
    const { token, password } = await c.req.json()
    if (!token || !password) {
      return c.json({ error: 'Token y nueva contraseña son obligatorios' }, 400)
    }

    const db = c.env.DB
    const record = await db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').bind(token).first()

    if (!record) {
      return c.json({ error: 'Token inválido o ya utilizado' }, 400)
    }

    if (new Date(record.expires_at) < new Date()) {
      return c.json({ error: 'El token ha expirado. Solicita un nuevo restablecimiento.' }, 400)
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    await db.prepare('UPDATE users SET password = ? WHERE email = ?').bind(hashedPassword, record.email).run()
    await db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(record.id).run()

    return c.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return c.json({ error: 'Error al restablecer la contraseña' }, 500)
  }
})

export default router
