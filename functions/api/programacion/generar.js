import { jwtVerify } from 'jose'
import { generateContent, getAIKey, getAIModel } from '../../_shared/ai.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first()

    const { curso, numUnidades, enfoque, contextoCentro } = await request.json()
    if (!curso) return new Response(JSON.stringify({ error: 'Curso obligatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const system = 'Eres un experto en programación didáctica para oposiciones docentes en España.'
    const prompt = `Contexto: ${user.comunidad} - ${user.cuerpo} - ${user.asignatura}\nCurso: ${curso}\nNúmero de unidades: ${numUnidades || 12}\nEnfoque: ${enfoque || 'Estándar'}\nContexto del centro: ${contextoCentro || 'No especificado'}\nGenera una programación didáctica completa y detallada.`

    const contenido = await generateContent(prompt, system, getAIKey(env), getAIModel(env))
    const datos = JSON.stringify({ curso, numUnidades: numUnidades || 12, enfoque: enfoque || '', contextoCentro: contextoCentro || '' })
    const { meta } = await env.DB.prepare('INSERT INTO programaciones (user_id, datos, contenido, comunidad) VALUES (?, ?, ?, ?)').bind(payload.userId, datos, contenido, user.comunidad || '').run()

    return new Response(JSON.stringify({ id: meta.last_row_id, contenido }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Generar programacion error:', e)
    return new Response(JSON.stringify({ error: 'Error al generar programación' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
