import { jwtVerify } from 'jose'

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 })
  }

  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requerido' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    const { name, comunidad, asignatura, cuerpo } = await request.json()
    await env.DB.prepare(
      'UPDATE users SET name = ?, comunidad = ?, asignatura = ?, cuerpo = ? WHERE id = ?'
    ).bind(name || '', comunidad || '', asignatura || '', cuerpo || '', payload.userId).run()

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first()
    return new Response(JSON.stringify({ user: { ...user, is_admin: !!user.is_admin } }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }
}
