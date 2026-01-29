// ==========================================
// 1. DATA PARA EL WIZARD (CATÁLOGO)
// ==========================================

export const products = [
    {
        id: 1,
        name: 'Pastel Personalizado',
        description: 'Crea tu propio diseño desde cero. Elige sabor, relleno y decoración.',
        price: 350.00,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'pasteles'
    },
    {
        id: 2,
        name: 'Cheesecake de Frutos Rojos',
        description: 'Base de galleta crujiente con suave crema de queso y top de berries frescos.',
        price: 450.00,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'pasteles'
    },
    {
        id: 3,
        name: 'Pastel de Chocolate Matilda',
        description: 'El clásico pastel de chocolate húmedo y denso, con ganache de chocolate semiamargo.',
        price: 480.00,
        image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'pasteles'
    },
    {
        id: 4,
        name: 'Red Velvet Especial',
        description: 'Bizcocho rojo aterciopelado con el tradicional betún de queso crema.',
        price: 420.00,
        image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'pasteles'
    },
    {
        id: 5,
        name: 'Cupcakes Decorados (Docena)',
        description: '12 cupcakes con diseños variados y sabores surtidos.',
        price: 300.00,
        image: 'https://images.unsplash.com/photo-1519869325930-281384150729?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'cupcakes'
    },
    {
        id: 6,
        name: 'Tarta de Limón y Merengue',
        description: 'Base sablée, crema de limón amarillo y merengue italiano tostado.',
        price: 380.00,
        image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'tartas'
    }
];

export const flavorOptions = [
    { id: 'vainilla', name: 'Vainilla Clásica', type: 'pan' },
    { id: 'chocolate', name: 'Chocolate Intenso', type: 'pan' },
    { id: 'marmolado', name: 'Marmolado', type: 'pan' },
    { id: 'zanahoria', name: 'Zanahoria y Nuez', type: 'pan' },
    { id: 'redvelvet', name: 'Red Velvet', type: 'pan' },
    { id: 'fresa', name: 'Fresa Natural', type: 'relleno' },
    { id: 'durazno', name: 'Durazno en Almíbar', type: 'relleno' },
    { id: 'cajeta', name: 'Cajeta Casera', type: 'relleno' },
    { id: 'nutella', name: 'Crema de Avellana', type: 'relleno' },
    { id: 'queso', name: 'Queso Crema', type: 'relleno' }
];

export const cakeTypes = [
    { id: 'tres_leches', name: 'Tres Leches', priceModifier: 0 },
    { id: 'seco', name: 'Pan Seco / Americano', priceModifier: 0 },
    { id: 'imposible', name: 'Chocoflan / Imposible', priceModifier: 50 }
];

export const designs = [
    { id: 'tradicional', name: 'Tradicional (Merengue)', priceModifier: 0 },
    { id: 'fondant', name: 'Fondant 2D', priceModifier: 150 },
    { id: 'chantilly', name: 'Chantilly Premium', priceModifier: 50 },
    { id: 'impresion', name: 'Oblea Comestible', priceModifier: 80 }
];

// Aliases para compatibilidad con código existente
export const cakeFlavors = flavorOptions.filter(f => f.type === 'pan');
export const fillings = flavorOptions.filter(f => f.type === 'relleno');


// ==========================================
// 2. DATA PARA LA PANTALLA DE PEDIDOS (ORDERS PAGE)
// ==========================================

export const MOCK_ORDERS = [
    {
        id: "temp-101",
        clientName: "Maria Gonzalez",
        status: "pending", // pendiente
        total: 850.00,
        deliveryDate: "2026-02-01T14:00:00",
        itemsDescription: "Pastel 3 Leches (Grande) + 12 Cupcakes"
    },
    {
        id: 1045, // ID Numérico (Simula uno real para probar PDF)
        clientName: "Juan Perez",
        status: "production", // en producción
        total: 450.00,
        deliveryDate: "2026-02-02T10:00:00",
        itemsDescription: "Cheesecake Frutos Rojos"
    },
    {
        id: "temp-102",
        clientName: "Ana Lopez",
        status: "ready", // listo
        total: 1200.00,
        deliveryDate: "2026-01-30T18:00:00",
        itemsDescription: "Pastel Personalizado (Fondant)"
    },
    {
        id: 1046,
        clientName: "Carlos Ruiz",
        status: "delivered", // entregado
        total: 350.00,
        deliveryDate: "2026-01-28T12:00:00",
        itemsDescription: "Pastel Chocolate"
    },
    {
        id: "temp-103",
        clientName: "Sofía Castro",
        status: "paid", // pagado
        total: 500.00,
        deliveryDate: "2026-02-03T16:00:00",
        itemsDescription: "Tarta de Limón"
    }
];
