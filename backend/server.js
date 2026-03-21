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

// Security Headers (Helmet)
const helmet = require('helmet');
app.use(helmet());

// Rate Limiting para Login
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Maximo 10 intentos
  message: { ok: false, message: 'Demasiados intentos de inicio de sesión, por favor intenta en unos minutos.' }
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/FOLIOS_GENERADOS', express.static(path.join(__dirname, 'FOLIOS_GENERADOS')));

// Servir frontend (producción)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ========================================
// 2. RUTAS PÚBLICAS (v1)
// ========================================
const v1Router = express.Router();
app.use('/api/v1', v1Router);

// Fallback legacy (opcional)
app.use('/api', (req, res, next) => {
  if (req.path === '/') return res.json({ status: 'online', message: 'API Pastelería v2.0', version: 'v1' });
  next();
});

// Health Check (v1)
const { sequelize } = require('./models');
v1Router.get('/health', async (req, res) => {
  try {
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    res.json({
      ok: true,
      db: results[0].result === 2 ? "up and responsive" : "unknown",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ ok: false, db: "down", error: error.message });
  }
});

// Auth (Login, Register) - PÚBLICO
v1Router.use('/auth', require('./src/modules/users/auth.routes'));

// Webhooks - PÚBLICO
v1Router.use('/webhooks', require('./src/modules/webhooks/webhook.routes'));

// Activation - PÚBLICO/SEMI-PROTEGIDO
v1Router.use('/activation', require('./src/modules/activation/activation.routes'));

// ========================================
// 3. MIDDLEWARES DE SEGURIDAD
// ========================================
const authMiddleware = require('./middleware/authMiddleware');
const tenantScope = require('./middleware/tenantScope');
const requireBranch = require('./middleware/requireBranch');

// ========================================
// 4. RUTAS PROTEGIDAS (v1)
// ========================================

// 📦 MODULOS MODERNIZADOS (NUEVA ARQUITECTURA)
v1Router.use('/folios', require('./src/modules/folios/folio.routes'));
v1Router.use('/users', require('./src/modules/users/user.routes'));
v1Router.use('/catalogs', require('./src/modules/catalogs/catalog.routes'));
v1Router.use('/clients', require('./src/modules/clients/client.routes'));
v1Router.use('/cash', require('./src/modules/cash/cash.routes'));
v1Router.use('/reports', require('./src/modules/reports/report.routes'));
v1Router.use('/whatsapp', require('./src/modules/whatsapp/whatsapp.routes'));
v1Router.use('/production', require('./src/modules/production/production.routes'));
v1Router.use('/branches', require('./src/modules/branches/branch.routes'));
v1Router.use('/tenant', require('./src/modules/tenant/tenant.routes'));
v1Router.use('/upload', require('./src/modules/upload/upload.routes'));
v1Router.use('/pdf-templates', require('./src/modules/pdf-templates/pdf-template.routes'));
v1Router.use('/dictation', require('./src/modules/dictation/dictation.routes'));
v1Router.use('/ai-sessions', require('./src/modules/ai-sessions/ai-session.routes'));
v1Router.use('/ai/draft', require('./src/modules/ai-draft/ai-draft.routes'));
v1Router.use('/ai/orders', require('./src/modules/ai-orders/ai-order.routes'));
v1Router.use('/commissions', require('./src/modules/commissions/commission.routes'));
v1Router.use('/audit', require('./src/modules/audit/audit.routes'));
v1Router.use('/super', require('./src/modules/superadmin/superadmin.routes'));

// ========================================
// 5. SWAGGER DOCUMENTATION
// ========================================
const { swaggerSpec, swaggerUi } = require('./docs/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

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
      api: '/api/v1/*',
      health: '/api/v1/health'
    });
  }

  res.sendFile(distPath);
});

// ========================================
// 7. MANEJADOR DE ERRORES GLOBAL
// ========================================
const errorHandler = require('./src/middlewares/errorHandler');
app.use(errorHandler);

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

    await sequelize.sync(); 
    console.log('🛡️ Sincronización automática de BD ajustada (alter: false).');

    // 👇 LO NUEVO CORREGIDO
    console.log('📱 Encendiendo motor de WhatsApp...');
    const gateway = require('./whatsapp-gateway'); 
    
    // Usamos restart() porque así lo tienes en tu código original
    if (gateway.restart) {
        await gateway.restart(); 
    }
    console.log('✅ WWebJS vinculado al servidor.');
    // 👆 FIN DE LO NUEVO
    
    // 3. Iniciar CronJobs
    const initCronJobs = require('./cronJobs');
    initCronJobs();
    console.log('✅ CronJobs inicializados.');

    // 4. Iniciar Worker de Emails
    const { startEmailWorker } = require('./workers/emailWorker');
    startEmailWorker();

    // 5. Pre-warm Puppeteer (Motor de PDF)
    console.log('📄 Inicializando motor de PDFs en memoria (Singleton)...');
    try {
      const { initBrowser } = require('./services/pdfRenderer');
      await initBrowser();
      console.log('✅ Motor de PDFs listo y reciclado.');
    } catch (pdfErr) {
      console.error('⚠️ Advertencia: No se pudo arrancar Puppeteer en background:', pdfErr.message);
    }

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