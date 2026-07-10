import { jwtVerify } from 'jose'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 })

  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    const row = await env.DB.prepare('SELECT id, datos, contenido, comunidad, created_at FROM programaciones WHERE id = ? AND user_id = ?').bind(params.id, payload.userId).first()
    if (!row) return new Response(JSON.stringify({ error: 'Programación no encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify(row), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Get programacion error:', e)
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
