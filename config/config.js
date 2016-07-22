/**
 * Created by Richard on 10/2/2015.
 */
var env = process.env.NODE_ENV;
module.exports = {
    dbHost : "45.40.137.227",
    dbName : "rcecilee_pleg",
    dbUsername : "rcecilee_pleg",
    dbPass : "rcecilee_pleg",
    apiPrefix : "/v1",
    baseUrl : env == 'development' ?  "http://localhost:3000" : "http://api.rcecilee.com",
    reportItemsPerPage : 10
};
/*
module.exports = {
 dbHost : "127.0.0.1",
 dbName : "pleg",
 dbUsername : "root",
 dbPass : "",
 apiPrefix : "/v1",
 baseUrl : env == 'development' ?  "http://localhost:3000" : "http://api.rcecilee.com",
 reportItemsPerPage : 10
 };*/






