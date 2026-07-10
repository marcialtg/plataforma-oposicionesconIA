import { randomBytes } from 'node:crypto'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { email } = await request.json()
    if (!email) return new Response(JSON.stringify({ error: 'Email obligatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (!user) return new Response(JSON.stringify({ error: 'Email no registrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } })

    const token = Array.from(randomBytes(32)).map(b => b.toString(16).padStart(2, '0')).join('')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await env.DB.prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)').bind(email, token, expiresAt).run()

    return new Response(JSON.stringify({
      message: 'Token generado',
      token,
      expires_at: expiresAt,
      note: 'En producción enviarías esto por email. Por ahora se devuelve en la respuesta.'
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Forgot password error:', e)
    return new Response(JSON.stringify({ error: 'Error al generar reset' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
