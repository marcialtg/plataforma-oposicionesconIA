import { Hono } from 'hono'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { getAllUsers, findUserById, setUserActiveStatus } from '../user-db.js'

const router = new Hono()

router.get('/users', authenticateToken, requireAdmin, async (c) => {
  const db = c.env.DB
  const users = await getAllUsers(db)
  return c.json(users.map(u => ({ ...u, is_admin: !!u.is_admin, active: !!u.active })))
})

router.post('/users/:id/deactivate', authenticateToken, requireAdmin, async (c) => {
  const userId = parseInt(c.req.param('id'))
  if (userId === c.get('userId')) {
    return c.json({ error: 'No puedes desactivarte a ti mismo' }, 400)
  }

  const db = c.env.DB
  const user = await findUserById(db, userId)
  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)

  await setUserActiveStatus(db, userId, 0)
  return c.json({ message: 'Usuario desactivado correctamente' })
})

router.post('/users/:id/activate', authenticateToken, requireAdmin, async (c) => {
  const userId = parseInt(c.req.param('id'))

  const db = c.env.DB
  const user = await findUserById(db, userId)
  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404)

  await setUserActiveStatus(db, userId, 1)
  return c.json({ message: 'Usuario activado correctamente' })
})

export default router
