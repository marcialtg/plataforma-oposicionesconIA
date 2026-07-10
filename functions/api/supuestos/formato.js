import { jwtVerify } from 'jose'
import { generateContent, getAIKey, getAIModel } from '../../_shared/ai.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) return new Response(JSON.stringify({ error: 'Token requerido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

    const secret = new TextEncoder().encode(env.JWT_SECRET || 'oposiciones-ia-secret-key-2024')
    await jwtVerify(token, secret)

    const { comunidad, cuerpo, especialidad } = await request.json()
    if (!comunidad || !cuerpo) return new Response(JSON.stringify({ error: 'Comunidad y cuerpo obligatorios' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const system = 'Eres un experto en oposiciones docentes en España.'
    const prompt = `Indica el formato/estructura oficial de los supuestos prácticos para:\nComunidad: ${comunidad}\nCuerpo: ${cuerpo}\nEspecialidad: ${especialidad || 'No especificada'}\nDevuelve JSON como: { "formato": "...", "duracion": "...", "criterios": "...", "ejemplo": "..." }`

    const text = await generateContent(prompt, system, getAIKey(env), getAIModel(env))
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { formato: '', duracion: '', criterios: '', ejemplo: '' }
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Formato error:', e)
    return new Response(JSON.stringify({ error: 'Error al obtener el formato' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
