const { Client } = require('../../../models');
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

// OBTENER todos los clientes
exports.getAllClients = asyncHandler(async (req, res) => {
  const where = buildTenantWhere(req);
  const clients = await Client.findAll({ where });
  res.status(200).json(clients);
});

// CREAR un nuevo cliente
exports.createClient = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 1;
  const clientData = { ...req.body, tenantId }; // Ensure tenant isolation
  const newClient = await Client.create(clientData);
  res.status(201).json(newClient);
});