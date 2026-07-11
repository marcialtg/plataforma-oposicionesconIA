import { jwtVerify } from 'jose'
import { generateContent, getAIKey, getAIModel, getAIProvider } from '../../_shared/ai.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    const { payload } = await jwtVerify(token, secret)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first()

    const { titulo, curso, duracion, productoFinal, pautas } = await request.json()
    if (!titulo || !curso) return new Response(JSON.stringify({ error: 'Título y curso obligatorios' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const system = 'Eres un experto en situaciones de aprendizaje (situaciones de aprendizaje) para oposiciones docentes en España.'
    const prompt = `Contexto: ${user.comunidad} - ${user.cuerpo} - ${user.asignatura}\nTítulo: "${titulo}"\nCurso/Nivel: ${curso}\nDuración: ${duracion || 'No especificada'}\nProducto final: ${productoFinal || 'No especificado'}\nPautas: ${pautas || 'Ninguna'}\nCrea una situación de aprendizaje completa y detallada.`

    const contenido = await generateContent(prompt, system, getAIKey(env), getAIModel(env), getAIProvider(env))
    const datos = JSON.stringify({ titulo, curso, duracion: duracion || '', productoFinal: productoFinal || '', pautas: pautas || '' })
    const { meta } = await env.DB.prepare('INSERT INTO situaciones (user_id, datos, contenido) VALUES (?, ?, ?)').bind(payload.userId, datos, contenido).run()

    return new Response(JSON.stringify({ id: meta.last_row_id, contenido }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Generar situacion error:', e)
    return new Response(JSON.stringify({ error: 'Error al generar situación de aprendizaje' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
