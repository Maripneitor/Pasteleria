/**
 * validate.js — Middleware de validación y sanitización con Zod.
 *
 * IMPORTANTE: Usa safeParse y SOBREESCRIBE req.body con el resultado
 * transformado para que las conversiones de Zod (.trim(), title case,
 * digitsOnly, etc.) sean efectivas antes de llegar al controller.
 */
// backend/middleware/validate.js
const validateRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            // ✅ Cambiar .errors por .issues
            const details = result.error.issues.map(
                (err) => `${err.path.join('.')}: ${err.message}`
            );
            return res.status(400).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                message: 'Datos inválidos',
                details,
            });
        }

        req.body = result.data;
        next();
    };
};

module.exports = validateRequest;