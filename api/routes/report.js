var express = require('express');
var router = express.Router();
var config = require('config');
var reportsController = require('../controllers/v1/report');
var checkAuthorization = require('../middlewares/check_authorization');


 /*report id param*/
router.param('id',reportsController.reportIdParam);


//Get all the reports
router.route('/reports')
    .get(reportsController.all)
    .post(reportsController.saveReport);

//modify report properties e.g spam, archive
router.post('/reports/modify',reportsController.modifyReport);

//reports and comments
router.get('/reports/:id/comments',reportsController.getReportAndCommentById);
//reports and followers
router.get('/reports/:id/followers',reportsController.getReportAndFollowersById);

//reports and updates
router.get('/reports/:id/updates',reportsController.getReportAndUpdatesById);



//Get a single report
router.get('/reports/:id',reportsController.getReportById);


module.exports = router;