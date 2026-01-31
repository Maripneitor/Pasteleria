import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prioritize system env (Docker) over .env files, fallback to localhost for local dev
  const target = process.env.VITE_PROXY_TARGET || env.VITE_PROXY_TARGET || 'http://localhost:3000'

  console.log(`[Vite] Proxy Configuration: Target -> ${target}`);

  return {
    plugins: [react()],
    server: {
      host: true, // Permite conexiones externas al contenedor
      port: 5173,
      strictPort: true,
      allowedHosts: [
        'soren-nonpresentational-incongrously.ngrok-free.dev',
        '.ngrok-free.app',
        '.ngrok-free.dev'
      ],
      hmr: {
        clientPort: 443, // Forzamos a HMR a usar el puerto de ngrok (HTTPS)
      },
      proxy: {
        '/api': {
          target, // 'server' es el nombre del servicio en docker-compose, o localhost si es local
          changeOrigin: true,
          secure: false,
        }
      },
      watch: {
        usePolling: true // Necesario para que Docker detecte cambios en Windows/Mac
      }
    }
  }
})
