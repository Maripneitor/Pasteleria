# 🎂 Sistema de Gestión - Pastelería La Fiesta

Bienvenido al sistema integral de gestión para pastelerías. Este proyecto es una solución SaaS multi-inquilino con soporte para múltiples sucursales, facturación, reportes en PDF e integración con IA.

---

## 🚀 Inicio Rápido (Docker) — Zero Config

> **Requisitos:** Solo necesitas tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 1. Clonar y preparar el entorno
```bash
git clone https://github.com/Maripneitor/Pasteleria.git
cd Pasteleria
cp .env.example .env
```

### 2. Levantar todo el stack
```bash
docker compose up -d --build
```
Esto levanta automáticamente:
- 🗄️ **MySQL 8** (Base de datos)
- ⚙️ **Backend** (Node.js + Express) — sincroniza esquema y seeds automáticamente
- 🎨 **Frontend** (Vite + React) — servidor de desarrollo con HMR
- 💬 **WhatsApp Gateway** (Opcional — Puppeteer + WWebJS)

### 3. Cargar catálogo demo (solo la primera vez)
```bash
docker compose exec backend npm run seed:full
```

### 4. ¡Listo! Abre tu navegador
- **Aplicación:** [http://localhost:5173](http://localhost:5173)
- **API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Swagger Docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

**Credenciales por defecto:**

| Rol | Email | Contraseña |
|:---|:---|:---|
| Super Admin | `admin@gmail.com` | `Admin1234` |
| Mario Dev | `mario@dev.com` | `mario123` |
| Owner Demo | `owner@demo.com` | `admin123` |
| Empleado | `empleado@demo.com` | `admin123` |

---

## 🛠️ Comandos Útiles

| Acción | Comando |
|:---|:---|
| Levantar todo | `docker compose up -d --build` |
| Detener sistema | `docker compose down` |
| Ver logs backend | `docker compose logs -f backend` |
| Ver logs frontend | `docker compose logs -f frontend` |
| Seed completo | `docker compose exec backend npm run seed:full` |
| Reiniciar BD limpia | `docker compose down -v` luego `docker compose up -d --build` |
| Ejecutar pruebas QA | `docker compose exec backend npm run qa:smoke` |

---

## 📁 Estructura del Proyecto

```
├── backend/           # API Node.js + Express + Sequelize
│   ├── models/        # Modelos Sequelize (fuente de verdad del esquema)
│   ├── src/modules/   # Módulos de negocio (folios, users, cash, etc.)
│   ├── scripts/       # Scripts de utilidad (seeds, QA)
│   └── server.js      # Entry point
├── frontend/          # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── features/  # Módulos por dominio (auth, folios, cash, etc.)
│   │   ├── components/# Componentes reutilizables
│   │   ├── context/   # React Context (Auth, Order)
│   │   └── App.jsx    # Router principal
│   └── vite.config.js # Configuración con proxy al backend
├── docker-compose.yml # Orquestación de servicios
├── .env.example       # Variables de entorno (copiar a .env)
└── README.md
```

---

## 🔧 Desarrollo Local (Sin Docker)

Si prefieres desarrollar sin Docker:

1. **Base de datos:** Tener MySQL 8 corriendo localmente.
2. **Backend:**
   ```bash
   cd backend && npm install
   # Ajustar DB_HOST=localhost en .env
   node scripts/qa/sync_db.js    # Crear tablas
   npm run seed:full              # Datos iniciales
   npm run dev                    # Servidor en :3000
   ```
3. **Frontend:**
   ```bash
   cd frontend && npm install && npm run dev  # Servidor en :5173
   ```

---

## 🛡️ Calidad y Seguridad (QA)

- **Multi-tenancy**: Aislamiento estricto de datos por `tenantId`.
- **RBAC**: Roles (SUPER_ADMIN, ADMIN, OWNER, EMPLOYEE) con guardias en rutas.
- **Auditoría**: Registro de todas las acciones críticas en `AuditLogs`.
- **Error Boundary**: Captura errores en frontend sin colapsar la app.
- **Healthcheck**: El backend tiene `/api/v1/health` con verificación de BD.

---

## 🗝️ Archivos Importantes
- `.env` — Configuración de secretos (NO se sube a Git).
- `.env.example` — Template con todas las variables necesarias.
- `docker-compose.yml` — Orquestación completa del stack.

---

## ⚠️ Notas
- Las variables `OPENAI_API_KEY` y `EMAIL_*` son opcionales. Sin ellas, las funciones de IA y notificaciones por correo estarán deshabilitadas, pero el sistema funciona normalmente.
- El frontend se sirve en modo desarrollo (HMR) vía Docker. Para producción, ejecutar `npm run build` dentro del contenedor frontend.
