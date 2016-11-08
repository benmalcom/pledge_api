var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');
var methodOverride = require('method-override');
var http = require('http');
var cors = require('cors');
var sanitizer = require('sanitize-html'),
    _ = require('underscore');
var config = require('config');
var formatResponse = require('./api/utils/format-response');
var checkAuhtorization = require('./api/middlewares/check_authorization');
var sanitize = require('./api/middlewares/sanitize');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs');
app.set('port', process.env.PORT || config.get('app.port'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('X-HTTP-Method-Override'));
/*
app.use(cors({
    "origin":"",
    "credentials" : true,
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false
}));
*/

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://php-socket.herokuapp.com");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

app.use(compression());
app.use(sanitize);
app.use(checkAuhtorization);
////////////////////Require all route files here
app.get('/',function (req,res,next) {
    res.send("Pledge API!");
});
require('./api/routes/index')(app);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log("err ",JSON.stringify(err));
        var meta = {};
        meta.status_code = err.code || 500;
        meta.error =  {code: meta.status_code, message: err.message || "Error in server interaction"};
        if(err.messages)
            meta.error.messages = err.messages;
        return res.status(meta.status_code).json(formatResponse.do(meta));
    });
}

// production error handler
// no stack traces leaked to user
app.use(function(err, req, res, next) {
    var meta = {};
    meta.status_code = err.code || 500;
    meta.error = {code: meta.status_code, message: err.message || "Error in server interaction"};
    if(err.messages)
        meta.error.messages = err.messages;
    return res.status(meta.status_code).json(formatResponse.do(meta));
});

var server = http.createServer(app);
server.listen(app.get('port'),function(){
    console.log('Environment ',app.get('env') === 'development' ? 'Development' : 'Production');
    console.log('Url: '+config.get('app.baseUrl'));
});
module.exports = app;