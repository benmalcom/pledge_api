var express = require('express');
var router = express.Router();
var states = require('../controllers/v1/state');
var config = require('config');
var helper = require('../utils/helper');



/* GET users listing. */
router.param('id',states.stateIdParam);
router.get('/states/:id/lgas',states.lgasByState);
router.route('/states/:id').get(states.stateById);
router.route('/states').get(states.allStates);

module.exports = router;