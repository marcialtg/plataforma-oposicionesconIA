export async function onRequest(context) {
  const { env } = context
  return new Response(JSON.stringify({ status: 'ok', version: '1.0.0', hasDB: !!env.DB }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
