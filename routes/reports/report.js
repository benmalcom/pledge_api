var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var reportsController = require('../../controllers/reports/reports.controller');
var checkAuthorization = require('../../utils/check_authorization');


 /*report id param*/
router.param('id',reportsController.reportIdParam);


//Get all the reports
router.route('/reports')
    .get(function(req,res){
        var redirectUrl = req.query.loggedInUserId ? config.apiPrefix+'/reports/page/1?loggedInUserId='+req.query.loggedInUserId : config.apiPrefix+'/reports/page/1';
        res.redirect(redirectUrl);
   })
    .post(checkAuthorization,reportsController.saveReport);
router.get('/reports/page/:page',reportsController.all);


//Get reports count
router.get('/count/reports',reportsController.getTotalReportsCount);
//modify report properties e.g spam, archive

router.post('/reports/modify',reportsController.modifyReport);



//reports and comments
router.route('/reports/:id/comments')
    .get(reportsController.getReportAndCommentById);
//reports and comments
router.route('/reports/:id/followers')
    .get(reportsController.getReportAndFollowersById);


//Get a single report
router.route('/reports/:id')
    .get(reportsController.getReportById);


module.exports = router;