/**
 * Created by Malcom on 4/27/2016.
 */
var _ = require('underscore');
//Issue: Heroku not finding validator module
var validator = require('validator');

module.exports.unescapeAvatar = function (users) {
  var result = users.map(function (user) {
      console.log('before ',user.avatar);
      user.avatar = validator.unescape(user.avatar+"");
      console.log('after ',user.avatar);
      return user;
  });

    return result;
};

module.exports.convertToInt = function (value) {
    var result = parseInt(value,"10");
    console.log('new val ',value);
    return typeof result == "number" ? result : '';
};


/*
module.exports.unescapeAvatar = function (users) {
    return users.map(function (user) {
        user.avatar = unescape(user.avatar+"");
        return user;
    });

};
*/

/*module.exports.toDate = function toDate(date) {
    date = Date.parse(date);
    return !isNaN(date) ? new Date(date) : null;
};*/
/*var unescape =  function (str) {
    return str ? str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '\/').replace(/&#96;/g, '\`') : null;
};*/
