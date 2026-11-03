import { jwtVerify } from 'jose'
import { consultarNoticias, d1Adapter } from '../../_shared/noticias.js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

async function usuarioAutenticado(request, env) {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const user = await env.DB.prepare('SELECT id, active FROM users WHERE id = ?').bind(payload.userId).first()
    if (!user || !user.active) return null
    return user
  } catch {
    return null
  }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405)

  if (!env.DB) return json({ error: 'Base de datos no configurada' }, 500)

  const user = await usuarioAutenticado(request, env)
  if (!user) return json({ error: 'No autenticado' }, 401)

  try {
    const url = new URL(request.url)
    const data = await consultarNoticias(d1Adapter(env.DB), {
      comunidad: url.searchParams.get('comunidad') || '',
      tipo: url.searchParams.get('tipo') || '',
      q: url.searchParams.get('q') || '',
      dias: url.searchParams.get('dias') || '',
      limit: url.searchParams.get('limit') || 24,
      offset: url.searchParams.get('offset') || 0,
    })

    return json({ ...data, generado_en: new Date().toISOString() })
  } catch (e) {
    console.error('Listar noticias error:', e)
    const migracion = /no such table|does not exist/i.test(String(e.message))
    return json({
      error: migracion
        ? 'El radar aún no está instalado en la base de datos. Aplica migrations/0001_noticias.sql.'
        : 'Error al cargar las noticias',
      detalle: String(e.message || e).slice(0, 300),
    }, 500)
  }
}
