import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { describeSupuestoFormat, generarSupuesto } from '../services/ai.js';
import { findUserById } from '../user-db.js';
import db from '../db.js';

const router = Router();

router.post('/formato', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user?.comunidad || !user?.cuerpo || !user?.asignatura) {
      return res.status(400).json({ error: 'Completa tu perfil primero' });
    }

    const resultado = await describeSupuestoFormat(user.comunidad, user.cuerpo, user.asignatura);
    res.json({ texto: resultado });
  } catch (error) {
    console.error('Formato error:', error);
    res.status(500).json({ error: error.message || 'Error al analizar el formato' });
  }
});

router.post('/generar', authenticateToken, async (req, res) => {
  try {
    const { formato } = req.body;

    const user = await findUserById(req.userId);
    if (!user?.comunidad || !user?.cuerpo || !user?.asignatura) {
      return res.status(400).json({ error: 'Completa tu perfil primero' });
    }

    const resultado = await generarSupuesto(user.comunidad, user.cuerpo, user.asignatura, formato || '');

    const result = db.prepare(
      'INSERT INTO supuestos (user_id, asignatura, comunidad, resultado) VALUES (?, ?, ?, ?)'
    ).run(req.userId, user.asignatura, user.comunidad, resultado);

    res.json({
      id: result.lastInsertRowid,
      asignatura: user.asignatura,
      comunidad: user.comunidad,
      resultado
    });
  } catch (error) {
    console.error('Supuesto error:', error);
    res.status(500).json({ error: error.message || 'Error al generar el supuesto' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const items = db.prepare('SELECT * FROM supuestos WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(items);
});

router.get('/:id', authenticateToken, (req, res) => {
  const item = db.prepare('SELECT * FROM supuestos WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!item) return res.status(404).json({ error: 'Supuesto no encontrado' });
  res.json(item);
});

export default router;
