/**
 * Created by Richard on 10/6/2015.
 */
var helper = require('../../utils/helper');
var config = require('config');
var formatResponse = require('../../utils/format-response');
var mysqlConnection = require('../../others/db/mysql_connection');

exports.stateIdParam = function(req,res,next,id){
    var error = {};
    var query = 'SELECT * FROM states WHERE state_id=? LIMIT 1';
    var data = [helper.sanitize(id)];
    mysqlConnection.get().then(function(connection){
        connection.query(query,data)
            .then(function(rows){
                if(rows.length){
                    req.state = rows[0];
                    return next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"State not found!"});
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

exports.lgasByState = function(req,res,next){
    var error = {};
    var meta = {code:200,success:true};
    var stateId = req.state.state_id;
    var query = 'SELECT * FROM lgas WHERE state_id=?';
    var data = [stateId];
    mysqlConnection.get().then(function(connection){
        connection.query(query,data)
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


exports.allStates = function(req,res,next){
    var error = {};
    var meta = {code:200,success:true};
    var query = 'SELECT * FROM states';
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

exports.stateById = function(req,res,next){
    var state = req.state,
        meta = {code:200,success:true};
    res.status(meta.code).json(formatResponse.do(meta,state));
};