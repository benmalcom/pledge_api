/**
 * Created by Malcom on 10/3/2015.
 */
var ValidatorJs = require('validatorjs');
var uuid = require('uuid');
var _ = require('underscore');
var dateFormat = require('dateformat');
var needle = require('needle');
var config = require('../../config/config');
var pool = require('../../server/connection');
var sanitize = require('../../utils/cleaner');
var outputFormat = require('../../utils/output-format');
var helper = require('../../utils/helper');
var io = ('../../server/io.js');

exports.userIdParam = function(req,res,next,id){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({"message" : "Error in connecting to database"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM mobile_users WHERE mobile_user_id=? LIMIT 1',[sanitize(id)],function(err, user) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else if(user) {
                req.user = user;
                next();
            } else {
                next('Could not get user');
            }
        });

    });
};

exports.mobileParam = function(req,res,next,mobileNo){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM mobile_users WHERE mobile=? LIMIT 1',[sanitize(mobileNo)],function(err, user) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else if(user) {
                req.userByMobile = user;
                next();
            } else {
                next('Could not get user with such mobile');
            }
        });

    });
};

exports.emailParam = function(req,res,next,email){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM mobile_users WHERE email=? LIMIT 1',[sanitize(email)],function(err, user) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else if(user) {
                req.userByEmail = user;
                next();
            } else {
                next('Could not get user with such email');
            }
        });

    });
};

exports.getUser = function(req,res){
    var user = helper.unescapeAvatar(req.user),
    pageInfo = {};
    pageInfo.statusCode = 200;
    pageInfo.dataName = "users";
    if(user[0])
    {
        res.status(200).json(outputFormat.dataResponse(user,pageInfo));
    }
    else
    {
        res.status(200).json(outputFormat.dataResponse(user,pageInfo));
    }
};

exports.getUserByMobile = function(req,res){
    var user = helper.unescapeAvatar(req.userByMobile),
    response = {},
    pageInfo = {};
    pageInfo.statusCode = 200;
    pageInfo.dataName = "users";
    response.account_registered = false;
    if(!_.isEmpty(user))
    {
        response.account_registered = true;
        _.extend(response,outputFormat.dataResponse(user,pageInfo));
        res.status(200).json(response);
    }
    else
    {
        response.status_code = 200;
        response.user_error_message = "No user found with this Phone number";
        response.developer_error_message = "Resource not found";
        _.extend(response,outputFormat.dataResponse(user,pageInfo));
        res.status(200).json(response);
    }
};


exports.all = function(req,res){
    var pageInfo = {};
    pageInfo.dataName = "users";
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM mobile_users',function(err, users) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in getting requested users"));
            } else{
                pageInfo.statusCode = 200;
                pageInfo.totalCount = users.length;
                res.status(200).json(outputFormat.dataResponse(helper.unescapeAvatar(users),pageInfo));
            }
        });

    });
};



exports.updateUser = function(req,res){
    var userId = sanitize(req.params.id);
    var user = req.user[0];
    var pageInfo = {};
    pageInfo.dataName = "users";
    if(user)
    {
        _.extend(user,req.body);
        delete user.api_id;
        delete user.api_key;
        user.updated_at = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
            var data = [sanitize(user.first_name),sanitize(user.last_name),sanitize(user.mobile),sanitize(user.avatar),sanitize(user.gender),sanitize(user.lga_id),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),userId],
            query = 'UPDATE mobile_users SET first_name=?,last_name=?,mobile=?,avatar=?,gender=?,lga_id=?,updated_at=? WHERE mobile_user_id=?';

       pool.getConnection(function(err,connection){
           if (err) {
               res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
               console.log({"message" : "Error in connecting to database","Error":err.stack});
               return;
           }
           console.log('connected to database as id ' + connection.threadId);
           connection.query(query,data,function(err,result){
               connection.release();
               if(err)
               {
                   console.error('Error executing query: ' + err.stack);
                   res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in updating your data"));
               }
               else
               {
                   pageInfo.statusCode = 200;
                   pageInfo.totalCount = 1;
                   res.status(200).json(outputFormat.dataResponse(helper.unescapeAvatar([user]),pageInfo));

               }
           });

       });

    }
    else{
        res.status(404).json({"Error" : "Can't update, user not found!"});
    }

};

