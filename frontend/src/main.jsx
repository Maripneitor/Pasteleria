import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
// FullCalendar v6 does not require manual CSS imports (files verified missing in node_modules)

import { AuthProvider } from './context/AuthContext'

// Filtro para limpiar logs de React DevTools en desarrollo/pruebas
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('React DevTools')) {
    return;
  }
  originalConsoleError(...args);
};

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

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
