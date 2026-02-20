# 🎂 Pastelería La Fiesta - Sistema de Gestión

Sistema integral para la gestión de pedidos, clientes y reportes de la pastelería. Construido con un enfoque de alto rendimiento, multi-tenencia y confiabilidad.

## 🛠️ Stack Tecnológico
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Base de Datos:** MySQL + Sequelize (ORM)
- **Infraestructura:** Docker & Docker Compose
- **Calidad:** Puppeteer (PDFs), Jest/Node Test Runner (QA Smoke)

---

## 🚀 Guía de Inicio Rápido (Docker)

Esta es la forma recomendada para levantar todo el entorno (Backend + DB + Frontend) en segundos.

### 1. Iniciar Entorno
```bash
docker compose up -d --build
```

### 2. Inicializar Datos (Seeding)
Para cargar datos de prueba (HQ, Sucursales, Roles y Catálogo):
```bash
docker compose exec backend npm run seed:full
```
- **SuperAdmin:** `admin@macair.com` / `admin123`
- **Owner:** `owner@demo.com` / `admin123`

### 3. Verificar Salud del Sistema
```bash
docker compose exec backend npm run qa:smoke
```

---

## 🛠️ Comandos Globales (Root)
Si tienes Node instalado localmente, puedes usar estos atajos desde la raíz:
- `npm run dev`: Levanta todo con Docker Compose.
- `npm run stop`: Detiene los contenedores.
- `npm run clean`: Detiene y borra volúmenes (reset DB).
- `npm run seed`: Ejecuta el seeding de datos.
- `npm run test`: Corre los smoke tests.

---

## 💻 Desarrollo Local (Sin Docker)

Si prefieres trabajar fuera de contenedores:

### Backend
1. `cd backend`
2. `npm install`
3. Configura el `.env` (basado en `.env.example`).
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 📄 Estrategia de Generación de PDFs

Para la generación de documentos (facturas, reportes, tickets), seguimos estas tres estrategias dependiendo de la necesidad:

### 1. Generación en el Cliente (Frontend)
Ideal para descargas rápidas de lo que el usuario ve en pantalla.
- **Lib:** `html2pdf.js`
- **Uso:** "Foto" del DOM -> Canvas -> PDF.
- **Ventaja:** No satura el servidor.

### 2. Generación en el Servidor (Backend con Node.js)
Para reportes pesados, facturas oficiales o procesos desatendidos.
- **Puppeteer:** Navegador "Headless". Alta fidelidad (CSS moderno).
- **PDFKit:** Dibujo manual por código. Ultra ligero, ideal para miles de páginas de texto simple.

### 3. El Secreto: Headers Correctos
Independientemente del método, el servidor debe enviar:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="archivo.pdf"`

---

## 🧪 Calidad y Diagnóstico (QA)

### Smoke Tests & Contratos
```bash
# Verificar respuesta de endpoints críticos
docker compose exec backend npm run qa:contract

# Probar flujo completo de pedidos
docker compose exec backend npm run qa:full
```

### Modo Diagnóstico
Habilita `VITE_DEBUG_MODE=true` en el cliente para ver el panel de Request IDs y errores técnicos en tiempo real.

---

## 🔧 Gestión y Mantenimiento

### Reparación de DB (Sincronización)
Si cambias el esquema y necesitas forzar la sincronización:
```bash
# En docker-compose.yml o .env usa:
DB_SYNC_MODE=smart # (Recomendado para desarrollo)
```

### Troubleshooting Típico
- **DB no inicia:** `docker compose down -v` para limpiar volúmenes y reiniciar.
- **Puerto ocupado:** Asegúrate de no tener otro local MySQL en el 3307 o App en el 3000.

### 🌐 Desarrollo con HTTPS / Proxy (ngrok)
Si usas ngrok, configura las variables en `docker-compose.yml` para el servicio `client`:
- **VITE_HMR_PORT**: `443`
- **VITE_HMR_HOST**: `tu-url.ngrok-free.app`
- **VITE_HMR_PROTOCOL**: `wss`

---

## 📦 Control de Versiones (Git)
Para un despliegue rápido y commit:
```bash
git add .
git commit -m "v.x.x.x-Descripción"
git push origin main
```
