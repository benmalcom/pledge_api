/**
 * Created by Richard on 10/8/2015.
 */
var pool = require('../server/connection');
var sanitize = require('./cleaner');
var outputFormat = require('./output-format');

module.exports = function(req,res,next){
    console.log('Request Method ',req.method);
    if(req.body)
    {
       if((req.method.toLowerCase()=="post") || (req.method.toLowerCase()=="put"))
       {
          if(req.body.api_id && req.body.api_key)
          {
              var api_id = sanitize(req.body.api_id),
                  api_key = sanitize(req.body.api_key);
              pool.getConnection(function(err,connection){
                  if (err) {
                      res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                      return next(err);
                  }
                  console.log('connected to database as id to check authorization ' + connection.threadId);
                  var query = 'SELECT * FROM api_keys WHERE api_id=? AND api_key=?',
                      data = [api_id,api_key];
                  connection.query(query,data,function(err,rows){
                      connection.release();
                      if(err)
                          res.status(503).json({"Error" : err.stack});
                      else if(rows[0] && ((rows[0].api_id) && (rows[0].api_key))) {
                          next();
                      }
                      else{
                          res.status(401).json(outputFormat.generalOutputFormat(401,"You are not authorized to perform this operation!"));
                      }

                  });

              });

          }
           else
          {
              res.status(401).json(outputFormat.generalOutputFormat(401,"You are not authorized to perform this operation!"));
          }
       }
        else
       {
           return next();
       }
    }
    else{
        res.status(200).json(outputFormat.generalOutputFormat(200,"Empty form body!"));
    }
};