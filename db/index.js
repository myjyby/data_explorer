const { DWH } = require('./DWH.js');
const DB = require('./DB.js');

exports.DWH = DWH;
exports.DB = DB.conn;
exports.pgp = DB.pgp;