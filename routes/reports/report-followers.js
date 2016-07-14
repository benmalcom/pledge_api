/**
 * Created by Malcom on 6/15/2016.
 */
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var followerController = require('../../controllers/reports/followers.controller');
var checkAuthorization = require('../../utils/check_authorization');

//Get all the reports
router.route('/report-followers')
    .post(checkAuthorization,followerController.saveFollower);
module.exports = router;