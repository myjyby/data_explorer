const connection = {
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  ssl:
    process.env.NODE_ENV === 'production',
};

const logSQL = process.env.LOG_SQL !== 'false';
if (!logSQL) {
  console.warn('suppressing SQL output! use LOG_SQL to configure');
}
const initOptions = {
  query(e) {
    if (logSQL) console.log(e.query);
  },
};
const pgp = require('pg-promise')(initOptions);

exports.DB = { conn: pgp(connection), pgp };
