/**
 * Created by Malcom on 6/15/2016.
 */
var express = require('express');
var router = express.Router();
var config = require('config');
var followerController = require('../controllers/v1/follower');
var checkAuthorization = require('../middlewares/check_authorization');

//Get all the reports
router.route('/report-followers')
    .post(checkAuthorization,followerController.saveFollower);
module.exports = router;