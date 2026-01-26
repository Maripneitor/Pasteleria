require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { conectarDB } = require('./config/database');

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const folioRoutes = require('./routes/folioRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const aiSessionRoutes = require('./routes/aiSessionRoutes');

require('./cronJobs');

const app = express();
const PORT = process.env.PORT || 3000;

conectarDB();

// --- MIDDLEWARES ---
// 1. CORS: Permitir que el Frontend (puerto 5173) hable con este Backend
app.use(cors({
  origin: 'http://localhost:5173', // Puerto por defecto de Vite
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Archivos Estáticos (Solo para uploads/pdfs generados, NO para el frontend web)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/FOLIOS_GENERADOS', express.static(path.join(__dirname, 'FOLIOS_GENERADOS')));

// --- RUTAS API ---
app.use('/api/auth', authRoutes);
app.use('/api/folios', folioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/webhooks', whatsappRoutes);
app.use('/api/ai-sessions', aiSessionRoutes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Pastelería La Fiesta v2.0 (Mode: Headless)' });
});

// Sincronización
sequelize.sync({ force: false }).then(() => {
  console.log('🔄 BD Sincronizada');
  app.listen(PORT, () => {
    console.log(`🚀 API Backend corriendo en http://localhost:${PORT}`);
  });
});