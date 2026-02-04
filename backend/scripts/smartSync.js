const { sequelize } = require('../config/database');

/**
 * Smart Sync: Auto-migrates missing columns without altering the entire schema.
 * This makes the project "Plug & Play" for new developers.
 */
const smartSync = async () => {
    console.log('🛡️  Running Smart Sync (Auto-Migration)...');

    try {
        const qi = sequelize.getQueryInterface();

        // 1. Check 'folios' table columns
        const tableDesc = await qi.describeTable('folios');

        // List of columns that are often missing in legacy DBs
        // List of columns that are often missing in legacy DBs
        const columnsToCheck = [
            { name: 'folio_numero', type: sequelize.Sequelize.STRING(50) },
            { name: 'is_delivery', type: sequelize.Sequelize.BOOLEAN, defaultValue: false },
            { name: 'altura_extra', type: sequelize.Sequelize.STRING(255) }, // Changed to STRING per user request
            { name: 'calle', type: sequelize.Sequelize.STRING(255) },
            { name: 'num_ext', type: sequelize.Sequelize.STRING(50) },
            { name: 'num_int', type: sequelize.Sequelize.STRING(50) },
            { name: 'colonia', type: sequelize.Sequelize.STRING(255) },
            { name: 'ubicacion_maps', type: sequelize.Sequelize.TEXT },
            { name: 'referencias', type: sequelize.Sequelize.TEXT },
            // JSON Fields (Arrays)
            { name: 'accesorios', type: sequelize.Sequelize.JSON },
            { name: 'sabores_pan', type: sequelize.Sequelize.JSON },
            { name: 'rellenos', type: sequelize.Sequelize.JSON },
            { name: 'complementos', type: sequelize.Sequelize.JSON }
        ];

        for (const col of columnsToCheck) {
            if (!tableDesc[col.name]) {
                console.log(`🛠️  Auto-Migrating: Adding column '${col.name}' to 'folios'...`);
                try {
                    await qi.addColumn('folios', col.name, {
                        type: col.type,
                        allowNull: true,
                        defaultValue: col.defaultValue
                    });
                    console.log(`   -> Added '${col.name}' ✅`);
                } catch (err) {
                    // Ignore duplicate column errors if race condition
                    if (err.parent && err.parent.code === 'ER_DUP_FIELDNAME') {
                        console.log(`   -> '${col.name}' exists (Skipped).`);
                    } else {
                        console.error(`   -> Failed to add '${col.name}':`, err.message);
                    }
                }
            }
        }

        console.log('✅ Smart Sync Complete.');

    } catch (error) {
        console.error('❌ Smart Sync Failed:', error);
        // Don't kill the process, let Sequelize try its standard sync
    }
};

module.exports = smartSync;
