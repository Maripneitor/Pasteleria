import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
// FullCalendar v6 does not require manual CSS imports (files verified missing in node_modules)

import { AuthProvider } from './context/AuthContext'

// Filtro para limpiar logs de React DevTools en desarrollo
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const devToolsFilter = (msg) =>
    typeof msg === 'string' &&
    (msg.includes('React DevTools') || msg.includes('react.dev/link/react-devtools') || msg.includes('Download the React DevTools'));

  console.error = (...args) => {
    if (devToolsFilter(args[0])) return;
    originalConsoleError(...args);
  };
  console.warn = (...args) => {
    if (devToolsFilter(args[0])) return;
    originalConsoleWarn(...args);
  };
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure React Query with reasonable defaults for a production app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Reintentos en caso de fallo (Exponential Backoff implícito)
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false, // Menos agresivo para no sobrecargar
      staleTime: 5 * 60 * 1000, // 5 minutos de caché por defecto
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
      {/* Devtools: Estarán ocultas en producción automáticamente y solo son visibles en dev mode */}
    </QueryClientProvider>
  </React.StrictMode>,
)
