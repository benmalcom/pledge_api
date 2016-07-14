/**
 * Created by Malcom on 6/14/2016.
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

exports.saveVote = function (req,res) {
    if(req.body)
    {
        var voteData = {
            mobile_user_id: req.body.mobile_user_id,
            tag: req.body.tag,
            report_id : req.body.report_id
        };

        var rules = {
            mobile_user_id: 'required',
            tag: 'required',
            report_id : 'required'
        };
        var validation = new ValidatorJs(voteData,rules);

        if(validation.passes())
        {
            pool.getConnection(function(err,connection){
                if (err) {
                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                    return;
                }

                var tagCondition = voteData.tag.toLowerCase() == "upvote";
                var query = tagCondition ? 'INSERT INTO report_votes(mobile_user_id,report_id,voted,created_at,updated_at) VALUES(?,?,?,?,?)'
                    : 'DELETE FROM report_votes WHERE report_id = ? AND mobile_user_id = ?';
                var data = tagCondition ?  [voteData.mobile_user_id,voteData.report_id,1,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")]
                    : [parseInt(voteData.report_id,"10"),parseInt(voteData.mobile_user_id,"10")];

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
                            console.log(tagCondition ? "Report upvoted" : "Report vote removed");
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