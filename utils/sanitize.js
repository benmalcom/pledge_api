/**
 * Created by Malcom on 3/8/2016.
 */
var sanitizer = require('sanitize-html'),
    _ = require('underscore');
module.exports = function(req, res, next) {
    if (req.body) {
        _.each(req.body, function(value, key) {
            if(!parseInt(value,10) && value !== null) {
                if(typeof value === 'string') {
                    value = value.replace(/&gt;/gi, '>');
                    value = value.replace(/&lt;/gi, '<');
                    value = value.replace(/(&copy;|&quot;|&amp;)/gi, '');
                }
                req.body[key] = sanitizer(value, {
                    allowedTags: []
                });
            }
        });
    }
    return next();
};