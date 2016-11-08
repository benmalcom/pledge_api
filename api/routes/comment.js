/**
 * Created by Malcom on 6/14/2016.
 */
var express = require('express');
var router = express.Router();
var config = require('config');
var commentsController = require('../controllers/v1/comment');
var checkAuthorization = require('../middlewares/check_authorization');

//Get all the reports
router.route('/report-comments')
    .post(checkAuthorization,commentsController.saveComment);
module.exports = router;