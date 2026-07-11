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

    const { formato } = await request.json()

    const system = 'Eres un experto preparador de oposiciones docentes en España.'
    const prompt = `Contexto: ${user.comunidad} - ${user.cuerpo} - ${user.asignatura}\nFormato a seguir:\n${formato || 'Formato estándar de supuesto práctico'}\n\nRedacta un supuesto práctico completo siguiendo el formato indicado, con enunciado y solución razonada.`

    const resultado = await generateContent(prompt, system, getAIKey(env), getAIModel(env), getAIProvider(env))
    const { meta } = await env.DB.prepare('INSERT INTO supuestos (user_id, asignatura, resultado, comunidad) VALUES (?, ?, ?, ?)').bind(payload.userId, 'Supuesto generado', resultado, user.comunidad || '').run()

    return new Response(JSON.stringify({ id: meta.last_row_id, resultado }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Generar supuesto error:', e)
    return new Response(JSON.stringify({ error: 'Error al generar supuesto' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
