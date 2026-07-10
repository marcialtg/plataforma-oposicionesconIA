import bcrypt from 'bcryptjs'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { token, password } = await request.json()
    if (!token || !password) return new Response(JSON.stringify({ error: 'Token y contraseña obligatorios' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    if (password.length < 6) return new Response(JSON.stringify({ error: 'Mínimo 6 caracteres' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const reset = await env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")').bind(token).first()
    if (!reset) return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const hashed = await bcrypt.hash(password, 10)
    await env.DB.prepare('UPDATE users SET password = ? WHERE email = ?').bind(hashed, reset.email).run()
    await env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(reset.id).run()

    return new Response(JSON.stringify({ message: 'Contraseña actualizada correctamente' }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Reset password error:', e)
    return new Response(JSON.stringify({ error: 'Error al restablecer contraseña' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
