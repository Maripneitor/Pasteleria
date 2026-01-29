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

// 👇 RUTAS MAESTRAS (Prefijo sagrado '/api')
app.get('/api', (req, res) => res.json({ status: 'online', message: 'API Pastelería v2.0' }));

// ✅ Paso 1: Registrar rutas de autenticación
app.use('/api/auth', authRoutes);

app.use('/api/folios', folioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/webhooks', whatsappRoutes);
app.use('/api/ai-sessions', aiSessionRoutes);

// Ruta de Salud (Para verificar que el server vive)
app.get('/api/', (req, res) => res.send('API Pastelería Funcionando 🍰'));

// 👇 MANEJADOR DE ERRORES GLOBAL (Evita que el server muera en silencio)
app.use((err, req, res, next) => {
  console.error("❌ Error del Servidor:", err.stack);
  res.status(500).json({ message: "Algo salió mal en el servidor", error: err.message });
});

const PORT = process.env.PORT || 3000;
// Sincronización DB y arranque
sequelize.sync({ force: false }).then(() => {
  console.log('🔄 BD Sincronizada');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  });
});