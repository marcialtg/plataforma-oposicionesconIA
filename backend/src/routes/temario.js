import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { lookupTema, generateTemario } from '../services/ai.js';
import { findUserById } from '../user-db.js';
import db from '../db.js';

const router = Router();

router.post('/lookup', authenticateToken, async (req, res) => {
  try {
    const { consulta } = req.body;
    if (!consulta) return res.status(400).json({ error: 'Indica el número o título del tema' });

    const user = await findUserById(req.userId);
    if (!user?.comunidad || !user?.cuerpo || !user?.asignatura) {
      return res.status(400).json({ error: 'Completa tu perfil (CCAA, cuerpo y especialidad) antes de buscar temas' });
    }

    const result = await lookupTema(user.comunidad, user.cuerpo, user.asignatura, consulta);
    res.json(result);
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ error: error.message || 'Error al verificar el tema' });
  }
});

router.post('/generar', authenticateToken, async (req, res) => {
  try {
    const { enunciado, instrucciones } = req.body;
    if (!enunciado) return res.status(400).json({ error: 'El enunciado del tema es obligatorio' });

    const user = await findUserById(req.userId);

    const contenido = await generateTemario(
      user?.comunidad || '',
      user?.cuerpo || '',
      user?.asignatura || '',
      enunciado,
      instrucciones || ''
    );

    const result = db.prepare(
      'INSERT INTO temarios (user_id, titulo, contenido) VALUES (?, ?, ?)'
    ).run(req.userId, enunciado, contenido);

    res.json({
      id: result.lastInsertRowid,
      titulo: enunciado,
      contenido
    });
  } catch (error) {
    console.error('Temario error:', error);
    res.status(500).json({ error: error.message || 'Error al generar el tema' });
  }
});

router.get('/', authenticateToken, (req, res) => {
  const temas = db.prepare('SELECT * FROM temarios WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(temas);
});

router.get('/:id', authenticateToken, (req, res) => {
  const tema = db.prepare('SELECT * FROM temarios WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!tema) return res.status(404).json({ error: 'Tema no encontrado' });
  res.json(tema);
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM temarios WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Tema eliminado' });
});

export default router;
