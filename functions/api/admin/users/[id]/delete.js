import { jwtVerify } from 'jose'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method !== 'DELETE') return new Response('Method not allowed', { status: 405 })

  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)

    const admin = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND is_admin = 1').bind(payload.userId).first()
    if (!admin) return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { 'Content-Type': 'application/json' } })

    if (Number(params.id) === payload.userId) {
      return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    await env.DB.prepare('DELETE FROM temarios WHERE user_id = ?').bind(params.id).run()
    await env.DB.prepare('DELETE FROM supuestos WHERE user_id = ?').bind(params.id).run()
    await env.DB.prepare('DELETE FROM programaciones WHERE user_id = ?').bind(params.id).run()
    await env.DB.prepare('DELETE FROM situaciones WHERE user_id = ?').bind(params.id).run()
    await env.DB.prepare('DELETE FROM password_resets WHERE email = (SELECT email FROM users WHERE id = ?)').bind(params.id).run()
    const { meta } = await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run()

    if (meta.changes === 0) return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ message: 'Usuario eliminado' }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Delete user error:', e)
    return new Response(JSON.stringify({ error: 'Error al eliminar usuario' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
