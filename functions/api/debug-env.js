export async function onRequest(context) {
  const { env } = context
  return new Response(JSON.stringify({
    hasAIKey: !!env.OPENROUTER_API_KEY,
    hasModel: !!env.OPENROUTER_MODEL,
    hasJWT: !!env.JWT_SECRET,
    hasDB: !!env.DB,
    aiKeyPrefix: env.OPENROUTER_API_KEY ? env.OPENROUTER_API_KEY.substring(0, 8) + '...' : 'none',
    model: env.OPENROUTER_MODEL || 'none',
  }), { headers: { 'Content-Type': 'application/json' } })
}
