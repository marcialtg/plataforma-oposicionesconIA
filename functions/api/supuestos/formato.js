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

    const system = 'Eres un experto en oposiciones docentes en España.'
    const prompt = `Indica el formato/estructura oficial de los supuestos prácticos para:\nComunidad: ${user.comunidad}\nCuerpo: ${user.cuerpo}\nEspecialidad: ${user.asignatura}\nDevuelve SOLO el texto descriptivo del formato, sin JSON.`

    const texto = await generateContent(prompt, system, getAIKey(env), getAIModel(env))
    return new Response(JSON.stringify({ texto }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Formato error:', e)
    return new Response(JSON.stringify({ error: 'Error al obtener el formato' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
