import { Hono } from 'hono'
import { authenticateToken } from '../middleware/auth.js'
import { lookupTema, generateTemario } from '../services/ai.js'

const router = new Hono()

router.post('/lookup', authenticateToken, async (c) => {
  try {
    const { consulta } = await c.req.json()
    if (!consulta) return c.json({ error: 'La consulta es obligatoria' }, 400)

    const user = await (await import('../user-db.js')).findUserById(c.env.DB, c.get('userId'))
    const result = await lookupTema(user.comunidad, user.cuerpo, user.asignatura, consulta)
    return c.json(result)
  } catch (error) {
    console.error('Lookup error:', error)
    return c.json({ error: 'Error al buscar el tema' }, 500)
  }
})

router.post('/generar', authenticateToken, async (c) => {
  try {
    const { enunciado, instrucciones } = await c.req.json()
    if (!enunciado) return c.json({ error: 'El enunciado es obligatorio' }, 400)

    const user = await (await import('../user-db.js')).findUserById(c.env.DB, c.get('userId'))
    const resultado = await generateTemario(user.comunidad, user.cuerpo, user.asignatura, enunciado, instrucciones || '')

    const { meta } = await c.env.DB.prepare(
      'INSERT INTO temarios (user_id, titulo, contenido) VALUES (?, ?, ?)'
    ).bind(c.get('userId'), enunciado, resultado).run()

    return c.json({ id: meta.last_row_id, resultado, titulo: enunciado }, 201)
  } catch (error) {
    console.error('Generar temario error:', error)
    return c.json({ error: 'Error al generar el tema' }, 500)
  }
})

router.get('/', authenticateToken, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, titulo, created_at FROM temarios WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(c.get('userId')).all()
  return c.json(results)
})

router.get('/:id', authenticateToken, async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM temarios WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), c.get('userId')).first()
  if (!row) return c.json({ error: 'Tema no encontrado' }, 404)
  return c.json(row)
})

router.delete('/:id', authenticateToken, async (c) => {
  const { meta } = await c.env.DB.prepare(
    'DELETE FROM temarios WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), c.get('userId')).run()
  if (meta.changes === 0) return c.json({ error: 'Tema no encontrado' }, 404)
  return c.json({ message: 'Tema eliminado correctamente' })
})

export default router
