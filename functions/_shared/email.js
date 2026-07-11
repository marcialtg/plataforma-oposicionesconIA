export async function sendEmail(env, to, subject, html) {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Oposita <notificaciones@oposicionesconia.com>',
        to,
        subject,
        html,
      }),
    })
  } catch (e) {
    console.error('Email send error:', e)
  }
}

export async function notifyNewUser(env, user) {
  const to = env.NOTIFICATION_EMAIL || 'admin@test.com'
  const subject = `Nuevo registro: ${user.name || user.email}`
  const html = `
    <h2>Nuevo usuario registrado</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nombre</td><td style="padding:8px;border:1px solid #ddd">${user.name || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${user.email}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Comunidad</td><td style="padding:8px;border:1px solid #ddd">${user.comunidad || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Cuerpo</td><td style="padding:8px;border:1px solid #ddd">${user.cuerpo || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Especialidad</td><td style="padding:8px;border:1px solid #ddd">${user.asignatura || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Fecha</td><td style="padding:8px;border:1px solid #ddd">${new Date().toLocaleString('es-ES')}</td></tr>
    </table>
    <p style="color:#666;font-size:12px;margin-top:16px">Puedes gestionar usuarios en <a href="https://app.oposicionesconia.com/admin">app.oposicionesconia.com/admin</a></p>
  `
  await sendEmail(env, to, subject, html)
}
