These are the commands to start the project:

### Start Project
1. `docker-compose up --build`

### Stop Project
1. `docker-compose down`

### Prerequisites
- Docker and Docker Compose installed.
- Docker Desktop (or engine) running.

---

### 🔧 Development with HTTPS / Proxy (ngrok)

If you are using a reverse proxy (like ngrok) or need HTTPS for local development, you must configure the Vite HMR WebSocket connection to point to your public URL.

Add these variables to your environment (or `docker-compose.yml` -> `client` service):

- **VITE_HMR_PORT**: The public port (e.g., `443` for ngrok/https).
- **VITE_HMR_HOST**: The public domain (e.g., `xxxx.ngrok-free.app`).
- **VITE_HMR_PROTOCOL**: `wss` (secure) or `ws`.

**Example in docker-compose.yml:**
```yaml
  client:
    environment:
      - VITE_HMR_PORT=443
      - VITE_HMR_HOST=mi-tunel.ngrok-free.app
      - VITE_HMR_PROTOCOL=wss
```

For standard local development (`http://localhost:5173`), NO configuration is needed.