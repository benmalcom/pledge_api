/**
 * Created by Malcom on 6/14/2016.
 */
var config = require('../config/config');
var outputFormat = require('../utils/output-format');

module.exports = function (app) {
    var routes = require('./index');
    var users = require('./users/api');
    var states = require('./states/api');
    var lgas = require('./lgas/api');
    var reports = require('./reports/report');
    var sectors = require('./sectors/api');
    var comments = require('./reports/report-comments');
    var followers = require('./reports/report-followers');
    var updates = require('./reports/report-updates');
    var votes = require('./reports/report-votes');


    app.use('/', routes);
    app.use(config.apiPrefix, users);
    app.use(config.apiPrefix, states);
    app.use(config.apiPrefix, lgas);
    app.use(config.apiPrefix, reports);
    app.use(config.apiPrefix, sectors);
    app.use(config.apiPrefix, comments);
    app.use(config.apiPrefix, followers);
    app.use(config.apiPrefix, updates);
    app.use(config.apiPrefix, votes);



//Catch all route
    app.get('*', function(req, res) {
        res.status(404).json(outputFormat.generalOutputFormat(404,"We can't seem to find what you're looking for"));
    });
};
