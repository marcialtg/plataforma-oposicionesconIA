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

    const { consulta } = await request.json()
    if (!consulta) return new Response(JSON.stringify({ error: 'Consulta obligatoria' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const system = 'Eres un experto en temarios oficiales de oposiciones docentes en España.'
    const prompt = `Especialidad: ${user.asignatura}\nCuerpo: ${user.cuerpo}\nComunidad: ${user.comunidad}\nConsulta: "${consulta}"\nDevuelve JSON: { "encontrado": true|false, "numero": null|number, "enunciado_oficial": "...", "fuente": "...", "advertencia": "..." }`

    const text = await generateContent(prompt, system, getAIKey(env), getAIModel(env))
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { encontrado: false, numero: null, enunciado_oficial: '', fuente: '', advertencia: 'No se pudo verificar.' }
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Lookup error:', e)
    return new Response(JSON.stringify({ error: 'Error al buscar el tema' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
