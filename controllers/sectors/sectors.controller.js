/**
 * Created by Malcom on 10/3/2015.
 */
var uuid = require('uuid');
var _ = require('underscore');
var dateFormat = require('dateformat');
var needle = require('needle');

var pool = require('../../server/connection');
var sanitize = require('../../utils/cleaner');
var outputFormat = require('../../utils/output-format');
var config = require('../../config/config');



exports.sectorIdParam = function(req,res,next,id){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM sectors WHERE sector_id=? LIMIT 1',[sanitize(id)],function(err, sector) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else if(sector) {
                req.sector = sector;
                next();
            } else {
                next('Could not get sector');
            }
        });

    });
};

exports.sector = function(req,res){
    var sector = req.sector;
    if(sector[0])
    {
        res.status(200).json(outputFormat.generalOutputFormat(200,"",sector));
    }
    else
    {
        res.status(404).json(outputFormat.generalOutputFormat(404,"We can't find this sector"));

    }
};

exports.all = function(req,res){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({"message" : "Error in connecting to database"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM sectors',function(err,sectors) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                res.status(500).send({"message":"a problem occurred with your request, we're fixing it!"});
            } else if(sectors) {
                res.status(200).json(outputFormat.generalOutputFormat(200,"",sectors));
            } else {
                res.json(outputFormat.generalOutputFormat(404,"Resource not found"));

            }
        });

    });
};

exports.getReportsBySector = function(req,res)
{
    var loggedInUserId = sanitize(req.query.loggedInUserId);
    var additionalQuery = loggedInUserId ? 'CASE ISNULL((SELECT report_vote_id FROM report_votes  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS voted,'+
    'CASE ISNULL((SELECT report_follower_id FROM report_followers  WHERE report_id = a.report_id AND mobile_user_id='+loggedInUserId+' LIMIT 1)) '+
    'WHEN 0 THEN 1 WHEN 1 THEN 0 end AS followed, ' : '';

    if(req.sector && req.sector[0])
    {
        var sectorId = req.sector[0].sector_id;
        var pageNum = sanitize(req.params.page),
            itemsPerPage = config.reportItemsPerPage,
            previousPage = pageNum - 1,
            offset = previousPage * itemsPerPage,
            nextTotalItem = (pageNum * itemsPerPage) - offset,
            pageInfo = {};
        var baseUrl = config.baseUrl+'/v1/sectors/'+sectorId+'/reports/page/'+pageNum;
        pageInfo.current_page = loggedInUserId ? baseUrl+'?loggedInUserId='+loggedInUserId : baseUrl;
        if(pageNum > 1)
        {
            var previousPageNum = parseInt(pageNum,"10") - 1;
            baseUrl = config.baseUrl+'/v1/sectors/'+sectorId+'/reports/page/'+previousPageNum;
            pageInfo.previous_page = loggedInUserId ? baseUrl+'?loggedInUserId='+loggedInUserId : baseUrl;
        }

        needle.get(config.baseUrl+'/v1/sectors/'+sectorId+'/reports/count', function(error, response) {
            if (!error && response.statusCode == 200)
            {
                if(response.body.count > (pageNum * itemsPerPage))
                {
                    var nextPageNum = parseInt(pageNum,"10")+1;
                    baseUrl = config.baseUrl+'/v1/sectors/'+sectorId+'/reports/page/'+nextPageNum;
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
                'WHERE a.sector_id=?  ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;


            var query = connection.query(queryString,[sectorId],function(err, reports) {
                connection.release();
                if (err) {
                    console.error('Error executing query: ' + err.stack);
                    res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting reports"));


                } else{
                    pageInfo.dataName = "reports";
                    pageInfo.statusCode = 200;
                    needle.get(config.baseUrl+'/v1/sectors/'+sectorId+'/reports/count', function(error, response) {
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
        res.json(outputFormat.generalOutputFormat(404,"This sector does not exist, we can't get any report associated with it"));
    }

};

exports.getSectorReportsCount = function(req,res){
    var sectorId = sanitize(req.params.id);
    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({count: 0,message : "Error in connecting to database for report count"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var queryString = 'SELECT COUNT(*) as total_reports_count FROM reports WHERE sector_id = ?';


        var query = connection.query(queryString,[sectorId],function(err, result) {
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
