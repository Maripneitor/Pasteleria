import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      host: true, // Necesario para Docker
      port: 5173,
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
