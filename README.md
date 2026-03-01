# 🎂 Pastelería La Fiesta - Sistema de Gestión

Sistema integral para la gestión de pedidos, clientes y reportes de la pastelería. Construido con un enfoque de alto rendimiento, multi-tenencia y una interfaz de usuario moderna y fluida.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 19 + Vite
- **Estilos:** Tailwind CSS 3.4
- **Animaciones:** Framer Motion 12
- **UI Components:** Lucide React, Recharts, FullCalendar
- **Gestión:** React Hook Form, Context API

### Backend
- **Core:** Node.js (v24+) + Express
- **Base de Datos:** MySQL + Sequelize (ORM)
- **Generación de Documentos:** Puppeteer (para PDFs de alta fidelidad), PDFKit (ligero)
- **Integraciones:** WhatsApp Web.js (Notificaciones), OpenAI (Asistente IA Voice-to-Order)

---

## 🚀 Cómo Correr el Proyecto

### Opción A: Con Docker (Recomendado)
Esta opción levanta automáticamente el Frontend, Backend y la Base de Datos.

1.  **Iniciar Entorno:**
    ```bash
    docker compose up -d --build
    ```
2.  **Inicializar Datos (Seeding):**
    Para cargar el catálogo de prueba, sucursales y roles:
    ```bash
    docker compose exec backend npm run seed:full
    ```
3.  **Credenciales por Defecto:**
    - **SuperAdmin:** `admin@macair.com` / `admin123`
    - **Owner:** `owner@demo.com` / `admin123`
4.  **Limpiar Entorno:**
    ```bash
    docker compose down -v
    ```

### Opción B: Con NPM (Desarrollo Local)
Necesitarás tener una instancia de MySQL corriendo localmente.

#### 1. Backend
1.  Entra a la carpeta: `cd backend`
2.  Instala dependencias: `npm install`
3.  Configura tu archivo `.env` (usa `.env.example` como base).
4.  Inicia el servidor: `npm run dev`

#### 2. Frontend
1.  Entra a la carpeta: `cd frontend`
2.  Instala dependencias: `npm install`
3.  Inicia la aplicación: `npm run dev`

---

## 🧪 Comandos Útiles

### Gestión de Datos
- `npm run seed:full`: Carga todos los datos iniciales (Roles, HQ, Catálogo).
- `npm run fix:db`: Intenta reparar inconsistencias en la BD.

### QA y Pruebas
- `npm run qa:smoke`: Ejecuta pruebas rápidas de conexión y salud.
- `npm run qa:contract`: Verifica que los endpoints respondan con el formato correcto.
- `npm run qa:full`: Simulación de flujo completo de pedidos por roles.

---

## 🎨 Sistema Visual y Vistas
La aplicación utiliza una estética **"Vibrant & Clean"**:
- **Colores:** Rosa intenso (`#ec4899`) para la marca y Violeta (`#8b5cf6`) para funciones de IA.
- **Micro-interacciones:** Uso de `Framer Motion` para transiciones suaves y efectos de escala en botones.
- **Vistas Principales:**
  - **Dashboard:** KPIs en tiempo real y gráficos de ventas.
  - **Wizard de Pedidos:** Proceso guiado de 6 pasos para captura de folios.
  - **Producción:** Tablero estilo Kanban para seguimiento de estados (Pendiente, Decoración, Terminado).

---

## 🔧 Troubleshooting Típico
- **Error de conexión a BD:** Asegúrate de que el puerto 3307 (Docker) o 3306 (Local) no esté ocupado.
- **PDFs no se generan:** Verifica que las dependencias de Puppeteer estén instaladas correctamente en tu sistema si corres sin Docker.
- **Limpieza profunda:** `docker compose down -v` eliminará incluso la base de datos para un inicio desde cero.
