import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generarSituacion } from '../services/ai.js';
import { findUserById } from '../user-db.js';
import db from '../db.js';

const router = Router();

router.post('/generar', authenticateToken, async (req, res) => {
  try {
    const { titulo, curso, duracion, producto_final, pautas } = req.body;
    if (!titulo || !curso || !duracion) {
      return res.status(400).json({ error: 'Título, curso y duración son obligatorios' });
    }

    const user = await findUserById(req.userId);
    if (!user?.comunidad || !user?.cuerpo || !user?.asignatura) {
      return res.status(400).json({ error: 'Completa tu perfil primero' });
    }

    const contenido = await generarSituacion(
      user.comunidad, user.cuerpo, user.asignatura,
      titulo, curso, duracion, producto_final || '', pautas || ''
    );

    const result = db.prepare(
      'INSERT INTO situaciones (user_id, datos, contenido) VALUES (?, ?, ?)'
    ).run(req.userId, JSON.stringify({ titulo, curso, duracion, producto_final, pautas }), contenido);

    res.json({
      id: result.lastInsertRowid,
      contenido
    });
  } catch (error) {
    console.error('Situacion error:', error);
    res.status(500).json({ error: error.message || 'Error al generar la situación de aprendizaje' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const items = db.prepare('SELECT * FROM situaciones WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(items);
});

router.get('/:id', authenticateToken, (req, res) => {
  const item = db.prepare('SELECT * FROM situaciones WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!item) return res.status(404).json({ error: 'Situación no encontrada' });
  res.json(item);
});

export default router;
