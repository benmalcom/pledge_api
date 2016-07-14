/**
 * Created by Richard on 10/5/2015.
 */
var config = require('../config/config');
var mysql = require('mysql');
module.exports = mysql.createPool({
    host     : config.dbHost,
    user     : config.dbUsername,
    password : config.dbPass,
    database : config.dbName,
    connectionLimit : 1000,
    waitForConnections : true,
    debug: ['ComQueryPacket', 'RowDataPacket']
});