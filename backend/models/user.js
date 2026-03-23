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
    // 👇 Solo los 3 roles permitidos en el sistema
    type: DataTypes.ENUM('SUPER_ADMIN', 'OWNER', 'EMPLOYEE'),
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

// Métodos de instancia para verificación de roles
User.prototype.isSuperAdmin = function () {
  return this.role === 'SUPER_ADMIN';
};

// Se deja como alias de SUPER_ADMIN por si alguna ruta antigua de Express aún usa .isAdmin()
User.prototype.isAdmin = function () {
  return this.role === 'SUPER_ADMIN';
};

User.prototype.isOwner = function () {
  // Eliminamos 'ADMIN' de la validación
  return ['SUPER_ADMIN', 'OWNER'].includes(this.role);
};

User.prototype.isEmployee = function () {
  return this.role === 'EMPLOYEE';
};

module.exports = User;