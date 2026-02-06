# Sistema de Gestión para Pastelería

## 🚀 Quickstart Docker (Recomendado)

### 1. Iniciar Entorno Completo (Backend + DB + Frontend)
```bash
docker compose up -d --build
```

### 2. Verificar Salud del Sistema (QA Smoke)
```bash
docker compose exec backend npm run qa:smoke
```

### 3. Verificar Contratos de API (QA Contract)
```bash
docker compose exec backend npm run qa:contract
```

### 🔄 Modos de Sincronización DB (Importante)
El proyecto usa `DB_SYNC_MODE` en `docker-compose.yml` para controlar cambios en el esquema:
- **`none`**: (Default SAFE) No toca el esquema. Recomendado para Producción y CI.
- `smart`: Agrega columnas faltantes automáticamente. Ideal para desarrollo local.
- `alter`: Usa `sequelize.sync({ alter: true })`. Uso legacy.

**Para desarrollo local (habilitar smart sync):**
1. Copia el ejemplo: `cp docker-compose.override.example.yml docker-compose.override.yml`
2. Reinicia: `docker compose up -d`


---

### Desarrollo Local (Sin Docker)
Si prefieres correr localmente:
1. **DB**: Asegúrate de tener MySQL corriendo y configura `.env`.
2. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🛡️ Confiabilidad y Diagnóstico

### Correr Pruebas Automatizadas
Para verificar que el flujo de creación de pedidos funciona correctamente:

```bash
# Desde la carpeta raíz
node --test server/tests/order_flow.test.js
```
*Tip: Asegúrate de que el servidor backend esté corriendo en el puerto 3000.*

### Modo Diagnóstico
Para ver detalles técnicos en la interfaz (requestId, errores de API en tiempo real):

1. Habilita el modo diagnóstico en `.env` del cliente o servidor:
   ```env
   # Frontend (client/.env)
   VITE_DEBUG_MODE=true
   
   # Backend (server/.env)
   DEBUG_ORDER_FLOW=true
   ```
2. En la UI, aparecerá un panel flotante con la actividad de red.

---

## 🧪 Smoke Test Manual (Guía Rápida)

Para validar manualmente que el sistema está operativo después de un despliegue:

1. **Login**: Entra con usuario `admin@gmail.com`.
2. **Crear Pedido**: Ir a "Nuevo Pedido".
   - Cliente: "Prueba Smoke"
   - Teléfono: "5551234567"
   - Fecha: Mañana
   - Selecciona 1 sabor (Chocolate)
   - Da clic en "Crear Pedido".
   - **Esperado**: Redirección a dashboard/lista o mensaje de éxito.
3. **Verificación**:
   - Ve a "Recientes" en el Dashboard.
   - Confirma que aparece "Prueba Smoke".
4. **Validación de Errores**:
   - Intenta crear un pedido sin nombre de cliente.
   - **Esperado**: Toast rojo "Falta: cliente_nombre" y (si Debug Mode ON) detalle del Request ID.

### ✅ Lista de Errores Típicos Cubiertos
- **401 Unauthorized**: Intento de creación sin token válido.
- **400 Validación**: Payload incompleto (falta nombre, fecha, etc.).
- **500 Internal Error**: Fallos de BD capturados con Stack Trace (visible solo en server logs).
- **Tenant Scope Mismatch**: Prevención de acceso cruzado entre sucursales (Admin vs Owner).

### 📋 Checklist de Regresión Final (10 Puntos)
1.  [ ] Login exitoso con Admin y Owner.
2.  [ ] Creación de pedido (flujo normal).
3.  [ ] Persistencia: El pedido aparece en "Recientes".
4.  [ ] Calendario: El pedido aparece en la fecha correcta.
5.  [ ] Validación: El sistema bloquea pedidos sin nombre de cliente.
6.  [ ] Diagnóstico: `DEBUG_ORDER_FLOW=true` muestra logs detallados.
7.  [ ] Frontend: Panel de Diagnóstico muestra Request ID ante errores.
8.  [ ] Auth: Token expirado redirige a Login.
9.  [ ] PDF: Generación de reporte de pedido funciona (si aplica).
10. [ ] Docker: Los contenedores se levantan sin `EADDRINUSE`.
