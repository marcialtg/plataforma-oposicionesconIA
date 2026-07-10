import { Hono } from 'hono'
import { authenticateToken } from '../middleware/auth.js'
import { generarProgramacion } from '../services/ai.js'

const router = new Hono()

router.post('/generar', authenticateToken, async (c) => {
  try {
    const { curso, numUnidades, enfoque, contexto_centro } = await c.req.json()
    if (!curso || !numUnidades) {
      return c.json({ error: 'Curso y número de unidades son obligatorios' }, 400)
    }

    const user = await (await import('../user-db.js')).findUserById(c.env.DB, c.get('userId'))
    const resultado = await generarProgramacion(user.comunidad, user.cuerpo, user.asignatura, curso, numUnidades, enfoque, contexto_centro)

    const { meta } = await c.env.DB.prepare(
      'INSERT INTO programaciones (user_id, comunidad, datos, contenido) VALUES (?, ?, ?, ?)'
    ).bind(c.get('userId'), user.comunidad, JSON.stringify({ curso, numUnidades, enfoque, contexto_centro }), resultado).run()

    return c.json({ id: meta.last_row_id, resultado }, 201)
  } catch (error) {
    console.error('Generar programacion error:', error)
    return c.json({ error: 'Error al generar la programación' }, 500)
  }
})

router.get('/', authenticateToken, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, created_at FROM programaciones WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(c.get('userId')).all()
  return c.json(results)
})

router.get('/:id', authenticateToken, async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM programaciones WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), c.get('userId')).first()
  if (!row) return c.json({ error: 'Programación no encontrada' }, 404)
  return c.json(row)
})

export default router
