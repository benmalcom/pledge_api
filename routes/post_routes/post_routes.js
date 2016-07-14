/**
 * Created by Richard on 10/7/2015.
 */
var ValidatorJs = require('validatorjs');
//var validator = require('validator');
var uuid = require('uuid');
var _ = require('underscore');
var dateFormat = require('dateformat');
var needle = require('needle');

var pool = require('../../server/connection');
var config = require('../../config/config');
var sanitize = require('../../utils/cleaner');
var helper = require('../../utils/helper');

var outputFormat = require('../../utils/output-format');
var checkAuthorization = require('../check_authorization');


module.exports = function(app,io)
{
   app.post(config.apiPrefix+'/users',checkAuthorization,function(req,res){
       if(req.body)
       {
           var userData = {
               firstname: req.body.first_name,
               lastname: req.body.last_name,
               email : req.body.email,
               gender : req.body.gender,
               mobile : req.body.mobile
           };

           var rules = {
               firstname: 'required',
               lastname: 'required',
               email : 'required|email',
               gender: 'required',
               mobile : 'required'
           };
           var validation = new ValidatorJs(userData,rules);
           if(validation.passes())
           {

               var first_name = sanitize(req.body.first_name),
                   last_name = sanitize(req.body.last_name),
                   email = sanitize(req.body.email),
                   mobile = sanitize(req.body.mobile),
                   gender = sanitize(req.body.gender),
                   avatar = req.body.avatar ? sanitize(req.body.avatar) : "",
                   lga_id = req.body.lga_id ? sanitize(req.body.lga_id) : "";


               pool.getConnection(function(err,connection){
                   if (err) {
                       res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                       console.error({"message" : "Error in connecting to database","Error":err.stack});
                       return;
                   }
                   console.log('connected to database as id ' + connection.threadId);
                   var token = uuid.v1(),
                       data = [first_name,last_name,email,mobile,avatar,gender,lga_id,token,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")],
                       query = 'INSERT INTO mobile_users(first_name,last_name,email,mobile,avatar,gender,lga_id,token,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)';

                   connection.query(query,data,function(err,result){
                       connection.release();
                       if(err)
                       {
                           console.error('Error executing query: ' + err.stack);
                           res.json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your data"));

                       }

                       else if(result.insertId)
                       {
                           var lastId = result.insertId;
                           console.log('New User added with id ',lastId);
                           io.emit('new user',lastId);
                           res.redirect('/v1/users/'+lastId);
                       }
                       else
                       {
                           res.status(503).json(outputFormat.generalOutputFormat(503,"Sorry! we can't save your data at this time"));

                       }
                   });

               });


           }
           else{
               res.status(400).json(outputFormat.generalOutputFormat(400,"Some fields were omitted"));
           }

       }
       else{
           res.status(400).json(outputFormat.generalOutputFormat(400,"An empty form was submitted"));
       }
   });
/*Post reports data received to database*/
    app.post(config.apiPrefix+'/reports',checkAuthorization,function(req,res){
        if(req.body)
        {
            var reportData = {
                title: req.body.title,
                sector_id: req.body.sector_id,
                mobile_user_id : req.body.mobile_user_id,
                state_id : req.body.state_id,
                report_time : req.body.report_time
            };

            var rules = {
                title: 'required',
                sector_id: 'required|numeric|min:1',
                mobile_user_id : 'required|numeric|min:1',
                state_id: 'required|numeric|min:1',
                report_time: 'required'
            };
            var validation = new ValidatorJs(reportData,rules);

            if(validation.passes())
            {
              console.log('passed validation!');
                var country = req.body.country ?  sanitize(req.body.country) : "Nigeria",
                    state = req.body.state ?  sanitize(req.body.state) : null,
                    lga_city = req.body.lga_city ?  sanitize(req.body.lga_city) : null,
                    address = req.body.address ?  sanitize(req.body.address) : null;
                console.log('location params ',country,state,lga_city,address);
                pool.getConnection(function(err,connection){
                    if (err) {
                        res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                        console.error({"message" : "Error in connecting to database","Error":err.stack});
                        return;
                    }
                    console.log('connected to database as id ' + connection.threadId);

                    var data = [country,state,lga_city,address],
                        query = 'INSERT INTO locations(country,state,lga_city,address) VALUES(?,?,?,?)';


                    connection.query(query,data,function(err,result){
                        connection.release();
                        console.log('query executed!');
                        if(err)
                        {
                            console.error('Error executing query: ' + err.stack);
                            res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your location data"));

                        }
                        else if(result.insertId)
                        {
                            var locationId = result.insertId;
                            var title = sanitize(req.body.title),
                                sector_id = sanitize(req.body.sector_id),
                                mobile_user_id = sanitize(req.body.mobile_user_id),
                                state_id = sanitize(req.body.state_id),
                                report_time = dateFormat(Date.parse(sanitize(helper.toDate(req.body.report_time))), "yyyy-mm-dd hh:MM:ss"),
                                description = req.body.description ? sanitize(req.body.description) : "",
                                images = req.body.media ? sanitize(req.body.media) : null;
                            console.log('report params ',title,sector_id,mobile_user_id,state_id,report_time,description);

                            pool.getConnection(function(err,connection){
                                if (err) {
                                    res.status(503).json(outputFormat.generalOutputFormat(503,"We could not connect to our database at this time"));
                                    console.error({"message" : "Error in connecting to database","Error":err.stack});
                                    return;
                                }
                                console.log('connected to database as id ' + connection.threadId);

                                var data = [title,description,report_time,images,sector_id,state_id,mobile_user_id,locationId,dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"),dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss")],
                                    query = 'INSERT INTO reports(title,description,report_time,images,sector_id,state_id,mobile_user_id,location_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)';


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
                                        console.log('New Report added with id ',newReportId);
                                        io.sockets.emit('new report',newReportId);
                                        res.redirect(config.baseUrl+'/v1/reports/'+newReportId);

                                    }
                                    else
                                    {
                                        res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your report data"));

                                    }
                                });

                            });

                            console.log('New location added with id ',locationId);
                        }
                        else
                        {
                            res.status(503).json(outputFormat.generalOutputFormat(503,"We encountered an error in saving your location data"));

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
    });

};