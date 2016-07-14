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
            } else if(state) {
                req.state = state;
                next();
            } else {
                next('Could not get state');
            }
        });

    });
};

exports.lgaIdParam = function(req,res,next,id){

    pool.getConnection(function(err,connection){
        if (err) {
            res.status(503).json({"message" : "Error in connecting to database"});
            console.error({"message" : "Error in connecting to database","Error":err.stack});
            return;
        }
        console.log('connected as id ' + connection.threadId);
        var query = connection.query('SELECT * FROM lgas WHERE lga_id=? LIMIT 1',[sanitize(id)],function(err, lga) {
            connection.release();
            if (err) {
                console.error('Error executing query: ' + err.stack);
                next(err);
            } else if(lga) {
                req.lga = lga;
                next();
            } else {
                next('Could not get Local Government');
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

exports.lgaById = function(req,res){

    var lga = req.lga;
    if(lga)
    {
        res.status(200).json(outputFormat.generalOutputFormat(200,"",lga));
    }
    else{
        res.status(404).json({"Error":"Resource not found"});
    }
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
    if(req.state && req.state[0])
    {
        var stateId = sanitize(req.state[0].state_id);
        var pageNum = sanitize(req.params.page),
            itemsPerPage = config.reportItemsPerPage,
            previousPage = pageNum - 1,
            offset = previousPage * itemsPerPage,
            nextTotalItem = (pageNum * itemsPerPage) - offset,
            pageInfo = {};
        pageInfo.current_page = config.baseUrl+'/v1/states/'+stateId+'/reports/page/'+pageNum;
        if(pageNum > 1)
        {
            var previousPageNum = parseInt(pageNum,"10") - 1;
            pageInfo.previous_page = con*fig.baseUrl+'/v1/states/'+stateId+'/reports/page/'+previousPageNum;
        }

        needle.get(config.baseUrl+'/v1/states/'+stateId+'/reports/count', function(error, response) {
            if (!error && response.statusCode == 200)
            {
                if(response.body.count > (pageNum * itemsPerPage))
                {
                    var nextPageNum = parseInt(pageNum,"10")+1;
                    pageInfo.next_page = config.baseUrl+'/v1/states/'+stateId+'/reports/page/'+nextPageNum;
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
            var queryString = 'SELECT a.report_id, a.title, a.description, b.mobile_user_id, b.first_name, b.last_name, b.avatar, c.sector, d.state AS report_state,'+
                'e.country, e.state AS gps_state, e.lga_city, e.address FROM reports a '+
                'JOIN mobile_users b ON a.mobile_user_id = b.mobile_user_id '+
                'INNER JOIN sectors c ON a.sector_id = c.sector_id '+
                'INNER JOIN states d ON a.state_id = d.state_id '+
                'LEFT OUTER JOIN locations e ON a.location_id = e.location_id '+
                'WHERE a.state_id=?  ORDER BY a.created_at DESC LIMIT '+offset+', '+nextTotalItem;


            var query = connection.query(queryString,[stateId],function(err, reports) {
                connection.release();
                if (err) {
                    console.error('Error executing query: ' + err.stack);
                    res.json(outputFormat.generalOutputFormat(503,"We encountered an error in getting reports"));


                } else if(reports.length) {
                    needle.get(config.baseUrl+'/v1/states/'+stateId+'/reports/count', function(error, response) {
                        if (!error && response.statusCode == 200)
                        {
                            console.log('needle response ',response.body);
                            res.status(200).json(outputFormat.reportOutputFormat(reports,response.body.count,200,"",pageInfo));
                        }
                        else{
                            res.status(200).json(outputFormat.reportOutputFormat(reports,0,200,"",pageInfo));

                        }
                    });

                } else {
                    res.json(outputFormat.generalOutputFormat(404,"We couldn't get reports you requested for"));

                }
            });

        });

    }
    else{
        res.json(outputFormat.generalOutputFormat(404,"This state does not exist, we can't get any report associated with it"));
    }

};

exports.getStateReportsCount = function(req,res){
    var stateId = sanitize(req.params.id);
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

            } else if(result) {
                console.log('reports count',result[0].total_reports_count);
                res.status(200).json({count: result[0].total_reports_count,message : ""});
            } else {
                res.status(503).json({count: 0,message : "Error getting reports count"});
            }
        });

    });

};
