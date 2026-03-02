const { Branch } = require('../models');

// ✅ LIST
exports.listBranches = async (req, res, next) => {
    try {
        const { buildTenantWhere, buildBranchWhere } = require('../utils/tenantScope');
        const tenantWhere = buildTenantWhere(req);
        const branchWhere = buildBranchWhere(req, { branchField: 'id' });

        const combinedWhere = { ...tenantWhere, ...branchWhere };

        const branches = await Branch.findAll({
            where: combinedWhere,
            order: [['id', 'DESC']]
        });

        res.json({ data: branches });
    } catch (e) {
        console.error('listBranches Error:', e);
        res.status(500).json({ message: 'Error listando sucursales' });
    }
};

// ✅ CREATE
exports.createBranch = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) return res.status(400).json({ message: 'Tenant ID missing in token' });

        // Whitelist fields
        const { name, address, phone, isActive, isMain } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'El nombre es obligatorio (min 2 caracteres)' });
        }

        // Anti-duplicate check
        const exists = await Branch.findOne({ where: { tenantId, name: name.trim() } });
        if (exists) {
            return res.status(409).json({ message: 'Ya existe una sucursal con ese nombre' });
        }

        // Limit Check
        const { Tenant } = require('../models');
        const tenant = await Tenant.findByPk(tenantId);
        const currentCount = await Branch.count({ where: { tenantId } });

        if (tenant && tenant.maxBranches && currentCount >= tenant.maxBranches) {
            return res.status(403).json({
                message: `Has alcanzado el límite de ${tenant.maxBranches} sucursales permitidas.`
            });
        }

        // --- REFUERZO SPRINT 4: CASA MATRIZ AUTOMÁTICA ---
        // Si es la primera sucursal, es Main por defecto
        const forceMain = currentCount === 0 ? true : (isMain || false);

        const branch = await Branch.create({
            tenantId,
            name: name.trim(),
            address: address || null,
            phone: phone || null,
            isActive: isActive !== undefined ? isActive : true,
            isMain: forceMain
        });

        res.status(201).json({ data: branch });

    } catch (e) {
        console.error('createBranch Error:', e);
        res.status(500).json({ message: 'Error creando sucursal' });
    }
};

// ✅ UPDATE
exports.updateBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        if (!/^\d+$/.test(id)) return res.status(400).json({ message: 'Invalid ID' });

        const branch = await Branch.findOne({ where: { id, tenantId } });
        if (!branch) return res.status(404).json({ message: 'Sucursal no encontrada' });

        // Whitelist updates
        const { name, address, phone, isActive } = req.body;
        const updates = {};

        if (name) {
            const cleanName = name.trim();
            if (cleanName !== branch.name) {
                // Check dupes
                const exists = await Branch.findOne({ where: { tenantId, name: cleanName } });
                if (exists) return res.status(409).json({ message: 'Ya existe una sucursal con ese nombre' });
                updates.name = cleanName;
            }
        }

        if (address !== undefined) updates.address = address;
        if (phone !== undefined) updates.phone = phone;
        if (isActive !== undefined) updates.isActive = isActive;

        await branch.update(updates);

        res.json({ data: branch });

    } catch (e) {
        console.error('updateBranch Error:', e);
        res.status(500).json({ message: 'Error actualizando sucursal' });
    }
};

// Optional: Get One
exports.getBranchById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { buildTenantWhere, buildBranchWhere } = require('../utils/tenantScope');

        const tenantWhere = buildTenantWhere(req);
        const branchWhere = buildBranchWhere(req, { branchField: 'id' });

        // Override id from params if it's already in branchWhere (employees)
        const where = { ...tenantWhere, ...branchWhere, id };

        const branch = await Branch.findOne({ where });
        if (!branch) return res.status(404).json({ message: 'No encontrado' });

        res.json({ data: branch });
    } catch (e) {
        res.status(500).json({ message: 'Error' });
    }
}
