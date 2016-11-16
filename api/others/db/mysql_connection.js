/**
 * Created by Richard on 10/4/2016.
 */
var mysql = require('promise-mysql');
var config = require('config');


exports.get = function(){
    var pool = mysql.createPool({
        host: config.get('db.mysql.host'),
        user: config.get('db.mysql.username'),
        password: config.get('db.mysql.password'),
        database: config.get('db.mysql.database'),
        connectionLimit : 10
    });

    pool.on('connection', function (connection) {
        console.log("A connection! Thread Id="+connection.threadId);
    });

    pool.on('enqueue', function (connection) {
        console.log('Waiting for available connection slot');
    });

    return pool.getConnection();
};