const { TenantConfig } = require('../../../models');
const asyncHandler = require('../../core/asyncHandler');

// Defaults
const DEFAULTS = {
    businessName: "PASTELERÍA",
    primaryColor: "#111827",
    footerText: "Gracias por su compra",
    logoUrl: null
};

// GET /api/v1/tenant/config
exports.getTenantConfig = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    if (!tenantId && req.user.role !== 'SUPER_ADMIN') {
        return res.status(400).json({ message: 'Tenant ID required' });
    }

    const config = await TenantConfig.findOne({ where: { tenantId } });

    if (config) {
        return res.json({
            data: {
                ...DEFAULTS,
                ...config.toJSON()
            }
        });
    } else {
        return res.json({ data: { ...DEFAULTS, tenantId } });
    }
});

// PUT /api/v1/tenant/config
exports.updateTenantConfig = asyncHandler(async (req, res) => {
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
});
