import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import temarioRoutes from './routes/temario.js';
import supuestosRoutes from './routes/supuestos.js';
import programacionRoutes from './routes/programacion.js';
import situacionesRoutes from './routes/situaciones.js';
import adminRoutes from './routes/admin.js';
import passwordRoutes from './routes/password.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/temario', temarioRoutes);
app.use('/api/supuestos', supuestosRoutes);
app.use('/api/programacion', programacionRoutes);
app.use('/api/situaciones', situacionesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
