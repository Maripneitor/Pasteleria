const { Sequelize } = require('sequelize');

// La configuración de la base de datos ahora se lee de las variables de entorno
// definidas en el archivo .env para mayor seguridad y flexibilidad.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Se mantiene desactivado para no llenar la consola con logs de SQL.
    dialectOptions: {
      charset: 'utf8mb4',
      // Soporte para BIGINT (evita bugs de string vs number en IDs)
      supportBigNumbers: true,
      bigNumberStrings: false
    }
  }
);

const conectarDB = async () => {
  try {
    // Verifica que la conexión con la base de datos se ha establecido correctamente.
    await sequelize.authenticate();
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
  }
};

module.exports = { sequelize, conectarDB };