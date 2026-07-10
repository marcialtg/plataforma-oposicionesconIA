import { Hono } from 'hono'
import { authenticateToken } from '../middleware/auth.js'
import { describeSupuestoFormat, generarSupuesto } from '../services/ai.js'

const router = new Hono()

router.post('/formato', authenticateToken, async (c) => {
  try {
    const user = await (await import('../user-db.js')).findUserById(c.env.DB, c.get('userId'))
    const resultado = await describeSupuestoFormat(user.comunidad, user.cuerpo, user.asignatura)
    return c.json({ resultado })
  } catch (error) {
    console.error('Formato error:', error)
    return c.json({ error: 'Error al obtener el formato' }, 500)
  }
})

router.post('/generar', authenticateToken, async (c) => {
  try {
    const { formato } = await c.req.json()
    const user = await (await import('../user-db.js')).findUserById(c.env.DB, c.get('userId'))
    const resultado = await generarSupuesto(user.comunidad, user.cuerpo, user.asignatura, formato)

    const { meta } = await c.env.DB.prepare(
      'INSERT INTO supuestos (user_id, asignatura, comunidad, resultado) VALUES (?, ?, ?, ?)'
    ).bind(c.get('userId'), user.asignatura, user.comunidad, resultado).run()

    return c.json({ id: meta.last_row_id, resultado }, 201)
  } catch (error) {
    console.error('Generar supuesto error:', error)
    return c.json({ error: 'Error al generar el supuesto' }, 500)
  }
})

router.get('/', authenticateToken, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, created_at FROM supuestos WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(c.get('userId')).all()
  return c.json(results)
})

router.get('/:id', authenticateToken, async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM supuestos WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), c.get('userId')).first()
  if (!row) return c.json({ error: 'Supuesto no encontrado' }, 404)
  return c.json(row)
})

export default router
