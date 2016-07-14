var express = require('express');
var router = express.Router();
var locations = require('../../controllers/locations/locations.controller.js');


/* GET users listing. */
router.param('stateId',locations.stateIdParam);
router.param('lgaId',locations.lgaIdParam);

router.route('/states').get(locations.allStates);
router.route('/states/:stateId').get(locations.stateById);
router.route('/states/:stateId/lgas').get(locations.lgasByState);
router.route('/lgas/:lgaId').get(locations.lgaById);


//Get reports count from a single sector
router.route('/states/:id/reports/count')
    .get(locations.getStateReportsCount);


//Get reports from a single sector
router.route('/states/:id/reports')
    .get(function(req,res){
        res.redirect(config.baseUrl+'/v1/states/'+sanitize(req.params.id)+'/reports/page/1');
    });
router.get('/states/:id/reports/page/:page',locations.getReportsByState);

module.exports = router;