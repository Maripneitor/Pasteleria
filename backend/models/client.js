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
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
    // Removed unique: true here, will define composite unique below
  },
  phone2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tenantId: {
    type: DataTypes.BIGINT,
    defaultValue: 1,
    allowNull: false
  }
}, {
  tableName: 'clients',
  indexes: [
    {
      unique: true,
      fields: ['tenantId', 'phone'],
      name: 'uq_clients_tenant_phone' // Explicit name to match DB
    }
  ]
});

module.exports = Client;