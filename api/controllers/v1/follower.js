/**
 * Created by Malcom on 6/14/2016.
 */

var ValidatorJs = require('validatorjs');
var dateFormat = require('dateformat');
var config = require('config');var helper = require('../../utils/helper');
var formatResponse = require('../../utils/format-response');
var mysqlConnection = require('../../others/db/mysql_connection');

exports.saveFollower = function (req,res,next) {
    var obj = req.body,
        error = {},
        meta = {code:200,success:true};
    var rules = { mobile_user_id: 'required', tag: 'required', report_id : 'required'};
    var validation = new ValidatorJs(obj,rules);

    if(validation.passes())
    {
        var tagCondition = obj.tag.toLowerCase() == "follow";
        var query = tagCondition ? 'INSERT INTO report_followers(mobile_user_id,report_id,followed,created_at,updated_at) VALUES(?,?,?,?,?)'
            : 'DELETE FROM report_followers WHERE report_id = ? AND mobile_user_id = ?';
        var data = tagCondition ?  [obj.mobile_user_id,obj.report_id,1,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")]
            : [parseInt(obj.report_id,"10"),parseInt(obj.mobile_user_id,"10")];
        mysqlConnection.get().then(function(connection){
            connection.query(query,data)
                .then(function(result){
                    meta.message = tagCondition ? "Following" : "Unfollowed";
                    res.status(meta.code).json(formatResponse.do(meta));
                },function(err){
                    console.log("err ",err);
                    error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                    return next(error);
                })
                .finally(function() {
                    if (connection){
                        connection.connection.release();
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