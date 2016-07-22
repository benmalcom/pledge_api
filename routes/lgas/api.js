var express = require('express');
var router = express.Router();
var sanitize = require('../../utils/cleaner');
var lgas = require('../../controllers/lgas/lgas.controller.js');
var config = require('../../config/config');


router.param('id',lgas.lgaIdParam);

router.route('/lgas/:id').get(lgas.lgaById);

//Get reports count from a single lga
router.route('/lgas/:id/reports/count')
    .get(lgas.getLgaReportsCount);


 //Get reports from a single sector
 router.get('/lgas/:id/reports',function(req,res){
   res.redirect(config.baseUrl+'/v1/lgas/'+sanitize(req.params.id)+'/reports/page/1');
 });
 router.get('/lgas/:id/reports/page/:page',lgas.getReportsByLga);

module.exports = router;