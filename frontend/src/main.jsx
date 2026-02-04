import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
