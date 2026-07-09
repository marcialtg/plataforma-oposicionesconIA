import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import db from '../db.js';
import { findUserByEmail } from '../user-db.js';

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email es obligatorio' });

    const user = await findUserByEmail(email);

    if (!user) {
      return res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    db.prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)')
      .run(email, token, expiresAt);

    const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Restablece tu contraseña - Oposita',
      html: `
        <h2>Restablecer contraseña</h2>
        <p>Hola ${user.name || 'usuario'},</p>
        <p>Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Restablecer contraseña</a></p>
        <p>O copia este enlace: ${resetUrl}</p>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste esto, ignora este mensaje.</p>
      `,
    });

    res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
    }

    const record = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token);
    if (!record) {
      return res.status(400).json({ error: 'Token inválido o ya utilizado' });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'El token ha expirado. Solicita un nuevo restablecimiento.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, record.email);

    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(record.id);

    res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

export default router;
