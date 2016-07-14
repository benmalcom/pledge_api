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
var config = require('./config/config');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs');
app.set('port', process.env.PORT || 3000);

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
app.use(function(req, res, next) {
  if (req.body) {
    _.each(req.body, function(value, key) {
      if(!parseInt(value,10) && value !== null) {
        if(typeof value === 'string') {
          value = value.replace(/&gt;/gi, '>');
          value = value.replace(/&lt;/gi, '<');
          value = value.replace(/(&copy;|&quot;|&amp;)/gi, '');
        }
        req.body[key] = sanitizer(value, {
          allowedTags: []
        });
      }
    });
  }
  return next();
});
////////////////////Require all route files here
require('./routes/list')(app);

/*var io = require('socket.io').listen(server);

io.on('connection',function(socket){ ///that socket object inside d closure function is the one connected to ur system fom another system.
    console.log('user connected!');
    io.sockets.emit("new user",socket.id);
    //everything about the socket object will happen here
});
require('./routes/post_routes/post_routes')(app,io);*/



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
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stack traces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = http.createServer(app);
server.listen(app.get('port'),function(){
    console.log('Environment ',app.get('env') === 'development' ? 'Development' : 'Production');
    console.log('Url: '+config.baseUrl);
});
module.exports = app;