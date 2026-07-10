import { Hono } from 'hono'
import { authenticateToken } from '../middleware/auth.js'
import { generarSituacion } from '../services/ai.js'

const router = new Hono()

router.post('/generar', authenticateToken, async (c) => {
  try {
    const { titulo, curso, duracion, producto_final, pautas } = await c.req.json()
    if (!titulo || !curso || !duracion) {
      return c.json({ error: 'Título, curso y duración son obligatorios' }, 400)
    }

    const user = await (await import('../user-db.js')).findUserById(c.env.DB, c.get('userId'))
    const resultado = await generarSituacion(user.comunidad, user.cuerpo, user.asignatura, titulo, curso, duracion, producto_final, pautas)

    const { meta } = await c.env.DB.prepare(
      'INSERT INTO situaciones (user_id, datos, contenido) VALUES (?, ?, ?)'
    ).bind(c.get('userId'), JSON.stringify({ titulo, curso, duracion, producto_final, pautas }), resultado).run()

    return c.json({ id: meta.last_row_id, resultado }, 201)
  } catch (error) {
    console.error('Generar situacion error:', error)
    return c.json({ error: 'Error al generar la situación de aprendizaje' }, 500)
  }
})

router.get('/', authenticateToken, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, created_at FROM situaciones WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(c.get('userId')).all()
  return c.json(results)
})

router.get('/:id', authenticateToken, async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM situaciones WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), c.get('userId')).first()
  if (!row) return c.json({ error: 'Situación no encontrada' }, 404)
  return c.json(row)
})

export default router
