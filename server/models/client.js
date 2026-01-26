const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // ==================== INICIO DE LA CORRECCIÓN ====================
  phone2: {
    type: DataTypes.STRING,
    allowNull: true
  }
  // ===================== FIN DE LA CORRECCIÓN ======================
}, {
  tableName: 'clients'
});

module.exports = Client;