exports.getUserReportsById = function(req,res){
    if(req.user && req.user[0])
    {
        var mobileUserId = req.user[0].mobile_user_id,
            pageNum = sanitize(req.params.page),
            itemsPerPage = config.reportItemsPerPage,
            previousPage = pageNum - 1,
            offset = previousPage * itemsPerPage,
            nextTotalItem = (pageNum * itemsPerPage) - offset,
            pageInfo = {};
            pageInfo.dataName = "reports";
        if(pageNum > 1)
        {
            var previousPageNum = parseInt(pageNum,"10") - 1;
            pageInfo.previous_page = config.baseUrl+'/v1/users/'+mobileUserId+'/reports/page/'+previousPageNum;
        }
        pageInfo.current_page = config.baseUrl+'/v1/users/'+mobileUserId+'/reports/page/'+pageNum;

        needle.get(config.baseUrl+'/v1/users/'+mobileUserId+'/reports/count', function(error, response) {
            if (!error && response.statusCode == 200)
            {
                if(response.body.count > (pageNum * itemsPerPage))
                {
                    var nextPageNum = parseInt(pageNum,"10")+1;
                    pageInfo.next_page = config.baseUrl+'/v1/users/'+mobileUserId+'/reports/page/'+nextPageNum;
                }
            }

        });



        pool.getConnection(function(err,connection){
            if (err) {
                res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                console.error({"message" : "Error in connecting to database","Error":err.stack});
                return;
            }


            var queryString = 'SELECT '+
                '(SELECT  COUNT(report_id) FROM report_comments WHERE report_id=a.report_id) AS comments,'+
                '(SELECT COUNT(report_id) FROM report_votes WHERE report_id=a.report_id) AS votes, '+
                '(SELECT COUNT(report_id) FROM report_followers WHERE report_id=a.report_id) AS followers,'+

                'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+mobileUserId+' LIMIT 1)) '+
                    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
                'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+mobileUserId+' LIMIT 1)) '+
                    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed,'+

                'a.report_id, a.title, a.description, a.images, a.created_at, a.updated_at, b.mobile_user_id, b.first_name,b.last_name, b.avatar,' +
                'c.sector, d.state AS report_state, e.country, e.state AS gps_state, e.lga_city,e.address FROM reports a '+
                'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
                'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
                'INNER JOIN states d ON a.state_id = d.state_id '+
                'LEFT OUTER JOIN locations e ON a.location_id = e.location_id '+
                'WHERE a.mobile_user_id=? AND a.spam = ? ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;


            var query = connection.query(queryString,[mobileUserId,0],function(err, reports) {
                connection.release();
                if (err) {
                    console.error('Error executing query: ' + err.stack);
                    res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting your reports"));
                } else {
                    pageInfo.statusCode = 200;
                    needle.get(config.baseUrl+'/v1/users/'+mobileUserId+'/reports/count', function(error, response) {
                        if (!error && response.statusCode == 200)
                        {
                            pageInfo.totalCount = response.body.count;
                            res.status(200).json(outputFormat.dataResponse(reports,pageInfo));
                        }
                        else{
                            res.status(200).json(outputFormat.dataResponse(reports,pageInfo));
                        }
                    });

                }
            });

        });

    }
    else
    {
        res.status(404).json(outputFormat.generalOutputFormat(404,"This user does not exist, hence, no report associated."));
    }

};


exports.getUserReportsCountById = function(req,res){
    var mobileUserId = sanitize(req.params.id);
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({count: 0,message : "Error in connecting to database for report count"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var queryString = 'SELECT COUNT(report_id) as user_reports_count FROM reports WHERE mobile_user_id=? ';


        var query = connection.query(queryString,[mobileUserId],function(err, count) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(503).json({count: 0,message : "Error in executing query to count report "});

            } else if(count) {
                res.status(200).json({count: count[0].user_reports_count,message : ""});
            } else {
                res.status(503).json({count: 0,message : "Error getting reports count"});
            }
        });

    });

};

exports.saveUser = function (req,res) {
    if(req.body)
    {
        var userData = {
            firstname: req.body.first_name,
            lastname: req.body.last_name,
            email : req.body.email,
            gender : req.body.gender,
            mobile : req.body.mobile
        };

        var rules = {
            firstname: 'required',
            lastname: 'required',
            email : 'required|email',
            gender: 'required',
            mobile : 'required'
        };
        var validation = new ValidatorJs(userData,rules);
        if(validation.passes())
        {

            var first_name = sanitize(req.body.first_name),
                last_name = sanitize(req.body.last_name),
                email = sanitize(req.body.email),
                mobile = sanitize(req.body.mobile),
                gender = sanitize(req.body.gender),
                avatar = req.body.avatar ? sanitize(req.body.avatar) : "",
                lga_id = req.body.lga_id ? sanitize(req.body.lga_id) : "";


            pool.getConnection(function(err,connection){
                if (err) {
                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                    return;
                }
                console.log('connected to database as id ' + connection.threadId);
                var token = uuid.v1(),
                    data = [first_name,last_name,email,mobile,avatar,gender,lga_id,token,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")],
                    query = 'INSERT INTO mobile_users(first_name,last_name,email,mobile,avatar,gender,lga_id,token,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)';

                connection.query(query,data,function(err,result){
                    connection.release();
                    if(err)
                    {
                        console.error('Error executing query: ' + err.stack);
                        res.json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your data"));

                    }

                    else if(result.insertId)
                    {
                        var lastId = result.insertId;
                        io.emit('new user',lastId);
                        res.redirect('/v1/users/'+lastId);
                    }
                    else
                    {
                        res.status(503).json(outputFormat.generalOutputFormat(503,"Sorry! we can't save your data at this time"));

                    }
                });

            });


        }
        else{
            res.status(400).json(outputFormat.generalOutputFormat(400,"Some fields were omitted"));
        }

    }
    else{
        res.status(400).json(outputFormat.generalOutputFormat(400,"An empty form was submitted"));
    }
};