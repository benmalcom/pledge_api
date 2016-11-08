/**
 * Created by Malcom on 7/13/2016.
 */
var express = require('express');
var router = express.Router();
var updateController = require('../controllers/v1/update');
var checkAuthorization = require('../middlewares/check_authorization');

//Get all the reports
router.route('/report-updates')
    .post(checkAuthorization,updateController.saveUpdate);
module.exports = router;