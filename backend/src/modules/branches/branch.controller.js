const { Branch, Tenant } = require('../../../models');
const asyncHandler = require('../../core/asyncHandler');

// ✅ LIST
exports.listBranches = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    const where = { tenantId };

    // Employee Restriction: Can only see their own branch
    if (req.user.role === 'EMPLOYEE') {
        if (req.user.branchId) {
            where.id = req.user.branchId;
        } else {
            return res.json({ data: [] });
        }
    }

    const branches = await Branch.findAll({
        where,
        order: [['id', 'DESC']]
    });

    res.json({ data: branches });
});

// ✅ CREATE
exports.createBranch = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID missing in token' });

    // Whitelist fields
    const { name, address, phone, isActive } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: 'El nombre es obligatorio (min 2 caracteres)' });
    }

    // Anti-duplicate check
    const exists = await Branch.findOne({ where: { tenantId, name: name.trim() } });
    if (exists) {
        return res.status(409).json({ message: 'Ya existe una sucursal con ese nombre' });
    }

    // Limit Check
    const tenant = await Tenant.findByPk(tenantId);
    const currentCount = await Branch.count({ where: { tenantId } });

    if (tenant && tenant.maxBranches && currentCount >= tenant.maxBranches) {
        return res.status(403).json({
            message: `Has alcanzado el límite de ${tenant.maxBranches} sucursales permitidas.`
        });
    }

    const branch = await Branch.create({
        tenantId,
        name: name.trim(),
        address: address || null,
        phone: phone || null,
        isActive: isActive !== undefined ? isActive : true,
        isMain: false // Default to false
    });

    res.status(201).json({ data: branch });
});

// ✅ UPDATE
exports.updateBranch = asyncHandler(async (req, res) => {
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
});

// Optional: Get One
exports.getBranchById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const where = { id, tenantId };

    if (req.user.role === 'EMPLOYEE' && String(req.user.branchId) !== String(id)) {
        return res.status(403).json({ message: 'No tienes acceso a esta sucursal' });
    }

    const branch = await Branch.findOne({ where });
    if (!branch) return res.status(404).json({ message: 'No encontrado' });

    res.json({ data: branch });
});
