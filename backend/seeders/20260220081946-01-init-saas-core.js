'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear el Inquilino Maestro (Tenant)
    await queryInterface.bulkInsert('tenants', [{
      id: 1,
      businessName: 'Pastelería La Fiesta (Matriz)',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });

    // 2. Crear la Sucursal Base
    await queryInterface.bulkInsert('branches', [{
      id: 1,
      tenantId: 1,
      name: 'Sucursal Centro',
      address: 'Av. Principal #123',
      phone: '9999999999',
      isMain: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });

    // 3. Crear Usuarios Base (Encriptando contraseñas)
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash('admin123', salt);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        tenantId: 1,
        branchId: 1, 
        name: 'Soporte Root',
        email: 'superadmin@lafiesta.com',
        password: hashPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        tenantId: 1,
        branchId: 1,
        name: 'Dueño Pastelería',
        email: 'owner@lafiesta.com',
        password: hashPassword,
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 👇 AQUÍ AGREGAMOS AL EMPLEADO BASE
      {
        id: 3,
        tenantId: 1,
        branchId: 1,
        name: 'Empleado Mostrador',
        email: 'empleado@lafiesta.com',
        password: hashPassword,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('branches', null, {});
    await queryInterface.bulkDelete('tenants', null, {});
  }
};