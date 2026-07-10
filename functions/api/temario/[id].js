import { jwtVerify } from 'jose'

export async function onRequest(context) {
  const { request, env, params } = context
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT * FROM temarios WHERE id = ? AND user_id = ?').bind(params.id, payload.userId).first()
      if (!row) return new Response(JSON.stringify({ error: 'Tema no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify(row), { headers: { 'Content-Type': 'application/json' } })
    }

    if (request.method === 'DELETE') {
      const { meta } = await env.DB.prepare('DELETE FROM temarios WHERE id = ? AND user_id = ?').bind(params.id, payload.userId).run()
      if (meta.changes === 0) return new Response(JSON.stringify({ error: 'Tema no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ message: 'Tema eliminado' }), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (e) {
    console.error('Temario error:', e)
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
