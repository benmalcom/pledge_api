/**
 * Created by Malcom on 10/3/2015.
 */
var ValidatorJs = require('validatorjs');
var validator = require('validator');
var _ = require('underscore');
var dateFormat = require('dateformat');
var config = require('config');
var helper = require('../../utils/helper');
var formatResponse = require('../../utils/format-response');
var pool = require('../../others/db/mysql_connection');


exports.reportIdParam = function(req,res,next,id){
    var error = {};
    var loggedInUserId = helper.sanitize(req.query.loggedInUserId);
    var additionalQuery = loggedInUserId ? 'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
    'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, ' : '';

    var query = 'SELECT '+
        '(SELECT  COUNT(report_id) FROM report_comments WHERE report_id=a.report_id) AS comments,'+
        '(SELECT COUNT(report_id) FROM report_votes WHERE report_id=a.report_id) AS votes, '+
        '(SELECT COUNT(report_id) FROM report_followers WHERE report_id=a.report_id) AS followers,'+additionalQuery+
        'a.report_id, a.title, a.description, a.images,a.address,a.gps,a.created_at, a.updated_at, b.mobile_user_id, b.first_name,b.last_name, b.avatar,' +
        'c.sector, d.state AS report_state, e.lga FROM reports a '+
        'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
        'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
        'INNER JOIN states d ON a.state_id = d.state_id '+
        'INNER JOIN lgas e ON a.lga_id = e.lga_id '+
        'WHERE a.report_id=? AND a.spam = ?';
    var data = [helper.sanitize(id),0];
    pool.getConnection().then(function(connection){
        connection.query(query,data)
            .then(function(rows){
                if(rows.length){
                    req.report = helper.processReport(rows[0]);
                    return next();
                }
                else {
                    error =  helper.transformToError({code:404,message:"Report not found!"});
                    return next(error);
                }
            },function(err){
                console.log("err ",err);
                error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                return next(error);
            }).finally(function() {
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


exports.getReportById = function(req,res,next){
    var report = req.report,
    meta = {code:200,success:true};
    res.status(meta.code).json(formatResponse.do(meta,report));
};

exports.all = function(req,res,next){
    var loggedInUserId = helper.sanitize(req.query.loggedInUserId);
    var urlQuery = req.query;
    var page = urlQuery.page ? helper.sanitize(urlQuery.page) : 1,
        error = {},
        filterQuery = "",
        meta = {success:true,code:200},
        itemsPerPage = config.get('itemsPerPage.default'),
        previous =  page > 1 ? page - 1 : 0,
        offset = previous * itemsPerPage,
        nextTotalItem = (page * itemsPerPage) - offset,
        baseRequestUrl = config.get('app.baseUrl')+'/v1/reports/';
    baseRequestUrl = loggedInUserId ? helper.appendQueryString(baseRequestUrl,'loggedInUserId='+loggedInUserId) : baseRequestUrl;
    //Extra filter checks here
    if(urlQuery.sector_id)
    {
        filterQuery += " AND a.sector_id = "+urlQuery.sector_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"sector_id="+urlQuery.sector_id);
    }
    if(urlQuery.state_id)
    {
        filterQuery += " AND a.state_id = "+urlQuery.state_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"state_id="+urlQuery.state_id);
    }
    if(urlQuery.lga_id)
    {
        filterQuery += " AND a.lga_id = "+urlQuery.lga_id;
        baseRequestUrl = helper.appendQueryString(baseRequestUrl,"lga_id="+urlQuery.lga_id);
    }


    meta.pagination =  {current_page:helper.appendQueryString(baseRequestUrl,'page='+page),current:page};
    if(previous > 0)
    {
        meta.pagination.previous = previous;
        meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,'page='+previous);
    }
    var additionalQuery = loggedInUserId ? ' CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
    'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, ' : '';


    var query = 'SELECT '+
        '(SELECT COUNT(report_id) FROM report_votes WHERE report_id=a.report_id) AS votes,'+
        '(SELECT COUNT(report_id) FROM report_followers WHERE report_id=a.report_id) AS followers,'+
        '(SELECT  COUNT(report_id) FROM report_comments WHERE report_id=a.report_id) AS comments,'+additionalQuery+
        'a.report_id, a.title, a.description, a.images,a.address,a.gps,a.created_at, a.updated_at, b.mobile_user_id, b.first_name,b.last_name, b.avatar,' +
        'c.sector, d.state AS report_state, e.lga FROM reports a '+
        'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
        'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
        'INNER JOIN states d ON a.state_id = d.state_id '+
        'INNER JOIN lgas e ON a.lga_id = e.lga_id '+
        'WHERE a.spam = ?'+filterQuery+' ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;
    var queryData = [0];
    var countQuery  = 'SELECT COUNT(a.report_id) as count FROM reports a WHERE a.spam = ?'+filterQuery;
    var countData = [0];
    pool.getConnection().then(function(connection){
                    return connection.query(query,queryData)
                        .then(function (rows) {
                            return [rows,connection.query(countQuery,countData)];
                        })
                        .spread(function(rows,countResult){
                            var count = countResult[0].count;
                            meta.pagination.total_count = count;
                            if(count > (page * itemsPerPage)) {
                                var next = parseInt(page,"10") + 1;
                                meta.pagination.previous_page = helper.appendQueryString(baseRequestUrl,"page="+next);
                                meta.pagination.next = next;
                            }
                            res.status(meta.code).json(formatResponse.do(meta,helper.processReport(rows)))
                        },function(err){
                            console.log("err ",err);
                            error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                            return next(error);
                        }).finally(function() {
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
exports.saveReport = function (req,res,next) {
        var obj = req.body,
            error = {};

        var rules = {
            title: 'required',
            sector_id: 'required|numeric|min:1',
            mobile_user_id : 'required|numeric|min:1',
            state_id: 'required|numeric|min:1',
            lga_id: 'required|numeric|min:1',
            report_time: 'required',
            unique_id: 'required'
        };
        var validation = new ValidatorJs(obj,rules);

        if(validation.passes())
        {
                        var description = obj.description ? helper.sanitize(obj.description) : "",
                            images = obj.media ? helper.sanitize(obj.media) : "",
                            gps = obj.gps ?  helper.sanitize(obj.gps) : "",
                            address = obj.address ?  helper.sanitize(obj.address) : "",
                            unique_id = helper.sanitize(obj.unique_id);
            pool.getConnection().then(function(connection){
                    var data = [obj.title,description,obj.report_time,images,obj.sector_id,obj.lga_id,obj.state_id,obj.mobile_user_id,gps,address,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),unique_id],
                        query = 'REPLACE INTO reports(title,description,report_time,images,sector_id,lga_id,state_id,mobile_user_id,gps,address,created_at,updated_at,unique_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)';
                    connection.query(query,data)
                        .then(function(result){
                            var lastId = result.insertId;
                            res.redirect('/v1/reports/'+lastId);
                        },function(err){
                            console.log("err ",err);
                            error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                            return next(error);
                        }).finally(function() {
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
                messages:helper.validationErrorsToArray(validation.errors.all())});
            return next(error);
        }
};

exports.getReportAndCommentById = function (req,res,next) {
    var reportId = req.report.report_id,
        error = {},
        meta = {success:true,code:200},
        urlQuery = req.query,
        page = urlQuery.page ? helper.sanitize(urlQuery.page) : 1,
        itemsPerPage = config.get('itemsPerPage.report'),
        previous = page - 1,
        offset = previous * itemsPerPage,
        nextTotalItem = (page * itemsPerPage) - offset,
        baseUrl = config.get('app.baseUrl')+'/v1/reports/'+reportId+'/comments';
    meta.pagination = {current_page: helper.appendQueryString(baseUrl,"page="+page), current:page} ;
    if(previous > 0)
    {
        meta.pagination.previous_page = helper.appendQueryString(baseUrl,"page="+previous);
        meta.pagination.previous = previous;
    }

    var query = 'SELECT a.*,b.first_name,b.last_name,b.avatar FROM report_comments a ' +
        'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
        'WHERE a.report_id = ? ' +
        'ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;
    var queryData = [reportId];
    var countQuery  = 'SELECT COUNT(a.report_id) as count FROM report_comments a ' +
        'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
        'WHERE a.report_id = ? ' +
        'ORDER BY a.created_at DESC';
    var countData = [reportId];

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
                            meta.pagination.previous_page = helper.appendQueryString(baseUrl,"next="+next);
                            meta.pagination.next = next;
                        }
                        res.status(meta.code).json(formatResponse.do(meta,helper.processComment(rows)))
                    },function(err){
                        console.log("err ",err);
                        error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                        return next(error);
                    }).finally(function() {
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
exports.getReportAndFollowersById = function (req,res,next) {
    var reportId = req.report.report_id,
        error = {},
        meta = {success:true,code:200},
        urlQuery = req.query,
        page = urlQuery.page ? helper.sanitize(urlQuery.page) : 1,
        itemsPerPage = config.get('itemsPerPage.report'),
        previous = page - 1,
        offset = previous * itemsPerPage,
        nextTotalItem = (page * itemsPerPage) - offset,
        baseUrl = config.get('app.baseUrl')+'/v1/reports/'+reportId+'/followers';
    meta.pagination = {current_page: helper.appendQueryString(baseUrl,"page="+page), current:page} ;
    if(previous > 0)
    {
        meta.pagination.previous_page = helper.appendQueryString(baseUrl,"page="+previous);
        meta.pagination.previous = previous;
    }

    var query = 'SELECT a.*,b.first_name,b.last_name,b.avatar FROM report_followers a ' +
        'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
        'WHERE a.report_id = ? ' +
        'ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;
    var queryData = [reportId];
    var countQuery  = 'SELECT COUNT(a.report_id) as count FROM report_followers a ' +
        'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
        'WHERE a.report_id = ? ' +
        'ORDER BY a.created_at DESC';
    var countData = [reportId];

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
                            meta.pagination.previous_page = helper.appendQueryString(baseUrl,"next="+next);
                            meta.pagination.next = next;
                        }
                        meta.success = true;
                        res.status(meta.code).json(formatResponse.do(meta,helper.processFollower(rows)))
                    },function(err){
                        console.log("err ",err);
                        error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                        return next(error);
                    }).finally(function() {
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

exports.getReportAndUpdatesById = function (req,res,next) {
    var reportId = req.report.report_id,
        error = {},
        meta = {success: true, code: 200},
        urlQuery = req.query,
        page = urlQuery.page ? helper.sanitize(urlQuery.page) : 1,
        itemsPerPage = config.get('itemsPerPage.report'),
        previous = page - 1,
        offset = previous * itemsPerPage,
        nextTotalItem = (page * itemsPerPage) - offset,
        baseUrl = config.get('app.baseUrl') + '/v1/reports/' + reportId + '/updates';
    meta.pagination = {current_page: helper.appendQueryString(baseUrl, "page=" + page), current: page};
    if (previous > 1) {
        meta.pagination.previous_page = helper.appendQueryString(baseUrl, "page=" + previous);
        meta.pagination.previous = previous;
    }

    var query = 'SELECT a.*,b.first_name,b.last_name,b.avatar FROM report_updates a ' +
        'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
        'WHERE a.report_id = ? ' +
        'ORDER BY a.created_at DESC LIMIT ' + offset + ', ' + nextTotalItem;
    var queryData = [reportId];
    var countQuery = 'SELECT COUNT(a.report_id) as count FROM report_updates a ' +
        'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
        'WHERE a.report_id = ? ' +
        'ORDER BY a.created_at DESC';
    var countData = [reportId];

    pool.getConnection()
        .then(function (connection) {
                return connection.query(query, queryData)
                    .then(function (rows) {
                        return [rows, connection.query(countQuery, countData)];
                    })
                    .spread(function (rows, countResult) {
                        var count = countResult[0].count;
                        meta.pagination.total_count = count;
                        if (count > (page * itemsPerPage)) {
                            var next = parseInt(page, "10") + 1;
                            meta.pagination.previous_page = helper.appendQueryString(baseUrl, "next=" + next);
                            meta.pagination.next = next;
                        }
                        res.status(meta.code).json(formatResponse.do(meta, helper.processUpdate(rows)))
                    }, function (err) {
                        console.log("err ", err);
                        error = helper.transformToError({
                            code: 503,
                            message: "Error in server interaction, please try again",
                            extra: err
                        });
                        return next(error);
                    }).finally(function() {
                        if (connection){
                            pool.releaseConnection(connection);
                            console.log("Connection released!");
                        }
                    });
            }
            , function (err) {
                error = helper.transformToError({code: 503, message: "Problem connecting to database", extra: err});
                return next(error);
            });
};
exports.modifyReport = function (req,res,next) {
        var obj = req.body;
        var rules = { tag: 'required', report_id : 'required'};
        var error = {};
        var meta = {success:true,code:200};
        var validation = new ValidatorJs(obj,rules);

            if(validation.passes())
            {
                pool.getConnection().then(function(connection){
                    var tag = obj.tag.toLowerCase(),
                        query = "",
                        data = [];
                    if(tag=="spam") {
                        query = 'UPDATE reports SET spam = ?,updated_at = ? WHERE report_id = ?',
                            data = [1,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),userData.report_id];
                    }
                    connection.query(query,data)
                        .then(function(result){
                            if(result.affectedRows)
                            res.status(meta.code).json(formatResponse.do(meta));
                        },function(err){
                            console.log("err ",err);
                            error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                            return next(error);
                        }).finally(function() {
                            if (connection){
                                pool.releaseConnection(connection);
                                console.log("Connection released!");
                            }
                        })
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