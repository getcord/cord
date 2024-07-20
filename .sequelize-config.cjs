// This is an intentionally relative path. Scripts don't enjoy the same
// support for `import` statements that our transpiled codebases do.
const dotenv = require('dotenv');

const env = dotenv.config({ path: process.env.DOTENV_CONFIG_PATH }).parsed;

const config = {
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  dialect: 'postgres',
  logging: true,
  schema: 'cord',
  migrationStorageTableSchema: 'public',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // If your SSL certificate is self-signed
    }
  },
  hooks: {
    afterConnect: (connection) =>
      connection.query('SET search_path=cord,public;'),
  },
};

module.exports = {
  // The default environment is development, but since we pass around DB
  // config in a .env file specific to each environment, it's all the
  // same to us here. It does feel icky to have the same settings for
  // dev and prod, but this is an artifact of sequelize being too rigid.
  development: { ...config },
  production: { ...config },

  // This is a special configuration for use in scripts, where the database
  // connection details are taken from the same PG* environment variables
  // that the psql command line client uses.
  pgenv: {
    ...config,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
  },
};
