/**
 * Created by Richard on 10/7/2015.
 */
var _ = require('underscore');
//Issue: Heroku not finding validator module
/*var validator = require('validator');
module.exports = function(input){
    var result = validator.escape(validator.trim(input));
    return result;
};*/
module.exports =
    function escape(str) {
      return   str  ?   str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;').replace(/\`/g, '&#96;') : null;
    };