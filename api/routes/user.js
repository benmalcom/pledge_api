var express = require('express');
var router = express.Router();
var usersController = require('../controllers/v1/user');
var checkAuthorization = require('../middlewares/check_authorization');
var config = require('config');

/* GET users listing. */
            router.param('id',usersController.userIdParam);
            router.param('mobileNo',usersController.mobileParam);
            router.param('email',usersController.emailParam);

            router.route('/users')
            .get(usersController.all)
            .post(checkAuthorization,usersController.saveUser);

            router.route('/users/:id')
            .get(usersController.getUser)
            .put(usersController.updateUser);
             router.get('/users/verify/mobile/:mobileNo',usersController.getUser);

             router.get('/users/:id/reports',usersController.getUserReportsById);
module.exports = router;