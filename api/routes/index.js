/**
 * Created by Malcom on 6/14/2016.
 */
var helper = require('../utils/helper');
var config = require('config');
var prefixVersion = "/v"+config.get('api.versions').pop();

module.exports = function (app) {
    app.use(prefixVersion,require('./user'));
    app.use(prefixVersion,require('./state'));
    app.use(prefixVersion,require('./report'));
    app.use(prefixVersion,require('./sector'));
    app.use(prefixVersion,require('./comment'));
    app.use(prefixVersion,require('./follower'));
    app.use(prefixVersion,require('./update'));
    app.use(prefixVersion,require('./vote'));

//Catch all route
    app.get('*', function(req, res, next) {
        var errorObj = helper.transformToError({code:404,message:"We can't seem to find what you're looking for"});
        return next(errorObj);
    });
};
