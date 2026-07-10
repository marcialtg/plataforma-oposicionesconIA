import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import authRoutes from '../../worker/routes/auth.js'
import temarioRoutes from '../../worker/routes/temario.js'
import supuestosRoutes from '../../worker/routes/supuestos.js'
import programacionRoutes from '../../worker/routes/programacion.js'
import situacionesRoutes from '../../worker/routes/situaciones.js'
import adminRoutes from '../../worker/routes/admin.js'
import passwordRoutes from '../../worker/routes/password.js'

const app = new Hono()

app.use('*', cors())

app.get('/api/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))

app.route('/api/auth', authRoutes)
app.route('/api/temario', temarioRoutes)
app.route('/api/supuestos', supuestosRoutes)
app.route('/api/programacion', programacionRoutes)
app.route('/api/situaciones', situacionesRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/password', passwordRoutes)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Error interno del servidor' }, 500)
})

export const onRequest = handle(app)
