const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Permitir ambas variantes
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const folioRoutes = require('./routes/folioRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const aiSessionRoutes = require('./routes/aiSessionRoutes');
const dictationRoutes = require('./routes/dictationRoutes');
const aiDraftRoutes = require('./routes/aiDraftRoutes');
const pdfTemplateRoutes = require('./routes/pdfTemplateRoutes');

// Conectar DB
const { conectarDB } = require('./config/database');
const { sequelize } = require('./models');
conectarDB();

// Cron Jobs
require('./cronJobs');

// Servir archivos estáticos
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/FOLIOS_GENERADOS', express.static(path.join(__dirname, 'FOLIOS_GENERADOS')));

// 📦 SERVIR FRONTEND (PRODUCCIÓN)
app.use(express.static(path.join(__dirname, '../client/dist')));

// 👇 RUTAS MAESTRAS (Prefijo sagrado '/api')
app.get('/api', (req, res) => res.json({ status: 'online', message: 'API Pastelería v2.0' }));

// ✅ Paso 1: Registrar rutas de autenticación
app.use('/api/auth', authRoutes);

app.use('/api/folios', folioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/webhooks', whatsappRoutes);
app.use('/api/ai-sessions', aiSessionRoutes);
// 🔄 Legacy Adapter: POST /api/ai/session/message
// Montamos explícitamente SOLO la ruta necesaria, sin exponer todo el router de sesiones.
app.post('/api/ai/session/message',
  require('./middleware/authMiddleware'),
  require('./controllers/aiSessionController').handleLegacyMessage
);
app.use('/api/dictation', dictationRoutes);
app.use('/api/ai/draft', aiDraftRoutes);
app.use('/api/activation', require('./routes/activationRoutes')); // Sprint 4
app.use('/api/users', require('./routes/userRoutes')); // Sprint 4 - Pending Users
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/catalog', require('./routes/catalogRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));
app.use('/api/commissions', require('./routes/commissionRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/cash', require('./routes/cashRoutes')); // Caja
app.use('/api/audit', require('./routes/auditRoutes')); // Auditoría
app.use('/api/upload', require('./routes/uploadRoutes')); // Imágenes de Referencia
app.use('/api/pdf-templates', pdfTemplateRoutes);

// Ruta de Salud (Para verificar que el server vive)
// Ruta de Salud (Health Check Standard)
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      ok: true,
      db: "up",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      db: "down",
      error: error.message
    });
  }
});

// 🚀 FALLBACK SPA (Para React Router)
// Si no es /api ni archivo estático, devuelve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 👇 MANEJADOR DE ERRORES GLOBAL (Evita que el server muera en silencio)
app.use((err, req, res, next) => {
  console.error("❌ Error del Servidor:", err.stack);
  res.status(500).json({ message: "Algo salió mal en el servidor", error: err.message });
});

const PORT = process.env.PORT || 3000;
// Sincronización DB y arranque
// Sincronización DB y arranque
// Lee DB_SYNC_MODE: 'none' (prod), 'safe' (create only), 'alter' (dev risky)
const syncMode = process.env.DB_SYNC_MODE || 'none';

async function startServer() {
  try {
    if (syncMode === 'alter') {
      console.warn("⚠️  WARNING: DB_SYNC_MODE='alter'. Schema updates enabled (Risky).");
      await sequelize.sync({ alter: true });
    } else if (syncMode === 'safe') {
      console.log("ℹ️  DB_SYNC_MODE='safe'. Creating missing tables only.");
      await sequelize.sync({ alter: false });
    } else {
      console.log("🛡️  DB_SYNC_MODE='none' (default). Skipping auto-sync.");
      await sequelize.authenticate();
    }

    console.log('✅ DB Conectada.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error fatal iniciando servidor:', err);
    process.exit(1);
  }
}

startServer();