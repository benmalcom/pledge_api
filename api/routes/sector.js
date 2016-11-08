var express = require('express');
var router = express.Router();
var sectors = require('../controllers/v1/sector');
var config = require('config');




/* GET users listing. */
router.param('id',sectors.sectorIdParam);
router.get('/sectors',sectors.all);

router.route('/sectors/:id')
    .get(sectors.sector);

module.exports = router;