const { z } = require('zod');

// Schema for Folio Creation
const createFolioSchema = z.object({
    cliente_nombre: z.string({
        required_error: "El nombre del cliente es obligatorio",
    }).min(2, "El nombre debe tener al menos 2 caracteres").trim(),

    cliente_telefono: z.string({
        required_error: "El teléfono del cliente es obligatorio",
    }).min(10, "El teléfono debe tener al menos 10 caracteres").trim(),

    fecha_entrega: z.string({
        required_error: "La fecha de entrega es obligatoria",
    }).regex(/^\d{4}-\d{2}-\d{2}$/, "El formato de fecha debe ser YYYY-MM-DD"),

    hora_entrega: z.string({
        required_error: "La hora de entrega es obligatoria",
    }).regex(/^\d{2}:\d{2}$/, "El formato de hora debe ser HH:mm"),

    costo_base: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
    costo_envio: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
    anticipo: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
    total: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d{1,2})?$/)),

    // Add more fields as needed...
    // In a real app, you would define all expected fields here to completely sanitize the input.
}).passthrough(); // Allow other fields for now to avoid breaking existing frontend logic not yet mapped

module.exports = {
    createFolioSchema,
};
