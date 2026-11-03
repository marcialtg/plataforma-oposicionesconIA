import { jwtVerify } from 'jose'
import { ejecutarAgente, d1Adapter, compararSeguro, GRUPOS_NOTICIAS } from '../../_shared/noticias.js'
import { generateContent, getAIKey, getAIModel, getAIProvider } from '../../_shared/ai.js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

async function esAdmin(request, env) {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const user = await env.DB.prepare('SELECT id, is_admin, active FROM users WHERE id = ?').bind(payload.userId).first()
    return Boolean(user && user.is_admin && user.active)
  } catch {
    return false
  }
}

export async function onRequest(context) {
  const { request, env, waitUntil } = context

  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  if (!env.DB) return json({ error: 'Base de datos no configurada' }, 500)

  const bearer = request.headers.get('Authorization')?.split(' ')[1] || ''
  const proporcionado = request.headers.get('x-cron-secret') || bearer
  const cronSecret = env.CRON_SECRET || ''
  const autorizadoCron = Boolean(cronSecret) && compararSeguro(proporcionado, cronSecret)

  if (!autorizadoCron && !(await esAdmin(request, env))) {
    return json({ error: 'Acceso denegado. Se requiere el secreto del cron o una cuenta de administrador.' }, 403)
  }

  const url = new URL(request.url)
  const grupoParam = url.searchParams.get('grupo')
  let grupo = null
  let comunidades = null
  if (grupoParam && grupoParam !== 'all') {
    const idx = Number(grupoParam)
    if (!Number.isInteger(idx) || idx < 1 || idx > GRUPOS_NOTICIAS.length) {
      return json({ error: `Grupo no válido. Usa un número del 1 al ${GRUPOS_NOTICIAS.length} o "all".` }, 400)
    }
    grupo = idx
    comunidades = GRUPOS_NOTICIAS[idx - 1]
  }

  try {
    const apiKey = getAIKey(env)
    const usarIA = Boolean(apiKey) && env.NEWS_AI !== '0' && env.NEWS_AI !== 'false'
    const generar = usarIA
      ? (prompt, system) => generateContent(prompt, system, apiKey, getAIModel(env), getAIProvider(env))
      : null

    const trabajo = ejecutarAgente({
      db: d1Adapter(env.DB),
      env,
      generar,
      log: console,
      comunidades,
    })

    // Sin grupo se intenta todo de golpe: puede superar el límite de Cloudflare,
    // así que respondemos al instante y dejamos el trabajo en segundo plano.
    if (!grupo && typeof waitUntil === 'function') {
      waitUntil(trabajo.catch((e) => console.error('Actualizar noticias (background):', e)))
      return json({ ok: true, iniciado: true, mensaje: 'Agente lanzado en segundo plano' })
    }

    const resultado = await trabajo
    return json({ ok: true, grupo, ...resultado })
  } catch (e) {
    console.error('Actualizar noticias error:', e)
    const migracion = /no such table|does not exist/i.test(String(e.message))
    return json({
      error: migracion
        ? 'El radar aún no está instalado en la base de datos. Aplica migrations/0001_noticias.sql.'
        : 'Error al ejecutar el agente de noticias',
      detalle: String(e.message || e).slice(0, 300),
    }, 500)
  }
}
