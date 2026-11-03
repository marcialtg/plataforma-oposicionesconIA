import { Router } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { findUserById } from '../user-db.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  consultarNoticias,
  ejecutarAgente,
  sqliteAdapter,
  compararSeguro,
} from '../../../functions/_shared/noticias.js'
import { generateContent } from '../services/ai.js'

const router = Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await consultarNoticias(sqliteAdapter(db), {
      comunidad: req.query.comunidad,
      tipo: req.query.tipo,
      q: req.query.q,
      dias: req.query.dias,
      limit: req.query.limit,
      offset: req.query.offset,
    })
    res.json({ ...data, generado_en: new Date().toISOString() })
  } catch (error) {
    console.error('Listar noticias error:', error)
    res.status(500).json({ error: 'Error al cargar las noticias', detalle: error.message })
  }
})

async function esAdmin(req) {
  const token = (req.headers.authorization || '').split(' ')[1]
  if (!token) return false
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await findUserById(decoded.userId)
    return Boolean(user && user.is_admin && user.active)
  } catch {
    return false
  }
}

router.post('/actualizar', async (req, res) => {
  const secret = process.env.CRON_SECRET || ''
  const proporcionado = req.headers['x-cron-secret'] || (req.headers.authorization || '').split(' ')[1] || ''
  const autorizadoCron = Boolean(secret) && compararSeguro(proporcionado, secret)

  if (!autorizadoCron && !(await esAdmin(req))) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere el secreto del cron o una cuenta de administrador.' })
  }

  try {
    const usarIA = process.env.NEWS_AI !== '0' && process.env.NEWS_AI !== 'false'
    const resultado = await ejecutarAgente({
      db: sqliteAdapter(db),
      env: process.env,
      generar: usarIA ? generateContent : null,
    })
    res.json({ ok: true, ...resultado })
  } catch (error) {
    console.error('Actualizar noticias error:', error)
    res.status(500).json({ error: 'Error al ejecutar el agente de noticias', detalle: error.message })
  }
})

export default router
