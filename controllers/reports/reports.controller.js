/**
 * Created by Malcom on 10/3/2015.
 */
var ValidatorJs = require('validatorjs');
var validator = require('validator');
var _ = require('underscore');
var dateFormat = require('dateformat');
var needle = require('needle');
var config = require('../../config/config');
var pool = require('../../server/connection');
var sanitize = require('../../utils/cleaner');
var helper = require('../../utils/helper');
var outputFormat = require('../../utils/output-format');
var io = require('../../server/io');

exports.reportIdParam = function(req,res,next,id){
    var loggedInUserId = sanitize(req.query.loggedInUserId);
    var additionalQuery = loggedInUserId ? 'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
                                                    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
                                              'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
                                                    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, ' : '';
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }

        var queryString = 'SELECT '+
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
        var data = [sanitize(id),0];
        var query = connection.query(queryString,data,function(err, report) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else {
                req.report = report;
                next();
            }
        });

    });
};


exports.getReportById = function(req,res){
        var report = req.report,
        pageInfo = {};
        pageInfo.statusCode = 200;
        pageInfo.dataName = "reports";
    if(report)
    {
        pageInfo.totalCount = report.length;
        res.status(200).json(outputFormat.dataResponse(report,pageInfo));
    }
    else
    {
        res.status(200).json(outputFormat.dataResponse(report,pageInfo));
    }
};

exports.all = function(req,res){
    var loggedInUserId = sanitize(req.query.loggedInUserId);
    var additionalQuery = loggedInUserId ? 'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
    'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, ' : '';

    var pageNum = parseInt(sanitize(req.params.page),"10"),
        itemsPerPage = config.reportItemsPerPage,
        previousPageNum =  pageNum - 1,
        offset = previousPageNum * itemsPerPage,
        nextTotalItem = (pageNum * itemsPerPage) - offset,
        pageInfo = {};
        pageInfo.current_page = loggedInUserId ? config.baseUrl+'/v1/reports/page/'+pageNum+'?loggedInUserId='+loggedInUserId : config.baseUrl+'/v1/reports/page/'+pageNum;
        if(previousPageNum > 0)
        {
            pageInfo.current_page = config.baseUrl+'/v1/reports/page/'+previousPageNum;
            pageInfo.current_page += loggedInUserId ? '?loggedInUserId='+loggedInUserId : '';
        }

    needle.get(config.baseUrl+'/v1/count/reports', function(error, response) {
        if (!error && response.statusCode == 200)
        {
            if(response.body.count > (pageNum * itemsPerPage))
            {
                var nextPageNum = pageNum + 1;
                pageInfo.next_page = config.baseUrl+'/v1/reports/page/'+nextPageNum;
                pageInfo.next_page += loggedInUserId ? '?loggedInUserId='+loggedInUserId : '';
            }
        }

    });



    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);

        var queryString = 'SELECT '+
        '(SELECT COUNT(report_id) FROM report_votes WHERE report_id=a.report_id) AS votes,'+
        '(SELECT COUNT(report_id) FROM report_followers WHERE report_id=a.report_id) AS followers,'+
        '(SELECT  COUNT(report_id) FROM report_comments WHERE report_id=a.report_id) AS comments,'+additionalQuery+
            'a.report_id, a.title, a.description, a.images,a.address,a.gps,a.created_at, a.updated_at, b.mobile_user_id, b.first_name,b.last_name, b.avatar,' +
            'c.sector, d.state AS report_state, e.lga FROM reports a '+
            'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
            'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
            'INNER JOIN states d ON a.state_id = d.state_id '+
            'INNER JOIN lgas e ON a.lga_id = e.lga_id '+
            'WHERE a.spam = ? ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;


        var query = connection.query(queryString,[0],function(err, reports) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting reports"));
            }
            else
            {
                pageInfo.dataName = "reports";
                pageInfo.statusCode = 200;
                needle.get(config.baseUrl+'/v1/count/reports', function(error, response) {
                    if (!error && response.statusCode == 200)
                    {
                        pageInfo.totalCount = response.body.count;
                        console.log('count ',pageInfo.totalCount);
                    }
                    res.status(200).json(outputFormat.dataResponse(reports,pageInfo));
                });

            }
        });

    });

};

exports.getTotalReportsCount = function(req,res){
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({count: 0,message : "Error in connecting to database for report count"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var queryString = 'SELECT COUNT(*) as total_reports_count FROM reports WHERE spam=?';
        var data = [0];

        var query = connection.query(queryString,data,function(err, result) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(503).json({count: 0,message : "Error in executing query to count report "});

            } else if(result) {
                console.log('reports count',result[0].total_reports_count);
                res.status(200).json({count: result[0].total_reports_count,message : ""});
            } else {
                res.status(503).json({count: 0,message : "Error getting reports count"});
            }
        });

    });

};

