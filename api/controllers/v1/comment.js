/**
 * Created by Malcom on 6/14/2016.
 */
var ValidatorJs = require('validatorjs');
var dateFormat = require('dateformat');
var config = require('config');
var helper = require('../../utils/helper');
var formatResponse = require('../../utils/format-response');
var pool = require('../../others/db/mysql_connection');

exports.saveComment = function (req,res,next) {
    var obj = req.body,
        error = {},
        meta = {code:200,success:true};
    var rules = {mobile_user_id: 'required',comment_body: 'required', report_id : 'required'};
    var validation = new ValidatorJs(obj,rules);

    if(validation.passes())
    {
        var data = [obj.comment_body,obj.mobile_user_id,obj.report_id,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")],
            query = 'INSERT INTO report_comments(comment_body,mobile_user_id,report_id,created_at,updated_at) VALUES(?,?,?,?,?)';
        pool.getConnection().then(function(connection){
            connection.query(query,data)
                .then(function(result){
                    if(result.affectedRows)
                        meta.message = "You posted a comment!";
                    res.status(meta.code).json(formatResponse.do(meta));
                },function(err){
                    console.log("err ",err);
                    error =  helper.transformToError({code:503,message:"Error in server interaction, please try again",extra:err});
                    return next(error);
                })
                .finally(function() {
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