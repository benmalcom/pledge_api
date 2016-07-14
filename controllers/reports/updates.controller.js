/**
 * Created by Malcom on 7/13/2016.
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

exports.saveUpdate = function (req,res) {
    if(req.body)
    {
        var updateData = {
            update_body: req.body.update_body,
            report_id : req.body.report_id,
            mobile_user_id : req.body.mobile_user_id
        };

        var rules = {
            mobile_user_id: 'required',
            update_body: 'required',
            report_id : 'required'
        };
        var validation = new ValidatorJs(updateData,rules);

        if(validation.passes())
        {
            pool.getConnection(function(err,connection){
                if (err) {
                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                    return;
                }

                var query = 'INSERT INTO report_updates(mobile_user_id,report_id,update_body,created_at,updated_at) VALUES(?,?,?,?,?)';
                var data = [updateData.mobile_user_id,updateData.report_id,updateData.update_body,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")];

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
                            console.log("report update posted");
                            res.status(200).json(outputFormat.generalResponse(pageInfo));
                            /*var goToUrl = config.apiPrefix+'/reports/'+updateData.report_id+'/followers?extraParams='+JSON.stringify(pageInfo);
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
