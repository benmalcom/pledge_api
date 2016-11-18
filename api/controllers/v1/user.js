/**
 * Created by Malcom on 10/3/2015.
 */
var ValidatorJs = require('validatorjs');
var _ = require('underscore');
var dateFormat = require('dateformat');
var config = require('config');
var formatResponse = require('../../utils/format-response');
var helper = require('../../utils/helper');
var pool = require('../../others/db/mysql_connection');

exports.userIdParam = function(req,res,next,id){
    var error = {};
    pool.getConnection().then(function(connection){
        var query = "SELECT * FROM mobile_users WHERE mobile_user_id=? LIMIT 1",
            data = [helper.sanitize(id)];
        connection.query(query,data)
            .then(function(rows){
                if(rows.length){
                    req.user = rows[0];
                    return next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"User not found!"});
                    return next(error);
                }

            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            })
            .finally(function() {
                if (connection){
                    pool.releaseConnection(connection);
                    console.log("Connection released!");
                }
            });
    },function(err){
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });

};

exports.mobileParam = function(req,res,next,mobileNo){
    var error = {};
    pool.getConnection().then(function(connection){
        var query = "SELECT * FROM mobile_users WHERE mobile=? LIMIT 1",
            data = [helper.sanitize(mobileNo)];
        connection.query(query,data)
            .then(function(rows){
                if(rows.length){
                    req.user = rows[0];
                    next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"User not found!"});
                    return next(error);
                }

            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            })
            .finally(function() {
                if (connection){
                    pool.releaseConnection(connection);
                    console.log("Connection released!");
                }
            });
    },function(err){
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });
};

exports.emailParam = function(req,res,next,email){
    var error = {};
    pool.getConnection().then(function(connection){
        var query = "SELECT * FROM mobile_users WHERE email=? LIMIT 1",
            data = [helper.sanitize(email)];
        connection.query(query,data)
            .then(function(rows){
                if(rows.length){
                    req.user = rows[0];
                    next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"User not found!"});
                    return next(error);
                }

            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            })
            .finally(function() {
                if (connection){
                    pool.releaseConnection(connection);
                    console.log("Connection released!");
                }
            });
    },function(err){
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });
};

exports.getUser = function(req,res,next){
    var user = helper.unescapeAvatar(req.user),
    meta = {code:200,success:true};
    res.status(meta.code).json(formatResponse.do(meta,user));
};

exports.all = function(req,res,next){
    var error = {},
        meta = {success:true,status_code:200};
    pool.getConnection().then(function(connection){
        var query = "SELECT * FROM mobile_users";
        connection.query(query)
            .then(function(rows){
                res.status(meta.status_code).json(formatResponse.do(meta,rows))
            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            })
            .finally(function() {
                if (connection){
                    pool.releaseConnection(connection);
                    console.log("Connection released!");
                }
            });
    },function(err){
        console.log("db error ",err);
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });
};



exports.updateUser = function(req,res,next){
    var userId = helper.sanitize(req.params.id);
    var user = req.user;
    var error = {},
        meta = {success:true,status_code:200};
    pool.getConnection().then(function(connection){
        _.extend(user,req.body);
        var data = [user.first_name,user.last_name,user.mobile,user.avatar,user.gender,user.lga_id,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),userId],
            query = 'UPDATE mobile_users SET first_name=?,last_name=?,mobile=?,avatar=?,gender=?,lga_id=?,updated_at=? WHERE mobile_user_id=?';
        console.log("About updating....");
        connection.query(query,data)
            .then(function(result){
                if(result.affectedRows)
                    res.status(meta.status_code).json(formatResponse.do(meta,user));
                else
                {
                    error =  helper.transformToError({code:503,message:"Error updating your details"});
                    return next(error);
                }
            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            })
            .finally(function() {
                if (connection){
                    pool.releaseConnection(connection);
                    console.log("Connection released!");
                }
            });
    },function(err){
        error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
        return next(error);
    });

};

