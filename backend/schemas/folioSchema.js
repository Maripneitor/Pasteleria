const { z } = require('zod');

// ─────────────────────────────────────────────
// 🔧  HELPERS DE TRANSFORMACIÓN
// ─────────────────────────────────────────────

/** Capitaliza la primera letra de cada palabra: "juan pérez" → "Juan Pérez" */
const toTitleCase = (val) =>
    val.toLowerCase().replace(/\b\w/gu, (c) => c.toUpperCase());

/** Elimina todo carácter que no sea dígito: "(999) 123-4567" → "9991234567" */
const digitsOnly = (val) => val.replace(/\D/g, '');

/** Convierte strings vacíos a undefined (para que .optional() funcione bien) */
const emptyToUndefined = (val) => (val === '' ? undefined : val);

// ─────────────────────────────────────────────
// 📱  CAMPO TELÉFONO REUTILIZABLE
// ─────────────────────────────────────────────
const phoneField = z
    .string()
    .transform(digitsOnly)
    .refine((val) => val.length >= 10 && val.length <= 15, {
        message: 'El teléfono debe tener entre 10 y 15 dígitos',
    });

// ─────────────────────────────────────────────
// 💰  CAMPO MONETARIO REUTILIZABLE
// ─────────────────────────────────────────────
const moneyField = z
    .union([
        z.number().nonnegative(),
        z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number),
    ])
    .optional();

// ─────────────────────────────────────────────
// 📋  ESQUEMA: CREAR FOLIO
// ─────────────────────────────────────────────
const createFolioSchema = z.object({

    // — CLIENTE —
    cliente_nombre: z
        .string({ required_error: 'El nombre del cliente es obligatorio' })
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(120, 'El nombre es demasiado largo')
        .transform(toTitleCase),

    cliente_telefono: phoneField,

    cliente_telefono_extra: z
        .string()
        .transform(digitsOnly)
        .refine((val) => val === '' || (val.length >= 10 && val.length <= 15), {
            message: 'El teléfono alternativo debe tener entre 10 y 15 dígitos',
        })
        .optional()
        .or(z.literal('')),

    // — ENTREGA —
    fecha_entrega: z
        .string({ required_error: 'La fecha de entrega es obligatoria' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),

    hora_entrega: z
        .string({ required_error: 'La hora de entrega es obligatoria' })
        .regex(/^\d{2}:\d{2}$/, 'El formato de hora debe ser HH:mm'),

    // 🔥 FIX: Añadimos a la lista VIP los campos de envío para que Zod no los mutile
    is_delivery: z.boolean().or(z.number()).or(z.string()).optional(),
    calle: z.string().optional(),
    num_ext: z.string().optional(),
    num_int: z.string().optional(),
    colonia: z.string().optional(),
    referencias: z.string().optional(),
    ubicacion_maps: z.string().optional(),

    // — PRODUCTO —
    numero_personas: z
        .union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])
        .optional(),

    forma: z.string().trim().optional(),

    // 🍰 NUEVOS SCHEMAS PARA FLUJO AVANZADO
    detallesPisos: z.array(
        z.object({
            piso: z.number().or(z.string()),
            personas: z.number().or(z.string()).optional(),
            sabores_pan: z.array(z.string()).optional(),
            rellenos: z.array(z.string()).optional(),
            notas: z.string().optional() // 🔥 FIX: Zod ahora permite las notas
        }).passthrough()
    ).optional(),

    complementarios: z.array(
        z.object({
            numero_personas: z.number().or(z.string()).optional(),
            forma: z.string().optional(),
            sabores_pan: z.array(z.string()).optional(),
            rellenos: z.array(z.string()).optional(),
            descripcion: z.string().optional(),
            // 🔥 FIX: Declaramos los textos explícitamente para que Zod NO los borre
            sabor: z.string().optional(),
            sabor_pan: z.string().optional(),
            relleno: z.string().optional(),
            precio: z.number().or(z.string()).optional()
        }).passthrough()
    ).optional(),

    // 🔥 FIX: Registramos la lista exacta que manda tu Frontend en StepF_Payment
    complementsList: z.array(
        z.object({
            personas: z.number().or(z.string()).optional(),
            forma: z.string().optional(),
            sabor: z.string().optional(),
            sabor_pan: z.string().optional(),
            sabores_pan: z.array(z.string()).optional(),
            relleno: z.string().optional(),
            rellenos: z.array(z.string()).optional(),
            descripcion: z.string().optional(),
            precio: z.number().or(z.string()).optional()
        }).passthrough()
    ).optional(),
    // ----------------------------------------

    sabores_pan: z
        .union([z.array(z.string()), z.string().transform((v) => [v])])
        .optional(),

    rellenos: z
        .union([z.array(z.string()), z.string().transform((v) => [v])])
        .optional(),

    descripcion_diseno: z.string().trim().max(500).optional(),

    // 🔥 FIX DE ORO: Evita que Zod mutile las notas y las imágenes de la BD al actualizar
    diseno_metadata: z.any().optional(),

    // 🔥 AQUI ACTUALIZAMOS EL ENUM (Agregamos 'Base/Especial')
    tipo_folio: z.enum(['Normal', 'Base/Especial', 'Express', 'Mayoreo']).default('Normal'),

    // — FINANCIERO —
    total: moneyField,
    costo_base: moneyField,
    costo_envio: moneyField,
    anticipo: moneyField,

    estatus_pago: z
        .enum(['Pendiente', 'Anticipo', 'Pagado', 'Creditado'])
        .default('Pendiente'),

    estatus_produccion: z
        .enum(['Pendiente', 'En Proceso', 'Listo', 'Entregado'])
        .default('Pendiente'),

    // — OTROS —
    notas: z.string().trim().max(1000).optional(),

}).passthrough(); // Permite campos extra (como imágenes) sin fallar

// ─────────────────────────────────────────────
// 📋  ESQUEMA: ACTUALIZAR FOLIO (Todo opcional)
// ─────────────────────────────────────────────
const updateFolioSchema = createFolioSchema.partial();

// ─────────────────────────────────────────────
// 👤  ESQUEMA: CLIENTE
// ─────────────────────────────────────────────
const createClientSchema = z.object({
    name: z
        .string({ required_error: 'El nombre es obligatorio' })
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(120)
        .transform(toTitleCase),

    phone: phoneField,

    phone2: z
        .string()
        .transform(digitsOnly)
        .refine((val) => val === '' || (val.length >= 10 && val.length <= 15), {
            message: 'El teléfono alt. debe tener entre 10 y 15 dígitos',
        })
        .optional()
        .or(z.literal('')),

    email: z.string().email('Email inválido').toLowerCase().trim().optional().or(z.literal('')),

    notes: z.string().trim().max(500).optional(),
});

module.exports = {
    createFolioSchema,
    updateFolioSchema,
    createClientSchema,
};