exports.reportExists = function (req,res) {
    if(req.body)
    {
        var reportData = {
            title: req.body.title,
            sector_id: req.body.sector_id,
            mobile_user_id : req.body.mobile_user_id,
            state_id : req.body.state_id,
            lga_id : req.body.lga_id
        };

        var rules = {
            title: 'required',
            sector_id: 'required|numeric|min:1',
            mobile_user_id : 'required|numeric|min:1',
            state_id: 'required|numeric|min:1',
            lga_id: 'required|numeric|min:1'
        };
        var validation = new ValidatorJs(reportData,rules);

        if(validation.passes())
        {
            var title = sanitize(req.body.title),
                sector_id = sanitize(req.body.sector_id),
                mobile_user_id = sanitize(req.body.mobile_user_id),
                lga_id = sanitize(req.body.lga_id),
                state_id = sanitize(req.body.state_id),
                report_time = dateFormat(Date.parse(sanitize(validator.toDate(req.body.report_time))), "yyyy-mm-dd hh:MM:ss"),
                description = req.body.description ? sanitize(req.body.description) : null,
                images = req.body.media ? sanitize(req.body.media) : null;
            gps = req.body.gps ?  sanitize(req.body.gps) : null;
            address = req.body.address ?  sanitize(req.body.address) : null;

            pool.getConnection(function(err,connection){
                if (err) {
                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                    return;
                }

                var data = [title,description,images,sector_id,lga_id,state_id,mobile_user_id,gps,address],
                    query = 'SELECT title,description,images,sector_id,lga_id,state_id,mobile_user_id,gps,address FROM reports ' +
                        'WHERE title=? AND description=? AND images=? AND sector_id=? AND lga_id=? AND state_id=? AND mobile_user_id=? AND gps=? AND address = ?';


                connection.query(query,data,function(err,result){
                    connection.release();
                    if(err)
                    {
                        console.error('Error executing query: ' + err.stack);
                        res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in verifying the existence of this report"));

                    }
                    else
                    {
                        var pageInfo = {};
                        pageInfo.statusCode = result.length ? 200 : 404;
                        pageInfo.success = result.length ? true : false;
                        pageInfo.mssg =  result.length ? "Report exists" : "Report does not exist";
                        res.status(200).json(outputFormat.generalResponse(pageInfo));
                    }
                });

            });
        }
        else{
            console.log(validation.errors);
            res.status(400).json(outputFormat.generalOutputFormat(400,"Some field were omitted"));

        }

    }
    else{
        res.status(400).json(outputFormat.generalOutputFormat(400,"The form submitted is empty"));

    }
};

exports.saveReport = function (req,res) {
    if(req.body)
    {
        var reportData = {
            title: req.body.title,
            sector_id: req.body.sector_id,
            mobile_user_id : req.body.mobile_user_id,
            state_id : req.body.state_id,
            lga_id : req.body.lga_id,
            report_time : req.body.report_time,
            unique_id : req.body.unique_id
        };

        var rules = {
            title: 'required',
            sector_id: 'required|numeric|min:1',
            mobile_user_id : 'required|numeric|min:1',
            state_id: 'required|numeric|min:1',
            lga_id: 'required|numeric|min:1',
            report_time: 'required',
            unique_id: 'required'
        };
        var validation = new ValidatorJs(reportData,rules);

        if(validation.passes())
        {
            console.log('passed report validation!');

                        var title = sanitize(req.body.title),
                            sector_id = sanitize(req.body.sector_id),
                            mobile_user_id = sanitize(req.body.mobile_user_id),
                            lga_id = sanitize(req.body.lga_id),
                            state_id = sanitize(req.body.state_id),
                            report_time = dateFormat(Date.parse(sanitize(validator.toDate(req.body.report_time))), "yyyy-mm-dd hh:MM:ss"),
                            description = req.body.description ? sanitize(req.body.description) : null,
                            images = req.body.media ? sanitize(req.body.media) : null;
                            gps = req.body.gps ?  sanitize(req.body.gps) : null;
                            address = req.body.address ?  sanitize(req.body.address) : null;
                            unique_id = sanitize(req.body.unique_id);

                        pool.getConnection(function(err,connection){
                            if (err) {
                                res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                                console.error({"message" : "Error in connecting to database","Error":err.stack});
                                return;
                            }

                            var data = [title,description,report_time,images,sector_id,lga_id,state_id,mobile_user_id,gps,address,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),unique_id],
                                query = 'REPLACE INTO reports(title,description,report_time,images,sector_id,lga_id,state_id,mobile_user_id,gps,address,created_at,updated_at,unique_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)';


                            connection.query(query,data,function(err,result){
                                connection.release();
                                if(err)
                                {
                                    console.error('Error executing query: ' + err.stack);
                                    res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your report data"));

                                }
                                else if(result.insertId)
                                {
                                    var newReportId = result.insertId;
                                    io.sockets.emit('new report',newReportId);
                                    res.redirect(config.baseUrl+'/v1/reports/'+newReportId);

                                }
                                else
                                {
                                    res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your report data"));

                                }
                            });

                        });
        }
        else{
            res.status(400).json(outputFormat.generalOutputFormat(400,"Some field were omitted"));

        }

    }
    else{
        res.status(400).json(outputFormat.generalOutputFormat(400,"The form submitted is empty"));

    }
};