exports.getUserReportsById = function(req,res,next){
        var mobileUserId = req.user.mobile_user_id,
            error = {},
            meta = {success:false,code:200},
            urlQuery = req.query,
            page = urlQuery.page ? helper.sanitize(urlQuery.page) : 1,
            itemsPerPage = config.get('itemsPerPage.report'),
            previous = page > 1 ? page - 1 : 0,
            offset = previous * itemsPerPage,
            nextTotalItem = (page * itemsPerPage) - offset,
            baseUrl = config.get('app.baseUrl')+'/v1/users/'+mobileUserId+'/reports';
        meta.pagination = {current_page: helper.appendQueryString(baseUrl,"page="+page), current:page} ;
        if(previous > 0)
        {
            meta.pagination.previous_page = helper.appendQueryString(baseUrl,"page="+previous);
            meta.pagination.previous = previous;
        }
        var query = 'SELECT '+
            '(SELECT  COUNT(report_id) FROM report_comments WHERE report_id=a.report_id) AS comments,'+
            '(SELECT COUNT(report_id) FROM report_votes WHERE report_id=a.report_id) AS votes, '+
            '(SELECT COUNT(report_id) FROM report_followers WHERE report_id=a.report_id) AS followers,'+

            'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id=? LIMIT 1)) '+
                'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
            'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id=? LIMIT 1)) '+
                'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed,'+

            'a.report_id, a.title, a.description, a.images,a.address,a.gps,a.created_at, a.updated_at, b.mobile_user_id, b.first_name,b.last_name, b.avatar,' +
            'c.sector, d.state AS report_state, e.lga FROM reports a '+
            'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
            'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
            'INNER JOIN states d ON a.state_id = d.state_id '+
            'INNER JOIN lgas e ON a.lga_id = e.lga_id '+
            'WHERE a.mobile_user_id = ? AND a.spam = ? ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;
        var queryData = [mobileUserId,mobileUserId,mobileUserId,0];
        var countQuery  = 'SELECT COUNT(report_id) as count FROM reports WHERE mobile_user_id = ? AND spam = ?';
        var countData = [mobileUserId,0];

        pool.getConnection()
            .then(function(connection){
                return connection.query(query,queryData)
                .then(function (rows) {
                     return [rows,connection.query(countQuery,countData)];
                })
                .spread(function(rows,countResult){
                    var count = countResult[0].count;
                    meta.pagination.total_count = count;
                    if(count > (page * itemsPerPage))
                    {
                        var next = parseInt(page,"10") + 1;
                        meta.pagination.previous_page = helper.appendQueryString(baseUrl,"page="+next);
                        meta.pagination.next = next;
                    }
                    meta.success = true;
                    res.status(meta.code).json(formatResponse.do(meta,helper.processReport(rows)))
                },function(err){
                    console.log("err ",err);
                    error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                    return next(error);
                })
                .finally(function() {
                    if (connection){
                        pool.releaseConnection(connection);
                        console.log("Connection released!");
                    }
                });
        }
        ,function(err){
            error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
            return next(error);
        });
};

exports.saveUser = function (req,res,next) {
       var obj = req.body,
           error = {};
        var rules = {
            first_name: 'required',
            last_name: 'required',
            email : 'required|email',
            gender: 'required',
            mobile : 'required'
        };
        var validator = new ValidatorJs(obj,rules);
        if(validator.passes())
        {
            pool.getConnection().then(function(connection){
                var data = [obj.first_name,obj.last_name,obj.email,obj.mobile,obj.avatar,obj.gender,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")],
                query = 'INSERT INTO mobile_users(first_name,last_name,email,mobile,avatar,gender,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)';

                connection.query(query,data)
                    .then(function(result){
                        var lastId = result.insertId;
                        res.redirect('/v1/users/'+lastId);
                    },function(err){
                        console.log("err ",err);
                        error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                        return next(error);
                    })
                    .finally(function() {
                        if (connection){
                            pool.releaseConnection(connection);
                            console.log("Connection released!");
                        }
                    });
            },function(err){
                error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
                return next(error);
            });
        }
        else{
            error =  helper.transformToError({
                code:400,message:"There are problems with your input",
                messages:helper.validationErrorsToArray(validator.errors.all())});
            return next(error);
        }

};