/**
 * Created by Malcom on 10/3/2015.
 */
var helper = require('../../utils/helper');
var formatResponse = require('../../utils/format-response');
var mysqlConnection = require('../../others/db/mysql_connection');

exports.sectorIdParam = function(req,res,next,id){
    var error = {};
    var query = 'SELECT * FROM sectors WHERE sector_id=? LIMIT 1';
    var data = [helper.sanitize(id)];
    mysqlConnection.get().then(function(connection){
        connection.query(query,data)
            .then(function(rows){
                if(rows.length){
                    req.sector = rows[0];
                    return next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"Sector not found!"});
                    return next(error);
                }

            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            });
    },function(err){
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });
};

exports.sector = function(req,res,next){
    var sector = req.sector,
        meta = {code:200,success:true};
    res.status(meta.code).json(formatResponse.do(meta,sector));
};

exports.all = function(req,res,next){

    var error = {};
    var meta = {code:200,success:true};
    var query = 'SELECT * FROM sectors';
    mysqlConnection.get().then(function(connection){
        connection.query(query)
            .then(function(rows){
                res.status(meta.code).json(formatResponse.do(meta,rows));
            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            });
    },function(err){
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });
};