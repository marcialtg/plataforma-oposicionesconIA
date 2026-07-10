import { jwtVerify } from 'jose'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 })

  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    const { results } = await env.DB.prepare('SELECT id, titulo, created_at FROM temarios WHERE user_id = ? ORDER BY created_at DESC').bind(payload.userId).all()
    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('List temarios error:', e)
    return new Response(JSON.stringify({ error: 'Error al listar temas' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
