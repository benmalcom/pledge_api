/**
 * Created by Malcom on 7/13/2016.
 */
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var updateController = require('../../controllers/reports/updates.controller');
var checkAuthorization = require('../../utils/check_authorization');

//Get all the reports
router.route('/report-updates')
    .post(checkAuthorization,updateController.saveUpdate);
module.exports = router;