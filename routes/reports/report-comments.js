/**
 * Created by Malcom on 6/14/2016.
 */
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var commentsController = require('../../controllers/reports/comments.controller');
var checkAuthorization = require('../../utils/check_authorization');

//Get all the reports
router.route('/report-comments')
    .post(checkAuthorization,commentsController.saveComment);
module.exports = router;