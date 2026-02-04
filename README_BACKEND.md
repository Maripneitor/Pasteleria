# Backend - Pastelería La Fiesta

Documentación técnica para despliegue y desarrollo del backend.

## 📋 Requisitos Pre-requisitos
- **Docker** y **Docker Compose** instalados.
- **Node.js 20+** (si se corre local sin Docker).

## 🚀 Guía de Inicio Rápido

### 1. Configuración de Entorno
Copia el archivo de ejemplo y ajusta según necesites:
```bash
cp .env.example .env
```
*(Asegúrate de configurar `DB_SYNC_MODE=smart` si es la primera vez que arrancas localmente)*.

### 2. Arranque con Docker (Recomendado)
Levanta la base de datos y el backend:
```bash
docker compose up --build -d
```
El backend estará disponible en `http://localhost:3000`.

### 3. Verificar Salud del Sistema
Comprueba que la API y la DB están conectadas:
```bash
curl http://localhost:3000/api/health
# Respuesta esperada: {"ok":true,"db":"up",...}
```

## 🛠️ Scripts de QA y Testing

Hemos estandarizado los comandos de Quality Assurance en el `package.json`.

### Smoke Test
Verifica que el servidor responde y los componentes básicos cargan.
```bash
# Desde carpeta backend/
npm run qa:smoke
```

### Contrato de API (Verify Contract)
Valida que los endpoints críticos devuelvan el formato JSON esperado.
```bash
# Desde carpeta backend/
npm run qa:contract
```

## 🆘 Troubleshooting

### La Base de Datos no se inicializa
El script de inicialización (`backup_2025-09-30.sql`) **solo se ejecuta si el volumen de MySQL está vacío**.
Si necesitas un reset completo (¡CUIDADO! Borra datos):
```bash
docker compose down -v
docker compose up --build
```

### Errores de "Role" o Auth
El sistema crea automáticamente un admin si no existe al arrancar (`server.js` -> `initProject`).
Credenciales por defecto (ver logs de arranque):
- User: `admin@gmail.com` (o lo definido en `.env`)
- Pass: `Admin1234`

### "Waiting for mysql..." loop
Asegúrate de que en tu `.env` coincidan `DB_PASSWORD` con lo que espera MySQL. Si cambiaste variables después de crear el volumen, haz un `docker compose down -v`.
