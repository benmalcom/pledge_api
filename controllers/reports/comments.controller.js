/**
 * Created by Malcom on 6/14/2016.
 */
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
var helper = require('../../utils/helper');
var outputFormat = require('../../utils/output-format');
var io = require('../../server/io')

exports.saveComment = function (req,res) {
    if(req.body)
    {
        var commentData = {
            mobile_user_id: req.body.mobile_user_id,
            comment_body: req.body.comment_body,
            report_id : req.body.report_id
        };

        var rules = {
            mobile_user_id: 'required',
            comment_body: 'required',
            report_id : 'required'
        };
        var validation = new ValidatorJs(commentData,rules);

        if(validation.passes())
        {
            console.log('passed validation!');
            pool.getConnection(function(err,connection){
                if (err) {
                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                    return;
                }
                console.log('connected to database as id ' + connection.threadId);

                var data = [commentData.comment_body,commentData.mobile_user_id,commentData.report_id,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")],
                    query = 'INSERT INTO report_comments(comment_body,mobile_user_id,report_id,created_at,updated_at) VALUES(?,?,?,?,?)';


                connection.query(query,data,function(err,result){
                    connection.release();
                    console.log('query executed!');
                    if(err)
                    {
                        console.error('Error executing query: ' + err.stack);
                        res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your comment"));
                    }
                    else
                    {
                        var pageInfo = {
                            statusCode:200,
                            success:true
                        };
                        if(result.affectedRows)
                        {
                            console.log("report comment posted");
                            res.status(200).json(outputFormat.generalResponse(pageInfo));
                            /*var goToUrl = config.apiPrefix+'/reports/'+commentData.report_id+'/followers?extraParams='+JSON.stringify(pageInfo);
                            console.log("go to url ",goToUrl);
                            res.redirect(goToUrl);*/
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