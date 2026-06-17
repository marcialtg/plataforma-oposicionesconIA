import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAllUsers, findUserById, setUserActiveStatus } from '../user-db.js';

const router = Router();

router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await getAllUsers();
  res.json(users.map(u => ({ ...u, is_admin: !!u.is_admin, active: !!u.active })));
});

router.post('/users/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === req.userId) {
    return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
  }

  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  await setUserActiveStatus(userId, 0);
  res.json({ message: 'Usuario desactivado correctamente' });
});

router.post('/users/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);

  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  await setUserActiveStatus(userId, 1);
  res.json({ message: 'Usuario activado correctamente' });
});

export default router;
