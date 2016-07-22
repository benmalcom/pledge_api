/**
 * Created by Richard on 10/6/2015.
 */
var uuid = require('uuid');
var _ = require('underscore');
var dateFormat = require('dateformat');
var needle = require('needle');

var pool = require('../../server/connection');
var sanitize = require('../../utils/cleaner');
var outputFormat = require('../../utils/output-format');
var config = require('../../config/config');



exports.stateIdParam = function(req,res,next,id){
   console.log('state Id ',req.params.id);
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({"message" : "Error in connecting to database"});
            console.error({"Message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM states WHERE state_id=? LIMIT 1',[sanitize(id)],function(err, state) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else{
                console.log('state ',state);
                req.state = state;
                next();
            }
        });

    });
};

exports.lgasByState = function(req,res){

    var stateId = req.state[0].state_id;
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({"message" : "Error in connecting to database"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM lgas WHERE state_id=?',[stateId],function(err, lgas) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(503).send(err.stack);
            } else if(lgas.length) {
                res.json(outputFormat.generalOutputFormat(200,"",lgas));
            } else {
                res.status(404).json({"Error":"Resource not found"});
            }
        });

    });
};


exports.allStates = function(req,res){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({"Message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM states',function(err, states) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(503).send(err.stack);
            } else if(states.length) {
                res.status(200).json(outputFormat.generalOutputFormat(200,"",states));
            } else {
                res.status(404).json({"Error":"Resource not found"});
            }
        });

    });
};

exports.stateById = function(req,res){

    var state = req.state;
    if(state)
    {
        res.json(outputFormat.generalOutputFormat(200,"",state));
    }
    else{
        res.status(404).json({"Error":"Resource not found"});
    }
};


exports.getReportsByState = function(req,res)
{
    var loggedInUserId = sanitize(req.query.loggedInUserId);
    var additionalQuery = loggedInUserId ? 'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
    'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, ' : '';

    if(req.state)
    {
        console.log('state here ',req.state);
        var stateId = req.state[0].state_id;
        var pageNum = sanitize(req.params.page),
            itemsPerPage = config.reportItemsPerPage,
            previousPage = pageNum - 1,
            offset = previousPage * itemsPerPage,
            nextTotalItem = (pageNum * itemsPerPage) - offset,
            pageInfo = {};
        var baseUrl = config.baseUrl+'/v1/states/'+stateId+'/reports/page/'+pageNum;
        pageInfo.current_page = loggedInUserId ? baseUrl+'?loggedInUserId='+loggedInUserId : baseUrl;
        if(pageNum > 1)
        {
            var previousPageNum = parseInt(pageNum,"10") - 1;
            baseUrl = config.baseUrl+'/v1/states/'+stateId+'/reports/page/'+previousPageNum;
            pageInfo.previous_page = loggedInUserId ? baseUrl+'?loggedInUserId='+loggedInUserId : baseUrl;
        }

        needle.get(config.baseUrl+'/v1/states/'+stateId+'/reports/count', function(error, response) {
            if (!error && response.statusCode == 200)
            {
                if(response.body.count > (pageNum * itemsPerPage))
                {
                    var nextPageNum = parseInt(pageNum,"10")+1;
                    baseUrl = config.baseUrl+'/v1/states/'+stateId+'/reports/page/'+nextPageNum;
                    pageInfo.next_page = loggedInUserId ? baseUrl+'?loggedInUserId='+loggedInUserId : baseUrl;
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
            var queryString = 'SELECT ' +
                '(SELECT  COUNT(report_id) FROM report_comments WHERE report_id=a.report_id) AS comments,'+
                '(SELECT COUNT(report_id) FROM report_votes WHERE report_id=a.report_id) AS votes, '+
                '(SELECT COUNT(report_id) FROM report_followers WHERE report_id=a.report_id) AS followers,'+additionalQuery+
                'a.report_id, a.title, a.description, a.images,a.address,a.gps,a.created_at, a.updated_at, b.mobile_user_id, b.first_name,b.last_name, b.avatar,' +
                'c.sector, d.state AS report_state, e.lga FROM reports a '+
                'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
                'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
                'INNER JOIN states d ON a.state_id = d.state_id '+
                'INNER JOIN lgas e ON a.lga_id = e.lga_id '+
                'WHERE a.state_id=?  ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;


            var query = connection.query(queryString,[stateId],function(err, reports) {
                connection.release();
                if (err) {
                    console.error('Error executing query: ' + err.stack);
                    res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting reports"));


                } else{
                    pageInfo.dataName = "reports";
                    pageInfo.statusCode = 200;
                    needle.get(config.baseUrl+'/v1/states/'+stateId+'/reports/count', function(error, response) {
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

    }
    else{
        res.json(outputFormat.generalOutputFormat(404,"This state does not exist, we can't get any report associated with it"));
    }

};

exports.getStateReportsCount = function(req,res){
    var stateId = req.state[0].state_id;
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({count: 0,message : "Error in connecting to database for report count"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var queryString = 'SELECT COUNT(*) as total_reports_count FROM reports WHERE state_id = ?';


        var query = connection.query(queryString,[stateId],function(err, result) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(503).json({count: 0,message : "Error in executing query to count report "});

            } else{
                console.log('reports count',result[0].total_reports_count);
                res.status(200).json({count: result[0].total_reports_count,message : ""});
            }
        });

    });

};