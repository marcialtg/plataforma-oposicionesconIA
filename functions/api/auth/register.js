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
    const { email, password, name, comunidad, asignatura, cuerpo } = await request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y contraseña son obligatorios' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    if (!comunidad || !asignatura || !cuerpo) {
      return new Response(JSON.stringify({ error: 'Comunidad Autónoma, cuerpo y especialidad son obligatorios' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Base de datos no configurada' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return new Response(JSON.stringify({ error: 'Ya existe un usuario con ese email' }), {
        status: 409, headers: { 'Content-Type': 'application/json' },
      })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const count = await env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first()
    const isAdmin = count.cnt === 0 ? 1 : 0

    const { meta } = await env.DB.prepare(
      'INSERT INTO users (email, password, name, comunidad, asignatura, cuerpo, is_admin, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    ).bind(email, hashedPassword, name || '', comunidad, asignatura, cuerpo, isAdmin).run()

    const secret = env.JWT_SECRET || 'oposiciones-ia-secret-key-2024'
    const token = await makeToken(meta.last_row_id, secret)

    return new Response(JSON.stringify({
      token,
      user: { id: meta.last_row_id, email, name: name || '', comunidad, asignatura, cuerpo, is_admin: !!isAdmin },
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Register error:', error)
    return new Response(JSON.stringify({ error: 'Error al registrar usuario' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
