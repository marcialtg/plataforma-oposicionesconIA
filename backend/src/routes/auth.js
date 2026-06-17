import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, findUserById, updateUserProfile, getUserCount } from '../user-db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, comunidad, asignatura, cuerpo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    if (!comunidad || !asignatura || !cuerpo) {
      return res.status(400).json({ error: 'Comunidad Autónoma, cuerpo y especialidad son obligatorios' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const count = await getUserCount();
    const isAdmin = count === 0 ? 1 : 0;

    const user = await createUser({
      email,
      password: hashedPassword,
      name: name || '',
      comunidad,
      asignatura,
      cuerpo,
      isAdmin,
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user.id, email, name: name || '', comunidad, asignatura, cuerpo, is_admin: !!isAdmin }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, comunidad: user.comunidad, asignatura: user.asignatura, cuerpo: user.cuerpo, is_admin: !!user.is_admin }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, comunidad, asignatura, cuerpo } = req.body;
    const user = await updateUserProfile(req.userId, { name, comunidad, asignatura, cuerpo });
    res.json({ user: { ...user, is_admin: !!user.is_admin } });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: { ...user, is_admin: !!user.is_admin, active: !!user.active } });
  } catch {
    res.status(403).json({ error: 'Token inválido' });
  }
});

export default router;
