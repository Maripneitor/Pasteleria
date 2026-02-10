const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  // Sequelize crea el 'id' automáticamente
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tenantId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID de la sucursal/negocio principal'
  },
  branchId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID de la sucursal física asignada'
  },
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'OWNER', 'EMPLOYEE', 'USER'),
    allowNull: false,
    defaultValue: 'EMPLOYEE'
  },
  // --- Sprint 4: Control & Limits ---
  status: {
    type: DataTypes.ENUM('PENDING', 'ACTIVE', 'BLOCKED'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  ownerId: {
    type: DataTypes.BIGINT, // Referencia al Dueño (si es empleado)
    allowNull: true
  },
  maxUsers: {
    type: DataTypes.INTEGER, // Si es Dueño, cuántos empleados puede tener
    allowNull: false,
    defaultValue: 5
  }
  // ===================== FIN DE LA MODIFICACIÓN ======================
}, {
  tableName: 'users' // Asegura que el nombre de la tabla sea 'users'
});

module.exports = User;