var express = require('express');
var router = express.Router();
var usersController = require('../../controllers/users/users.controller');
var checkAuthorization = require('../../utils/check_authorization');
var config = require('../../config/config');
var sanitize = require('../../utils/cleaner');

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

             router.get('/users/verify/mobile/:mobileNo',usersController.getUserByMobile);

             router.get('/users/:id/reports',function(req,res){
                 res.redirect(config.apiPrefix+'/users/'+sanitize(req.params.id)+'/reports/page/1');
             });
             router.get('/users/:id/reports/page/:page',usersController.getUserReportsById);
             router.get('/users/:id/reports/count',usersController.getUserReportsCountById);

module.exports = router;