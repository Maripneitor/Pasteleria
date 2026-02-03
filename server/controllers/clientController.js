const { Client } = require('../models');
const { buildTenantWhere } = require('../utils/tenantScope');

// OBTENER todos los clientes
exports.getAllClients = async (req, res) => {
  try {
    const where = buildTenantWhere(req);
    const clients = await Client.findAll({ where });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
  }
};

// CREAR un nuevo cliente
exports.createClient = async (req, res) => {
  try {
    const newClient = await Client.create(req.body);
    res.status(201).json(newClient);
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Error de validación', errors });
    }
    res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
  }
};