export async function onRequest(context) {
  const { request, env, next } = context
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/')) {
    return next()
  }

  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok', version: '1.0.0', hasDB: !!env.DB }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (url.pathname === '/api/debug') {
    const info = { hasDB: !!env.DB }
    if (env.DB) {
      try {
        const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
        info.tables = tables.results?.map(t => t.name) || []
      } catch (e) {
        info.dbError = e.message
      }
    }
    return new Response(JSON.stringify(info), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response('Not Found', { status: 404 })
}
