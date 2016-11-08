/**
 * Created by Malcom on 6/15/2016.
 */
var express = require('express');
var router = express.Router();
var config = require('config');
var voteController = require('../controllers/v1/vote');
var checkAuthorization = require('../middlewares/check_authorization');

//Get all the reports
router.route('/report-votes')
    .post(checkAuthorization,voteController.saveVote);
module.exports = router;