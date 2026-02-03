const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  // Sequelize crea el 'id' automáticamente
  username: {
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
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la sucursal/negocio principal'
  },
  globalRole: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'USER'),
    allowNull: false,
    defaultValue: 'USER'
  },
  // --- Sprint 4: Control & Limits ---
  status: {
    type: DataTypes.ENUM('PENDING', 'ACTIVE', 'BLOCKED'),
    allowNull: false,
    defaultValue: 'PENDING'
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