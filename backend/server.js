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

const requestLogger = require('./middleware/requestLogger');
app.use(requestLogger);

const whatsappRoutes = require('./routes/whatsappRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const authRoutes = require('./routes/authRoutes');
const folioRoutes = require('./routes/folioRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');

app.use('/api/folios', folioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/tenant', require('./routes/tenantConfigRoutes')); // ✅ NEW Tenant Config API

// Fix: WhatsApp Admin vs Webhooks separation
app.use('/api/whatsapp', whatsappRoutes); // Admin (QR, Refresh)
app.use('/api/webhooks', webhookRoutes);  // Public (Webhook)
const aiSessionRoutes = require('./routes/aiSessionRoutes');
const dictationRoutes = require('./routes/dictationRoutes');
const aiDraftRoutes = require('./routes/aiDraftRoutes');
const pdfTemplateRoutes = require('./routes/pdfTemplateRoutes');

// Conectar DB
const { conectarDB } = require('./config/database');
const { sequelize } = require('./models');

// Nota: conectarDB() y cronJobs se ejecutan en bootstrap()


// Servir archivos estáticos
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/FOLIOS_GENERADOS', express.static(path.join(__dirname, 'FOLIOS_GENERADOS')));

// 📦 SERVIR FRONTEND (PRODUCCIÓN)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 👇 RUTAS MAESTRAS (Prefijo sagrado '/api')
app.get('/api', (req, res) => res.json({ status: 'online', message: 'API Pastelería v2.0' }));

// ✅ Paso 1: Registrar rutas de autenticación
app.use('/api/auth', authRoutes);

app.use('/api/folios', folioRoutes);
// Middleware de Autenticación (JWT)
const authMiddleware = require('./middleware/authMiddleware');
const tenantScope = require('./middleware/tenantScope');
const requireBranch = require('./middleware/requireBranch');

// Rutas Públicas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/health', (req, res) => res.json({ status: 'ok', db: 'up' }));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/activation', require('./routes/activationRoutes')); // Some are public/protected internal

// Rutas Protegidas (Auth + Tenant + Branch Strictness)
// Note: We apply requireBranch after auth/tenant middleware to ensure user is populated
// Routes that require active branch assignment for non-owners:
app.use('/api/folios', authMiddleware, tenantScope, requireBranch, require('./routes/folioRoutes'));
app.use('/api/clients', authMiddleware, tenantScope, requireBranch, require('./routes/clientRoutes'));
app.use('/api/catalog', authMiddleware, tenantScope, requireBranch, require('./routes/catalogRoutes'));
app.use('/api/ingredients', authMiddleware, tenantScope, requireBranch, require('./routes/ingredientRoutes'));
app.use('/api/production', authMiddleware, tenantScope, requireBranch, require('./routes/productionRoutes'));
app.use('/api/reports', authMiddleware, tenantScope, requireBranch, require('./routes/reportRoutes'));
app.use('/api/cash', authMiddleware, tenantScope, requireBranch, require('./routes/cashRoutes'));

// Semi-protected (Might not need branch, just auth)
app.use('/api/upload', authMiddleware, tenantScope, require('./routes/uploadRoutes'));
app.use('/api/users', authMiddleware, tenantScope, require('./routes/userRoutes'));
app.use('/api/ai-sessions', authMiddleware, tenantScope, require('./routes/aiSessionRoutes'));
app.use('/api/pdf-templates', authMiddleware, tenantScope, require('./routes/pdfTemplateRoutes'));

// 🔄 Legacy Adapter: POST /api/ai/session/message
// Montamos explícitamente SOLO la ruta necesaria, sin exponer todo el router de sesiones.
app.post('/api/ai/session/message',
  require('./middleware/authMiddleware'),
  require('./controllers/aiSessionController').handleLegacyMessage
);
app.use('/api/dictation', dictationRoutes);
app.use('/api/ai/draft', aiDraftRoutes);
app.use('/api/commissions', require('./routes/commissionRoutes'));
app.use('/api/audit', require('./routes/auditRoutes')); // Auditoría
app.use('/api/pdf-templates', pdfTemplateRoutes);
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/ai/orders', require('./routes/aiOrderRoutes'));
app.use('/api/super', require('./routes/superAdminRoutes'));

// Base API route (for testing/info)
app.get('/api/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API Pastelería v2.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      folios: '/api/folios/*',
      // ... other endpoints
    }
  });
});

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

// 📄 Swagger Documentation
const { swaggerSpec, swaggerUi } = require('./docs/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
console.log('📄 Swagger Docs available at /api/docs');

// 🚀 FALLBACK SPA (Para React Router)
// Si no es /api ni archivo estático, devuelve index.html
app.get('*', (req, res) => {
  const distPath = path.join(__dirname, '../frontend/dist/index.html');
  const fs = require('fs');

  // Guard: if dist doesn't exist (dev mode), return helpful message
  if (!fs.existsSync(distPath)) {
    return res.status(200).json({
      ok: true,
      mode: 'dev',
      message: 'API running. Frontend is served by Vite dev server at :5173',
      api: '/api/*',
      health: '/api/health'
    });
  }

  res.sendFile(distPath);
});

// 👇 MANEJADOR DE ERRORES GLOBAL (Evita que el server muera en silencio)
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  // Log completo en servidor (con stack trace)
  console.error(`❌ [Global Error Handler] RequestID: ${requestId}`);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Determinar código de error apropiado
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta estandarizada al cliente (sin stack trace)
  res.status(statusCode).json({
    ok: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Algo salió mal en el servidor',
    requestId
  });
});

const PORT = process.env.PORT || 3000;

// Import dbInit removed in favor of explicit bootstrap logic
// const { dbInit } = require('./scripts/initProject');

async function bootstrap() {
  try {
    console.log('🚀 Iniciando servidor (Bootstrap)...');

    // 1. Conexión DB
    await conectarDB();
    console.log('✅ DB Conectada.');

    // 2. Sync / Migrations
    const mode = (process.env.DB_SYNC_MODE || 'none').toLowerCase();
    console.log(`🔧 DB_SYNC_MODE=${mode}`);

    if (mode === 'alter') {
      console.log('⚠️ Ejecutando sequelize.sync({ alter: true })');
      await sequelize.sync({ alter: true });
    } else if (mode === 'smart') {
      console.log('ℹ️ Ejecutando sequelize.sync() (Create only)');
      await sequelize.sync();
    } else if (mode === 'none') {
      console.log('🛡️ Skipping sync (Mode: none)');
    } else {
      console.warn(`⚠️ Modo desconocido '${mode}'. Se asume 'none'.`);
    }

    // 3. Iniciar CronJobs (Solo tras DB lista)
    // Se requiere aquí dentro para garantizar que los modelos estén listos y sincronizados
    const initCronJobs = require('./cronJobs');
    initCronJobs();
    console.log('✅ CronJobs inicializados.');

    // 4. Iniciar Worker de Emails (Async)
    const { startEmailWorker } = require('./workers/emailWorker');
    startEmailWorker();

    // 4. Levantar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });

  } catch (error) {
    console.error('❌ FATAL bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();