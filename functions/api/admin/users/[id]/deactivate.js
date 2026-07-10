import { jwtVerify } from 'jose'

async function requireAdmin(request, env) {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND is_admin = 1').bind(payload.userId).first()
    return { ...user, userIdInToken: payload.userId }
  } catch {
    return null
  }
}

export async function onRequest(context) {
  const { request, env, params } = context

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const admin = await requireAdmin(request, env)
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  const targetId = parseInt(params.id)
  if (targetId === admin.userIdInToken) {
    return new Response(JSON.stringify({ error: 'No puedes desactivarte a ti mismo' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(targetId).first()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    })
  }

  await env.DB.prepare('UPDATE users SET active = 0 WHERE id = ?').bind(targetId).run()
  return new Response(JSON.stringify({ message: 'Usuario desactivado correctamente' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
