/**
 * Created by Richard on 10/4/2016.
 */
var mysql = require('promise-mysql');
var config = require('config');


exports.get = function(){
    return mysql.createConnection({
        host: config.get('db.mysql.host'),
        user: config.get('db.mysql.username'),
        password: config.get('db.mysql.password'),
        database: config.get('db.mysql.database')
    });
};