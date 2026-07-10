import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

async function makeToken(userId, secret) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret))
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y contraseña son obligatorios' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Base de datos no configurada' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }
    if (!user.active) {
      return new Response(JSON.stringify({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      })
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const secret = env.JWT_SECRET || 'oposiciones-ia-secret-key-2024'
    const token = await makeToken(user.id, secret)

    return new Response(JSON.stringify({
      token,
      user: { id: user.id, email: user.email, name: user.name, comunidad: user.comunidad, asignatura: user.asignatura, cuerpo: user.cuerpo, is_admin: !!user.is_admin },
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Error al iniciar sesión' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
