var express = require('express');
var router = express.Router();
var sanitize = require('../../utils/cleaner');
var states = require('../../controllers/states/states.controller');
var config = require('../../config/config');


/* GET users listing. */
router.param('id',states.stateIdParam);

router.get('/states/:id/reports/page/:page',states.getReportsByState);

//Get reports count from a single state
router.get('/states/:id/reports/count',states.getStateReportsCount);

router.get('/states/:id/lgas',states.lgasByState);

//Get reports from a single sector
router.get('/states/:id/reports', function (req,res) {
    res.redirect(config.baseUrl+'/v1/states/'+sanitize(req.params.id)+'/reports/page/1');
});


router.route('/states/:id').get(states.stateById);
router.route('/states').get(states.allStates);

module.exports = router;