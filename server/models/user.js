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
  // ==================== INICIO DE LA MODIFICACIÓN ====================
  globalRole: {
    type: DataTypes.ENUM('ADMIN', 'USER'),
    allowNull: false,
    defaultValue: 'USER'
  }
  // ===================== FIN DE LA MODIFICACIÓN ======================
}, {
  tableName: 'users' // Asegura que el nombre de la tabla sea 'users'
});

module.exports = User;