const { TenantConfig } = require('../models');

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
