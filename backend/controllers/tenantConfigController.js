const { TenantConfig, Branch } = require('../models');

// Defaults
const DEFAULTS = {
    businessName: "PASTELERÍA",
    primaryColor: "#111827",
    footerText: "Gracias por su compra",
    logoUrl: null
};

// GET /api/tenant/config
exports.getTenantConfig = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId && req.user.role !== 'SUPER_ADMIN') {
            return res.status(400).json({ message: 'Tenant ID required' });
        }

        // If Super Admin and no tenantId in token, maybe query param? 
        // For now, strict: use user's tenantId.

        const config = await TenantConfig.findOne({ where: { tenantId } });

        if (config) {
            // Merge defaults just in case some fields are null but we want fallbacks 
            // (Though if they are set to null in DB, maybe they want no logo? 
            // Let's return raw config merged over defaults for safety)
            return res.json({
                data: {
                    ...DEFAULTS,
                    ...config.toJSON()
                }
            });
        } else {
            return res.json({ data: { ...DEFAULTS, tenantId } });
        }
    } catch (e) {
        console.error('getTenantConfig Error:', e);
        res.status(500).json({ message: 'Error retrieving configuration' });
    }
};

// PUT /api/tenant/config
exports.updateTenantConfig = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) return res.status(403).json({ message: 'Tenant context required' });

        const { logoUrl, primaryColor, footerText, businessName } = req.body;

        // Validation
        if (primaryColor && !/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/i.test(primaryColor)) {
            return res.status(400).json({ message: 'Invalid Hex Color' });
        }

        if (logoUrl && (typeof logoUrl !== 'string' || logoUrl.length > 2048)) {
            return res.status(400).json({ message: 'Invalid Logo URL (must be string <= 2048 chars)' });
        }

        if (footerText && footerText.length > 255) {
            return res.status(400).json({ message: 'Footer text too long (max 255)' });
        }

        if (businessName && businessName.length > 255) {
            return res.status(400).json({ message: 'Business name too long (max 255)' });
        }

        // Upsert
        const [config, created] = await TenantConfig.findOrCreate({
            where: { tenantId },
            defaults: {
                tenantId,
                logoUrl: logoUrl || null,
                primaryColor: primaryColor || null,
                footerText: footerText || null,
                businessName: businessName || null
            }
        });

        if (!created) {
            await config.update({
                logoUrl: logoUrl !== undefined ? logoUrl : config.logoUrl,
                primaryColor: primaryColor !== undefined ? primaryColor : config.primaryColor,
                footerText: footerText !== undefined ? footerText : config.footerText,
                businessName: businessName !== undefined ? businessName : config.businessName
            });
        }

        res.json({ data: config });

    } catch (e) {
        console.error('updateTenantConfig Error:', e);
        res.status(500).json({ message: 'Error updating configuration' });
    }
};

// PUT /api/tenant/config/nombre (OWNER ONLY)
exports.updateBusinessName = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) return res.status(403).json({ message: 'Tenant context required' });

        // Only OWNER can modify business name
        if (req.user.role !== 'OWNER') {
            return res.status(403).json({
                message: 'Solo el dueño puede modificar el nombre de la pastelería',
                yourRole: req.user.role,
                requiredRole: 'OWNER'
            });
        }

        const { nombrePasteleria } = req.body;
        if (!nombrePasteleria || nombrePasteleria.trim().length === 0) {
            return res.status(400).json({ message: 'El nombre de la pastelería es requerido' });
        }

        if (nombrePasteleria.length > 255) {
            return res.status(400).json({ message: 'Nombre demasiado largo (máximo 255 caracteres)' });
        }

        const [config] = await TenantConfig.findOrCreate({
            where: { tenantId },
            defaults: { tenantId, businessName: nombrePasteleria.trim() }
        });

        await config.update({ businessName: nombrePasteleria.trim() });

        res.json({
            message: 'Nombre de pastelería actualizado correctamente',
            data: { businessName: config.businessName }
        });
    } catch (e) {
        console.error('updateBusinessName Error:', e);
        res.status(500).json({ message: 'Error al actualizar nombre de pastelería' });
    }
};

// PUT /api/tenant/config/comisiones/:branchId (OWNER ONLY)
exports.updateBranchCommissions = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { branchId } = req.params;

        // Only OWNER can modify commissions
        if (req.user.role !== 'OWNER') {
            return res.status(403).json({
                message: 'Solo el dueño puede modificar las comisiones',
                yourRole: req.user.role,
                requiredRole: 'OWNER'
            });
        }

        const { comisionRepartidor, comisionPastelero, comisionVendedor } = req.body;

        // Validation
        const validateComision = (value, name) => {
            if (value !== undefined) {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0 || num > 100) {
                    throw new Error(`${name} debe ser un porcentaje entre 0 y 100`);
                }
            }
        };

        try {
            validateComision(comisionRepartidor, 'Comisión de repartidor');
            validateComision(comisionPastelero, 'Comisión de pastelero');
            validateComision(comisionVendedor, 'Comisión de vendedor');
        } catch (validationError) {
            return res.status(400).json({ message: validationError.message });
        }

        // Find branch and verify it belongs to this tenant
        const branch = await Branch.findOne({ where: { id: branchId, tenantId } });
        if (!branch) {
            return res.status(404).json({ message: 'Sucursal no encontrada o no pertenece a tu negocio' });
        }

        // Update only provided fields
        const updates = {};
        if (comisionRepartidor !== undefined) updates.comisionRepartidor = parseFloat(comisionRepartidor);
        if (comisionPastelero !== undefined) updates.comisionPastelero = parseFloat(comisionPastelero);
        if (comisionVendedor !== undefined) updates.comisionVendedor = parseFloat(comisionVendedor);

        await branch.update(updates);

        res.json({
            message: 'Comisiones actualizadas correctamente',
            data: branch
        });
    } catch (e) {
        console.error('updateBranchCommissions Error:', e);
        res.status(500).json({ message: 'Error al actualizar comisiones' });
    }
};
