import { jwtVerify } from 'jose'

export async function onRequest(context) {
  const { request, env } = context

  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Base de datos no configurada' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      user: { ...user, is_admin: !!user.is_admin, active: !!user.active },
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }
}
