// Arquivo: backend/fix-db.js
const { Sequelize } = require('sequelize');
const config = require('./config/config.js');

const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
});

async function cleanAllTables() {
    try {
        console.log('🔍 Escaneando TODO o banco de dados em busca de índices duplicados...');

        // Obter o nome de todas as tabelas
        const [tables] = await sequelize.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);

            // Agrupar índices por nome de coluna
            const columnIndexes = {};
            for (const idx of indexes) {
                if (idx.Key_name === 'PRIMARY') continue; // Ignorar chaves primárias
                
                const colName = idx.Column_name;
                if (!columnIndexes[colName]) {
                    columnIndexes[colName] = [];
                }
                columnIndexes[colName].push(idx.Key_name);
            }

            // Revisar cada coluna e apagar os duplicados
            for (const [colName, indexNames] of Object.entries(columnIndexes)) {
                // Obter nomes únicos de índices
                const uniqueIndexNames = [...new Set(indexNames)];

                if (uniqueIndexNames.length > 1) {
                    console.log(`⚠️ Tabela '${tableName}' -> Coluna '${colName}' tem ${uniqueIndexNames.length} índices. Limpando...`);
                    
                    // Manter o primeiro e apagar o resto
                    for (let i = 1; i < uniqueIndexNames.length; i++) {
                        const indexToDrop = uniqueIndexNames[i];
                        console.log(`   🗑️ Apagando índice: ${indexToDrop}`);
                        await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexToDrop}\``);
                    }
                }
            }
        }
        console.log('🚀 ¡Limpeza MASSA concluída com sucesso! Você já pode iniciar o seu servidor.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao limpar o banco de dados:', error);
        process.exit(1);
    }
}

cleanAllTables();