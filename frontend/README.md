# Documentación del Frontend Antiguo - Pastelería "La Fiesta"

Este documento contiene la información técnica y visual necesaria para replicar fielmente el frontend de la aplicación. Se enfoca en el stack, diseño, componentes y estructura de navegación, permitiendo su reconstrucción en un nuevo entorno.

---

## 1. Framework y Librerías Utilizadas

El proyecto está construido sobre un stack moderno de React centrado en el rendimiento y la experiencia de usuario (UX).

*   **Framework Principal:** `React 19` (usando `Vite` como build tool).
*   **Enrutamiento:** `React Router Dom v7`.
*   **Estilos y UI:**
    *   `Tailwind CSS v3.4`: Sistema principal de utilidades.
    *   `Lucide React`: Set de iconos ligero y consistente.
    *   `Framer Motion v12`: Motor de animaciones para transiciones y micro-interacciones.
    *   `Tailwind Merge` & `Clsx`: Gestión dinámica de clases CSS.
*   **Componentes Especializados:**
    *   `FullCalendar`: Para la visualización de agendas de producción.
    *   `Recharts`: Generación de gráficos de estadísticas (ventas, sabores populares).
    *   `React Hook Form`: Gestión robusta de formularios (especialmente en el Wizard).
    *   `React Hot Toast`: Sistema de notificaciones tipo "toast".
    *   `React Datepicker`: Selector de fechas personalizado.
    *   `html2pdf.js`: Generación de reportes y folios en PDF desde el cliente.

---

## 2. Sistema Visual (Design System)

La aplicación utiliza una estética "vibrant & clean" con colores cálidos que evocan el sector de la pastelería.

### Paleta de Colores
*   **Primario:** `#ec4899` (Rosa-500) - Usado para acciones principales y marca.
*   **Primario Dark:** `#be185d` (Rosa-700) - Usado para estados hover.
*   **Secundario:** `#8b5cf6` (Violeta-500) - Usado para elementos de IA y acentos secundarios.
*   **Fondo de App:** `#f3f4f6` (Gris suave) - Proporciona profundidad.
*   **Fondo de Sidebars/Cards:** `#ffffff` (Blanco puro).
*   **Textos:** `#111827` (Gris muy oscuro para títulos), `#4b5563` (Gris medio para descripciones).

### Tipografía y Espaciado
*   **Fuente:** `Inter`, system-ui, sans-serif. Se prioriza la legibilidad.
*   **Tamaños:**
    *   Títulos de Página: `text-2xl` o `text-3xl`, font-extrabold.
    *   Label de Inputs: `text-xs`, font-bold, uppercase.
    *   Texto base: `text-sm` o `text-base`.
*   **Espaciado:** Uso intensivo de `p-4` a `p-8` para dar aire entre elementos.

### Estilos Generales
*   **Bordes:** Redondeado generoso (`rounded-xl` o `rounded-2xl`).
*   **Sombras:** `shadow-sm` para cards, `shadow-lg` (con color) para botones activos.
*   **Efectos:**
    *   **Glassmorphism:** Fondo blanco con transparencia (90%) y desenfoque (`backdrop-filter: blur(10px)`).
    *   **Gradientes:** Uso de gradientes de Rosa a Rojo para el logo y botones especiales de IA.

---

## 3. Componentes y Elementos UI

### Componentes de Navegación
*   **MainLayout:** Estructura de "Sidebar Izquierdo" fijo (260px) con contenido desplazable a la derecha.
*   **Sidebar Nav:** Enlaces con iconos, estados activos con borde derecho de 4px y fondo rosa suave.

### Elementos Interactivos
*   **Botones (Variants):**
    *   *Primary:* Fondo rosa, texto blanco, sombra rosa suave. Efecto `active:scale-95`.
    *   *Secondary:* Borde gris claro, fondo blanco, texto oscuro.
    *   *Ghost:* Sin fondo ni borde, solo texto que cambia a gris suave al hover.
*   **Inputs (InputGroup):**
    *   Contenedores con fondo gris claro (`bg-gray-50`) y borde redondeado XL.
    *   Efecto de enfoque: El borde cambia a rosa, añade sombra rosa y escala ligeramente (1.02).
    *   Incluyen iconos descriptivos a la izquierda.
*   **Cards:** Contenedores blancos con borde muy sutil, usados para agrupar información en el Dashboard y listas.

---

## 4. Vistas y Pantallas Principales

### Dashboard (Inicio)
*   **KPIs:** 4 tarjetas superiores con métricas clave (Ventas, Pedidos Hoy, Pendientes, Histórico).
*   **Acciones Rápidas:** Botones grandes de colores para acciones frecuentes (Nuevo Folio, Calendario, Reportes).
*   **Tablas:** Lista de pedidos recientes con estados coloreados (Badges).

### Wizard de Pedidos (6 Pasos)
Es el componente más crítico. Guía al usuario a través de:
1.  **Cliente:** Búsqueda o registro de datos básicos.
2.  **Detalles:** Selección de productos, sabores y rellenos.
3.  **Complementos:** Velas, toppers, cajas especiales.
4.  **Diseño:** Descripción estética y fotos de referencia.
5.  **Logística:** Fecha, hora de entrega y método (Sucursal/Domicilio).
6.  **Pago:** Resumen total, anticipo y saldo restante.

### Otros Módulos
*   **Producción:** Vista estilo Kanban o Lista para seguimiento de estados (Pendiente, Decoración, Terminado).
*   **Caja:** Formularios de Arqueo y Gastos con interfaz simplificada.
*   **Calendario:** Visualización mensual/semanal de entregas programadas.

---

## 5. Guía de Réplica

Para reconstruir este frontend en un nuevo proyecto, sigue estos pasos:

### Configuración del Entorno
1.  **Inicialización:** Crea un proyecto con `npm create vite@latest` eligiendo React.
2.  **Tailwind CSS:** Instala `tailwindcss`, `postcss` y `autoprefixer`. Asegúrate de extender los colores en `tailwind.config.js`:
    ```javascript
    theme: {
      extend: {
        colors: {
          primary: '#ec4899',
          secondary: '#8b5cf6',
        }
      }
    }
    ```
3.  **Dependencias Críticas:** Ejecuta:
    ```bash
    npm install lucide-react framer-motion axios react-router-dom react-hot-toast react-hook-form
    ```

### Estructura de Carpetas Recomendada
*   `/src/components/ui`: Para componentes atómicos (Button, Input, Badge).
*   `/src/components/common`: Para componentes estructurales (MainLayout, Sidebar).
*   `/src/pages/folios`: Para alojar el Wizard y sus pasos.
*   `/src/context`: Para el manejo de estado global (e.g., `OrderContext` para el Wizard).

### Archivos de Configuración Clave
*   `tailwind.config.js`: Define el alma visual del proyecto.
*   `index.css`: Contiene los resets globales, la fuente `Inter` y las animaciones personalizadas como `shimmer`.

---

## 6. Resumen Final

Esta documentación abarca todos los pilares visuales y funcionales del frontend antiguo. Al seguir las especificaciones de colores (#ec4899), el uso de `Framer Motion` para escalas y el sistema de componentes basado en `Tailwind`, se garantiza una réplica 1:1 de la interfaz original, manteniendo la misma experiencia de usuario intuitiva y moderna.

**Nota:** No se incluye código fuente original, solo especificaciones técnicas de diseño e implementación.
