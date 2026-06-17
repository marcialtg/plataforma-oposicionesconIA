import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generarProgramacion } from '../services/ai.js';
import { findUserById } from '../user-db.js';
import db from '../db.js';

const router = Router();

router.post('/generar', authenticateToken, async (req, res) => {
  try {
    const { curso, numUnidades, enfoque, contexto_centro } = req.body;
    if (!curso) return res.status(400).json({ error: 'El curso/nivel es obligatorio' });

    const user = await findUserById(req.userId);
    if (!user?.comunidad || !user?.cuerpo || !user?.asignatura) {
      return res.status(400).json({ error: 'Completa tu perfil primero' });
    }

    const contenido = await generarProgramacion(
      user.comunidad, user.cuerpo, user.asignatura,
      curso, numUnidades || 12, enfoque || '', contexto_centro || ''
    );

    const result = db.prepare(
      'INSERT INTO programaciones (user_id, comunidad, datos, contenido) VALUES (?, ?, ?, ?)'
    ).run(req.userId, user.comunidad, JSON.stringify({ curso, numUnidades, enfoque, contexto_centro }), contenido);

    res.json({
      id: result.lastInsertRowid,
      comunidad: user.comunidad,
      contenido
    });
  } catch (error) {
    console.error('Programacion error:', error);
    res.status(500).json({ error: error.message || 'Error al generar la programación' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const items = db.prepare('SELECT * FROM programaciones WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(items);
});

router.get('/:id', authenticateToken, (req, res) => {
  const item = db.prepare('SELECT * FROM programaciones WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!item) return res.status(404).json({ error: 'Programación no encontrada' });
  res.json(item);
});

export default router;