exports.getReportAndCommentById = function (req,res) {
    var reportId = validator.escape(req.params.id),
        pageInfo = {};
    pageInfo.statusCode = 200;
    pageInfo.dataName = "comments";

   console.info('report id ',reportId);
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);

        var queryString = 'SELECT a.*,b.first_name,b.last_name,b.avatar FROM report_comments a ' +
            'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
            'WHERE a.report_id = ? ' +
            'ORDER BY a.created_at DESC';
        var query = connection.query(queryString,[reportId],function(err, comments) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting comments for this report"));
            }
            else
            {
                pageInfo.totalCount = comments.length;
                res.status(200).json(outputFormat.dataResponse(comments,pageInfo));
            }
        });

    });

};
exports.getReportAndFollowersById = function (req,res) {
    var reportId = validator.escape(req.params.id),
        pageInfo = {};
    pageInfo.statusCode = 200;
    pageInfo.dataName = "followers";

    if(req.query.extraParams)
    {
        console.log('extra params found ');
        var extraParams = JSON.parse(req.query.extraParams);
        for(var i in extraParams)
        {
            if(extraParams.hasOwnProperty(i))
            {
                pageInfo[i] = extraParams[i];
            }
        }
    }

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);

        var queryString = 'SELECT a.*,b.first_name,b.last_name,b.avatar FROM report_followers a ' +
            'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
            'WHERE a.report_id = ? ' +
            'ORDER BY a.created_at DESC';
        var query = connection.query(queryString,[reportId],function(err, followers) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting followers for this report"));
            }
            else
            {
                console.log('response ',followers);
                pageInfo.totalCount = followers.length;
                res.status(200).json(outputFormat.dataResponse(followers,pageInfo));
            }
        });

    });

};

exports.getReportAndUpdatesById = function (req,res) {
    var reportId = validator.escape(req.params.id),
        pageInfo = {};
    pageInfo.statusCode = 200;
    pageInfo.dataName = "updates";

    if(req.query.extraParams)
    {
        console.log('extra params found ');
        var extraParams = JSON.parse(req.query.extraParams);
        for(var i in extraParams)
        {
            if(extraParams.hasOwnProperty(i))
            {
                pageInfo[i] = extraParams[i];
            }
        }
    }

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);

        var queryString = 'SELECT a.*,b.first_name,b.last_name,b.avatar FROM report_updates a ' +
            'INNER JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id ' +
            'WHERE a.report_id = ? ' +
            'ORDER BY a.created_at DESC';
        var query = connection.query(queryString,[reportId],function(err, updates) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting updates for this report"));
            }
            else
            {
                console.log('updates ',updates);
                pageInfo.totalCount = updates.length;
                res.status(200).json(outputFormat.dataResponse(updates,pageInfo));
            }
        });

    });

};



exports.modifyReport = function (req,res) {
    if(req.body)
    {
        var userData = {
            tag: req.body.tag,
            report_id : req.body.report_id
        };

        var rules = {
            tag: 'required',
            report_id : 'required'
        };
        var validation = new ValidatorJs(userData,rules);

        if(validation.passes())
        {
            pool.getConnection(function(err,connection){
                if (err) {
                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                    return;
                }

                var tag = userData.tag.toLowerCase(),
                    query = "",
                    data = [];
                if(tag=="spam")
                {
                    query = 'UPDATE reports SET spam = ?,updated_at = ? WHERE report_id = ?',
                    data = [1,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),userData.report_id];
                }
                connection.query(query,data,function(err,result){
                    connection.release();
                    if(err)
                    {
                        console.error('Error executing query: ' + err.stack);
                        res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in carrying out this operation"));
                    }
                    else
                    {
                        var pageInfo = {
                            statusCode:200,
                            success:true
                        };
                        if(result.affectedRows)
                        {
                            console.log("Report changed to spam");
                            res.status(200).json(outputFormat.generalResponse(pageInfo));
                        }
                        else
                        {
                            pageInfo.success = false;
                            pageInfo.mssg = "This action was not completed";
                            res.status(200).json(outputFormat.generalResponse(pageInfo));
                        }
                    }
                });
            });


        }
        else{
            res.status(400).json(outputFormat.generalOutputFormat(400,"Some field were omitted"));
        }
    }
    else{
        res.status(400).json(outputFormat.generalOutputFormat(400,"The form submitted is empty"));

    }
};