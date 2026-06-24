/*
Docs here: https://www.npmjs.com/package/mssql
*/
const sql = require('mssql');

const config = {
  user: process.env.DWH_USER,
  password: process.env.DWH_PWD,
  database: process.env.DWH_NAME,
  server: process.env.DWH_SERVER,
  port: +process.env.DWH_PORT,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
};

exports.DWH = new sql.ConnectionPool(config);