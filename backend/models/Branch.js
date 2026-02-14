const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Branch = sequelize.define('Branch', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    tenantId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Tenant'
    },
    isMain: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // ===== COMISIONES (Owner Configuration) =====
    comisionRepartidor: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 15.00,
        comment: 'Porcentaje de comisión para repartidor'
    },
    comisionPastelero: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 10.00,
        comment: 'Porcentaje de comisión para pastelero'
    },
    comisionVendedor: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 5.00,
        comment: 'Porcentaje de comisión para vendedor'
    },
    // ===== HORARIOS =====
    horarioApertura: {
        type: DataTypes.TIME,
        defaultValue: '09:00:00',
        comment: 'Hora de apertura (HH:MM:SS)'
    },
    horarioCierre: {
        type: DataTypes.TIME,
        defaultValue: '20:00:00',
        comment: 'Hora de cierre (HH:MM:SS)'
    },
    diasOperacion: {
        type: DataTypes.JSON,
        defaultValue: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        comment: 'Array de días que opera la sucursal'
    },
    // ===== UBICACIÓN GEOGRÁFICA =====
    latitud: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Coordenada de latitud'
    },
    longitud: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Coordenada de longitud'
    },
    // ===== GESTIÓN =====
    codigo: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: true,
        comment: 'Código único de sucursal (ej: SUC001)'
    },
    encargadoId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Usuario responsable de la sucursal'
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE'),
        defaultValue: 'ACTIVE',
        comment: 'Estado de la sucursal'
    },
    // ===== METADATA =====
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Información adicional de la sucursal'
    },
    // Legacy field (compatibility)
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Legacy: prefer using status field'
    }
}, {
    tableName: 'branches',
    timestamps: true,
    indexes: [
        { fields: ['tenantId'] },
        { fields: ['codigo'], unique: true },
        { fields: ['status'] },
        { fields: ['encargadoId'] }
    ]
});

module.exports = Branch;
