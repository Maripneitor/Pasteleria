# Documentación Técnica y Visual del Frontend - Pastelería "La Fiesta"

Este archivo sirve como manual exhaustivo para la réplica fidedigna del frontend del sistema de gestión de la pastelería. Contiene la descripción funcional, el flujo de trabajo, el stack tecnológico y las especificaciones de diseño.

---

## 1. Descripción General del Proyecto

**La Fiesta** es un sistema integral de tipo ERP (Enterprise Resource Planning) diseñado específicamente para el sector de la pastelería. Su propósito es centralizar y digitalizar todas las operaciones críticas de un negocio de repostería, desde la captación del cliente hasta la entrega final del producto.

### Problemas que resuelve:
*   **Desorganización en pedidos:** Elimina el uso de notas en papel que pueden perderse o malinterpretarse.
*   **Falta de seguimiento en producción:** Permite saber en qué estado exacto se encuentra cada pastel (Horneado, Decoración, Terminado).
*   **Cálculos manuales:** Automatiza el cálculo de saldos, anticipos y comisiones de vendedores.
*   **Gestión Multi-sucursal:** Permite a los dueños supervisar múltiples puntos de venta desde una sola interfaz.

---

## 2. Framework y Tecnologías Utilizadas

El proyecto utiliza un stack moderno centrado en la velocidad de desarrollo y una interfaz de usuario fluida y "viva".

*   **Framework Principal:** `React 19` (Vite) - Aprovechando las últimas mejoras de rendimiento.
*   **Estilos:** `Tailwind CSS 3.4` (Utility-first CSS) con `Tailwind Merge` para gestión de clases.
*   **Animaciones:** `Framer Motion 12` (Micro-interacciones y transiciones de página).
*   **Componentes de UI:** `Lucide React` (Iconografía consistente).
*   **Gestión de Formularios:** `React Hook Form` (Especialmente para el Wizard de pedidos).
*   **Gestión de Estado:** `React Context API` (Para la persistencia del pedido durante los pasos del Wizard y la autenticación).
*   **Visualización de Datos:** `Recharts` (Gráficos estadísticos) y `FullCalendar` (Agenda de producción).
*   **Notificaciones:** `React Hot Toast`.

---

## 3. Funcionalidades Principales

1.  **Dashboard Inteligente:** Panel principal con KPIs en tiempo real (ventas del día, pedidos pendientes, sabores más vendidos).
2.  **Wizard de Pedidos (Nuevo Folio):** Un proceso guiado de 6 pasos que asegura que no falte ningún detalle técnico (sabores, rellenos, diseño, logística).
3.  **Asistente IA (Voice-to-Order):** Integración de un asistente que permite dictar pedidos por voz, facilitando la captura rápida sin usar el teclado.
4.  **Gestión de Producción (Kanban):** Vista de tarjetas para mover pedidos entre diferentes etapas de fabricación.
5.  **Control de Caja:** Módulos para arqueos diarios, registro de gastos operativos y control de efectivo.
6.  **Reportes y Auditoría:** Generación de reportes de ventas, comisiones por empleado y logs de auditoría para cambios en el sistema.
7.  **Gestión de Catálogos:** Control centralizado de sabores, rellenos, productos y clientes.

---

## 4. Cómo Funciona (Flujo Conceptual)

### Flujo del Usuario:
1.  **Autenticación:** El usuario ingresa mediante un login con validación de roles (Vendedor, Decorador, Admin, Owner).
2.  **Bandeja de Entrada (Dashboard):** Al entrar, el usuario ve el resumen del día y las tareas urgentes.
3.  **Acción Principal:** El usuario puede iniciar un "Nuevo Folio". La aplicación utiliza un **Contexto de Pedido** para guardar temporalmente la información a través de 6 pantallas sin perder datos.
4.  **Persistencia:** Al finalizar el Wizard, el pedido se envía al servidor mediante `Axios`.
5.  **Navegación:** Se utiliza un Sidebar lateral persistente en escritorio y una versión colapsable en móvil para alternar entre la producción, el calendario y los ajustes.

---

## 5. Sistema Visual

### Paleta de Colores
*   **Primario (Brand):** `#ec4899` (Rosa intenso) - Representa alegría y creatividad.
*   **Acento IA:** `#8b5cf6` (Violeta vibrante) - Diferencia las funciones inteligentes.
*   **Fondos:** `#f3f4f6` (Gris/Azulado muy claro) para la base de la aplicación y `#ffffff` (Blanco) para los contenedores (Cards).
*   **Estados:**
    *   Éxito: verde esmeralda.
    *   Advertencia: ámbar.
    *   Peligro/Cancelado: rojo rosa.

### Tipografías y Estilos
*   **Fuente:** `Inter` (Sans-serif moderna).
*   **Bordes:** Redondeado extra grande (`rounded-xl` o `rounded-2xl`).
*   **Efectos:**
    *   **Glassmorphism:** Uso de desenfoque de fondo en modales y paneles flotantes (`backdrop-blur`).
    *   **Sombras:** Sombras muy sutiles que ganan intensidad al pasar el mouse por encima (hover).

### Animaciones
*   **Fade-in:** Todas las vistas cargan con una transición de opacidad.
*   **Scales:** Botones e inputs crecen un 2% al recibir foco o ser presionados.
*   **Shimmer:** Efectos de carga tipo esqueleto mientras los datos de la API se recuperan.

---

## 6. Vistas y Pantallas

*   **Login / Registro:** Interfaz minimalista centrada en el formulario, con el logo animado.
*   **Dashboard:** Grid de 4 KPIs + Gráfico de Sabores + Tabla de Pedidos Recientes.
*   **Wizard de Folios:** 6 pasos laterales con barra de progreso superior.
*   **Calendario de Producción:** Vista mensual de eventos tipo full-width.
*   **Pantalla de Producción:** Lista de pedidos con botones de acción rápida para cambiar estatus (e.g. "Pasar a Decoración").
*   **Administración de Usuarios:** Tabla con badges de roles y acceso a perfiles.

---

## 7. Objetivo de Réplica

Este documento ha sido diseñado como la **hoja de ruta definitiva** para construir un frontend idéntico. Para asegurar la fidelidad:
1.  **Mantén la paleta de colores especificada** en el archivo `tailwind.config.js`.
2.  **Utiliza la misma jerarquía de carpetas** (`src/pages`, `src/components`, `src/context`) para evitar conflictos de importación.
3.  **No omitas Framer Motion:** El "feeling" premium de la app depende de sus micro-interacciones.

**Nota:** Este archivo contiene solo documentación descriptiva y lógica. No incluye bloques de código fuente para mantener la claridad del manual.
