import { jwtVerify } from 'jose'

async function requireAdmin(request, env) {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND is_admin = 1').bind(payload.userId).first()
    return user
  } catch {
    return null
  }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const admin = await requireAdmin(request, env)
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { results } = await env.DB.prepare(
    'SELECT id, email, name, is_admin, active, created_at FROM users ORDER BY created_at DESC'
  ).all()

  const users = results.map(u => ({ ...u, is_admin: !!u.is_admin, active: !!u.active }))
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' },
  })
}
