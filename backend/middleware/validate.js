const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Zod's parse throws an error if validation fails
            schema.parse(req.body);
            next();
        } catch (error) {
            // Formatting the Zod error for the frontend
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            return res.status(400).json({
                ok: false,
                code: 'VALIDATION_ERROR',
                message: 'Datos inválidos',
                details: errorMessages
            });
        }
    };
};

module.exports = validateRequest;
