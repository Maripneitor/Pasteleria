const { Client } = require('../../../models');
const { Op } = require('sequelize'); // 🔥 OBLIGATORIO: Necesario para la búsqueda con LIKE / OR
const { buildTenantWhere } = require('../../../utils/tenantScope');
const asyncHandler = require('../../core/asyncHandler');

// OBTENER todos los clientes (Listado general)
exports.getAllClients = asyncHandler(async (req, res) => {
  const where = buildTenantWhere(req);
  const clients = await Client.findAll({ where });
  res.status(200).json(clients);
});

// 🔥 NUEVO: BUSCAR clientes (Para el Autocomplete del frontend)
exports.searchClients = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  // Usamos tu utilidad para garantizar el scope de seguridad (Tenant/Branch)
  const where = buildTenantWhere(req); 
  
  // Si el usuario tecleó algo, buscamos por coincidencia en nombre o teléfono
  if (q) {
      where[Op.or] = [
          { name: { [Op.like]: `%${q}%` } },
          { phone: { [Op.like]: `%${q}%` } }
      ];
  }

  const clients = await Client.findAll({
      where,
      limit: 15, // Límite vital para que el frontend no se trabe al buscar
      order: [['name', 'ASC']]
  });

  res.status(200).json(clients);
});

// 🔥 MEJORADO: CREAR un nuevo cliente (Con protección anti-duplicados)
exports.createClient = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 1;
  const { name, phone, phone2, email, notes } = req.body;
  
  // 1. VALIDACIÓN: Evitar teléfonos duplicados para no ensuciar la base de datos del POS
  if (phone) {
       // Buscamos si ya existe alguien con ese teléfono en este Tenant
       const existing = await Client.findOne({ where: { phone, tenantId } });
       if (existing) {
           // Retornamos 400 (Bad Request) para que Axios en el frontend dispare el toast.error()
           return res.status(400).json({ 
               message: `Ya existe un cliente registrado con el teléfono ${phone}. Nombre: ${existing.name}` 
           });
       }
  }

  // 2. CREACIÓN: Armamos el payload explícitamente por seguridad
  const clientData = { 
      name, 
      phone, 
      phone2: phone2 || null, // Si viene vacío, lo mandamos como null
      email: email || null,
      notes: notes || null,
      tenantId 
  }; 
  
  const newClient = await Client.create(clientData);
  
  // 3. RESPUESTA: Devolvemos todo el objeto para que el Frontend haga el "Auto-Select"
  res.status(201).json(newClient);
});