const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');

// ========================================
// 1. MIDDLEWARES BASE
// ========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
const requestLogger = require('./middleware/requestLogger');
app.use(requestLogger);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/FOLIOS_GENERADOS', express.static(path.join(__dirname, 'FOLIOS_GENERADOS')));

// Servir frontend (producción)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ========================================
// 2. RUTAS PÚBLICAS
// ========================================
app.get('/api', (req, res) => res.json({ status: 'online', message: 'API Pastelería v2.0' }));

// Health Check
const { sequelize } = require('./models');
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

// Auth (Login, Register) - PÚBLICO
app.use('/api/auth', require('./routes/authRoutes'));

// Webhooks - PÚBLICO
app.use('/api/webhooks', require('./routes/webhookRoutes'));

// Activation - PÚBLICO/SEMI-PROTEGIDO
app.use('/api/activation', require('./routes/activationRoutes'));

// ========================================
// 3. MIDDLEWARES DE SEGURIDAD
// ========================================
const authMiddleware = require('./middleware/authMiddleware');
const tenantScope = require('./middleware/tenantScope');
const requireBranch = require('./middleware/requireBranch');

// ========================================
// 4. RUTAS PROTEGIDAS
// ========================================

// Rutas que requieren Branch asignado (+ Auth + Tenant)
app.use('/api/folios', authMiddleware, tenantScope, requireBranch, require('./routes/folioRoutes'));
app.use('/api/clients', authMiddleware, tenantScope, requireBranch, require('./routes/clientRoutes'));
app.use('/api/catalog', authMiddleware, tenantScope, requireBranch, require('./routes/catalogRoutes'));
app.use('/api/ingredients', authMiddleware, tenantScope, requireBranch, require('./routes/ingredientRoutes'));
app.use('/api/production', authMiddleware, tenantScope, requireBranch, require('./routes/productionRoutes'));
app.use('/api/reports', authMiddleware, tenantScope, requireBranch, require('./routes/reportRoutes'));
app.use('/api/cash', authMiddleware, tenantScope, requireBranch, require('./routes/cashRoutes'));

// Rutas Semi-Protegidas (Solo Auth + Tenant, sin requireBranch)
app.use('/api/users', authMiddleware, tenantScope, require('./routes/userRoutes'));
app.use('/api/branches', authMiddleware, tenantScope, require('./routes/branchRoutes'));
app.use('/api/tenant', authMiddleware, tenantScope, require('./routes/tenantConfigRoutes'));
app.use('/api/upload', authMiddleware, tenantScope, require('./routes/uploadRoutes'));
app.use('/api/ai-sessions', authMiddleware, tenantScope, require('./routes/aiSessionRoutes'));
app.use('/api/pdf-templates', authMiddleware, tenantScope, require('./routes/pdfTemplateRoutes'));
app.use('/api/dictation', authMiddleware, tenantScope, require('./routes/dictationRoutes'));
app.use('/api/ai/draft', authMiddleware, tenantScope, require('./routes/aiDraftRoutes'));
app.use('/api/commissions', authMiddleware, tenantScope, require('./routes/commissionRoutes'));
app.use('/api/audit', authMiddleware, tenantScope, require('./routes/auditRoutes'));
app.use('/api/orders', authMiddleware, tenantScope, require('./routes/orderRoutes'));
app.use('/api/ai/orders', authMiddleware, tenantScope, require('./routes/aiOrderRoutes'));
app.use('/api/whatsapp', authMiddleware, tenantScope, require('./routes/whatsappRoutes'));

// SuperAdmin Routes
app.use('/api/super', authMiddleware, require('./routes/superAdminRoutes'));

// Legacy AI Adapter
app.post('/api/ai/session/message',
  authMiddleware,
  require('./controllers/aiSessionController').handleLegacyMessage
);

// ========================================
// 5. SWAGGER DOCUMENTATION
// ========================================
const { swaggerSpec, swaggerUi } = require('./docs/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
console.log('📄 Swagger Docs available at /api/docs');

// ========================================
// 6. FALLBACK SPA (React Router)
// ========================================
app.get('*', (req, res) => {
  const distPath = path.join(__dirname, '../frontend/dist/index.html');
  const fs = require('fs');

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

// ========================================
// 7. MANEJADOR DE ERRORES GLOBAL
// ========================================
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  console.error(`❌ [Global Error Handler] RequestID: ${requestId}`);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    ok: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Algo salió mal en el servidor',
    requestId
  });
});

// ========================================
// 8. BOOTSTRAP & SERVER START
// ========================================
const PORT = process.env.PORT || 3000;
const { conectarDB } = require('./config/database');

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
    } else if (mode === 'force') {
      console.log('🔥 CRITICAL: Ejecutando sequelize.sync({ force: true })');
      await sequelize.sync({ force: true });
    } else if (mode === 'smart') {
      console.log('ℹ️ Ejecutando sequelize.sync() (Create only)');
      await sequelize.sync();
    } else if (mode === 'none') {
      console.log('🛡️ Skipping sync (Mode: none)');
    } else {
      console.warn(`⚠️ Modo desconocido '${mode}'. Se asume 'none'.`);
    }

    // 3. Iniciar CronJobs
    const initCronJobs = require('./cronJobs');
    initCronJobs();
    console.log('✅ CronJobs inicializados.');

    // 4. Iniciar Worker de Emails
    const { startEmailWorker } = require('./workers/emailWorker');
    startEmailWorker();

    // 5. Levantar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });

  } catch (error) {
    console.error('❌ FATAL bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();