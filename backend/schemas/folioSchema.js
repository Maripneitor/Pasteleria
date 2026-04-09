const { z } = require('zod');

const toTitleCase = (val) => val.toLowerCase().replace(/\b\w/gu, (c) => c.toUpperCase());
const digitsOnly = (val) => val.replace(/\D/g, '');

const phoneField = z.string().transform(digitsOnly).refine((val) => val.length >= 10 && val.length <= 15, { message: 'El teléfono debe tener entre 10 y 15 dígitos' });
const moneyField = z.union([ z.number().nonnegative(), z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number) ]).optional();

const createFolioSchema = z.object({
    cliente_nombre: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2).max(120).transform(toTitleCase),
    cliente_telefono: phoneField,
    cliente_telefono_extra: z.string().transform(digitsOnly).refine((val) => val === '' || (val.length >= 10 && val.length <= 15)).optional().or(z.literal('')),
    
    fecha_entrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora_entrega: z.string().regex(/^\d{2}:\d{2}$/),
    is_delivery: z.boolean().or(z.number()).or(z.string()).optional(),
    calle: z.string().optional(), num_ext: z.string().optional(), num_int: z.string().optional(),
    colonia: z.string().optional(), referencias: z.string().optional(), ubicacion_maps: z.string().optional(),

    numero_personas: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    forma: z.string().trim().optional(),
    
    // 🚀 FIX: Zod ahora asimila que le mandamos Strings booleanos desde FormData y los parsea a boolean real.
    extraHeight: z.boolean().or(z.string().transform(v => v === 'true' || v === '1')).optional(), 
    altura_extra: z.string().optional(),

    detallesPisos: z.array(z.object({ piso: z.number().or(z.string()), personas: z.number().or(z.string()).optional(), sabores_pan: z.array(z.string()).optional(), rellenos: z.array(z.string()).optional(), notas: z.string().optional() }).passthrough()).optional(),
    complementarios: z.array(z.object({ numero_personas: z.number().or(z.string()).optional(), forma: z.string().optional(), sabores_pan: z.array(z.string()).optional(), rellenos: z.array(z.string()).optional(), descripcion: z.string().optional(), sabor: z.string().optional(), sabor_pan: z.string().optional(), relleno: z.string().optional(), precio: z.number().or(z.string()).optional() }).passthrough()).optional(),
    complementsList: z.array(z.object({ personas: z.number().or(z.string()).optional(), forma: z.string().optional(), sabor: z.string().optional(), sabor_pan: z.string().optional(), sabores_pan: z.array(z.string()).optional(), relleno: z.string().optional(), rellenos: z.array(z.string()).optional(), descripcion: z.string().optional(), precio: z.number().or(z.string()).optional() }).passthrough()).optional(),
    accesorios: z.any().optional(),
    sabores_pan: z.union([z.array(z.string()), z.string().transform((v) => [v])]).optional(),
    rellenos: z.union([z.array(z.string()), z.string().transform((v) => [v])]).optional(),
    descripcion_diseno: z.string().trim().max(500).optional(),
    diseno_metadata: z.any().optional(),
    tipo_folio: z.enum(['Normal', 'Base/Especial', 'Express', 'Mayoreo']).default('Normal'),
    total: moneyField, costo_base: moneyField, costo_envio: moneyField, anticipo: moneyField,
    
    aplica_comision: z.boolean().or(z.number()).or(z.string().transform(v => v === 'true' || v === '1')).optional(),
    estatus_pago: z.enum(['Pendiente', 'Anticipo', 'Pagado', 'Creditado']).default('Pendiente'),
    estatus_produccion: z.enum(['Pendiente', 'En Proceso', 'Listo', 'Entregado']).default('Pendiente'),
    notas: z.string().trim().max(1000).optional(),
}).passthrough(); 

const updateFolioSchema = createFolioSchema.partial();
const createClientSchema = z.object({
    name: z.string().trim().min(2).max(120).transform(toTitleCase),
    phone: phoneField,
    phone2: z.string().transform(digitsOnly).refine((val) => val === '' || (val.length >= 10 && val.length <= 15)).optional().or(z.literal('')),
    email: z.string().email().toLowerCase().trim().optional().or(z.literal('')),
    notes: z.string().trim().max(500).optional(),
});

module.exports = { createFolioSchema, updateFolioSchema, createClientSchema };