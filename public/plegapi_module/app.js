/**
 * Created by Richard on 10/6/2015.
 */
angular.module('plegApi',['ui.router'])
    .config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider){
        $stateProvider
            .state('docs', {
               url: '/docs',
               templateUrl: '/plegapi_module/views/default-view.html',
                controller : ''
            }).state('docs.users', {
                url: '/users',
                templateUrl: '/plegapi_module/views/users-view.html',
                controller : ''
            }).state('docs.reports', {
                url: '/reports',
                templateUrl: '/plegapi_module/views/reports-view.html',
                controller : ''
            }).state('docs.locations', {
                url: '/locations',
                templateUrl: '/plegapi_module/views/locations-view.html',
                controller : ''
            }).state('docs.sectors', {
                url: '/sectors',
                templateUrl: '/plegapi_module/views/sectors-view.html',
                controller : ''
            });


    }])
    .run(['$state',function($state){
        $state.transitionTo('docs');
    }]);