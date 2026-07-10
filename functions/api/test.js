import bcrypt from 'bcryptjs'

export async function onRequest() {
  const hash = bcrypt.hashSync('test', 10)
  return new Response(JSON.stringify({ bcrypt: hash ? 'ok' : 'fail', hash }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
