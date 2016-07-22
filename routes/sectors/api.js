var express = require('express');
var router = express.Router();
var sectors = require('../../controllers/sectors/sectors.controller');
var sanitize = require('../../utils/cleaner');



/* GET users listing. */
router.param('id',sectors.sectorIdParam);
router.get('/sectors',sectors.all);

router.route('/sectors/:id')
    .get(sectors.sector);



//Get reports count from a single sector
router.route('/sectors/:id/reports/count')
    .get(sectors.getSectorReportsCount);


//Get reports from a single sector
router.route('/sectors/:id/reports')
    .get(function(req,res){
        res.redirect(config.baseUrl+'/v1/sectors/'+sanitize(req.params.id)+'/reports/page/1');
    });
router.get('/sectors/:id/reports/page/:page',sectors.getReportsBySector);


module.exports = router;