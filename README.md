# 🎂 Sistema de Gestión - Pastelería La Fiesta

Bienvenido al sistema integral de gestión para pastelerías. Este proyecto es una solución SaaS multi-inquilino con soporte para múltiples sucursales, facturación, reportes en PDF e integración con IA.

---

## 🚀 Inicio Rápido (Docker)

La forma más rápida y recomendada de correr el proyecto es usando Docker.

### 1. Preparar el Entorno

Copia el archivo de ejemplo y ajusta tus credenciales (especialmente las llaves de API si las tienes):

```bash
cp .env.example .env
```

_(Nota: El sistema tiene valores por defecto seguros para desarrollo local si prefieres no crear el .env inmediatamente)._

### 2. Encender Motores

Levanta todo el ecosistema (Base de Datos, Backend y Frontend):

```bash
docker compose up -d --build
```

### 3. Inicializar Datos (Seed)

Si es la primera vez, inyecta los usuarios administrador y el catálogo base:

```bash
docker compose exec backend npm run seed:full
```

**Credenciales por defecto:**

- **SuperAdmin:** `superadmin@lafiesta.com` / `admin123`
- **Owner Demo:** `owner@demo.com` / `admin123`

---

## 🛠️ Desarrollo y Comandos Útiles

### URLs del Sistema

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Documentación Swagger:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Comandos de Control (Docker)

| Acción                   | Comando                                        |
| :----------------------- | :--------------------------------------------- |
| Detener sistema          | `docker compose down`                          |
| Ver Logs Backend         | `docker compose logs -f backend`               |
| Reiniciar Base de Datos  | `docker compose exec backend npm run db:reset` |
| Ejecutar Pruebas (Smoke) | `docker compose exec backend npm run qa:smoke` |

### Desarrollo Local (Sin Docker)

1. **Backend**:
   ```bash
   cd backend && npm install && npm run dev
   ```
2. **Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```

---

## 🛡️ Calidad y Seguridad (QA)

El sistema incluye una suite de pruebas de "Humo" (Smoke Tests) para validar la integridad:

1. **Seguridad (RBAC)**: Valida que los roles (Admin/Empleado) estén aislados.
   ```bash
   docker compose exec backend node scripts/qa/error_handling.js
   ```
2. **Generación de PDFs**: Verifica que el motor de Puppeteer esté listo.
   ```bash
   docker compose exec backend node scripts/qa/test_api_pdf.js
   ```

---

## 🗝️ Archivos Importantes

- `.env`: Configuración maestra de secretos.
- `ARCHIVOS_LLAVE.md`: Registro de configuraciones críticas y recuperación de sesiones de WhatsApp.
- `docker-compose.yml`: Orquestación de contenedores.

---

## 👨‍💻 Mejores Prácticas Aplicadas

- **Multi-tenancy**: Aislamiento estricto de datos por `tenantId`.
- **Zero-Config**: Listo para levantar en cualquier máquina con Docker.
- **Auditoría**: Registro de todas las acciones críticas en `AuditLogs`.
- **Escalabilidad**: Arquitectura preparada para múltiples sucursales y gran volumen de pedidos.
