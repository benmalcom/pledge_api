/**
 * Created by Richard on 10/14/2015.
 */
var _ = require('underscore'),
   needle = require('needle'),
   config = require('../config/config');

module.exports = {
    dataResponse : function(objectsArray,pageInfo){
        var response = {};
        if(pageInfo && pageInfo.success)
        {
            response.success = pageInfo.success;
        }
        if(pageInfo && pageInfo.message)
        {
            response.message = pageInfo.message;
        }
        response.status_code = pageInfo.statusCode;
        response.developer_error_message = statusCodeToMessage(pageInfo.statusCode);
        response.user_error_message = pageInfo.mssg ? pageInfo.mssg : "";
        response.total_count = pageInfo.totalCount;
        if(pageInfo && pageInfo.previous_page)
        {
            response.previous_page = pageInfo.previous_page;
        }
        if(pageInfo && pageInfo.current_page)
        {
            response.current_page = pageInfo.current_page;
        }

        if(pageInfo && pageInfo.next_page)
        {
            response.next_page = pageInfo.next_page;
        }

        var dataName = pageInfo.dataName ? pageInfo.dataName : "data";
        if(dataName.toLowerCase()=="reports")
        {
            response[dataName] = [];
            if(objectsArray.length > 0) {
                for(var i in objectsArray) {
                    if(objectsArray.hasOwnProperty(i))
                    {

                        var currentObject = objectsArray[i],
                            report = {};
                        report.user = {};
                        report.report_id = currentObject.report_id;
                        report.title = currentObject.title;
                        report.address = currentObject.address;
                        report.country = currentObject.country;
                        report.description = currentObject.description;
                        report.followed = currentObject.followed;
                        report.followers = currentObject.followers;
                        report.gps_state = currentObject.gps_state;
                        report.lga_city = currentObject.lga_city;
                        report.mobile_user_id = currentObject.mobile_user_id;
                        report.report_state = currentObject.report_state;
                        report.sector = currentObject.sector;
                        report.voted = currentObject.voted;
                        report.votes = currentObject.votes;
                        report.comments = currentObject.comments;
                        if(currentObject.images != null)
                        {
                            report.images = formatImages(currentObject.images);
                        }
                        report.user.first_name = currentObject.first_name;
                        report.user.last_name = currentObject.last_name;
                        report.user.avatar = currentObject.avatar;
                        response[dataName].push(report);
                    }
                }

            }
        }
        else if(dataName.toLowerCase()=="comments")
        {
            response[dataName] = [];
            if(objectsArray.length > 0) {
                for(var i in objectsArray) {
                    if(objectsArray.hasOwnProperty(i))
                    {

                        var currentObject = objectsArray[i],
                            comment = {};

                        comment.report_comment_id = currentObject.report_comment_id;
                        comment.report_id = currentObject.report_id;
                        comment.comment_body = currentObject.comment_body;
                        comment.created_at = currentObject.created_at;
                        comment.updated_at = currentObject.updated_at;
                        comment.mobile_user_id = currentObject.mobile_user_id;

                        comment.user = {};
                        comment.user.first_name = currentObject.first_name;
                        comment.user.last_name = currentObject.last_name;
                        comment.user.avatar = currentObject.avatar;
                        response[dataName].push(comment);
                    }
                }

            }
        }
        else
        {
            response[dataName] = objectsArray;
        }

        return response;
    },



    userOutputFormat : function(users,totalCount,statusCode,mssg)
    {
        var response = {};
        response.status_code = statusCode;
        response.developer_error_message = statusCodeToMessage(statusCode);
        response.user_error_message = mssg;
        response.total_count = totalCount;
        response.users = [];
        if(users.length > 0)
        {
            response.users = users;
        }
        return response;
    },

    generalOutputFormat : function(statusCode,mssg,data,totalCount)
    {
        var response = {};
        response.status_code = statusCode;
        response.developer_error_message = statusCodeToMessage(statusCode);
        response.user_error_message = mssg;

        if(data)
        {
            response.data = data;
        }
        if(totalCount)
        {
            response.total_count = totalCount;
        }
        return response;
    },

    generalResponse : function(pageInfo)
    {
        var response = {};
        if(pageInfo.statusCode)
        {
            response.status_code = pageInfo.statusCode;
            response.developer_message = statusCodeToMessage(pageInfo.statusCode);
        }
        response.user_message = pageInfo.mssg;
        if(pageInfo.extra)
        {
            response.extra = pageInfo.extra;
        }
        if(pageInfo.success)
        {
            response.success = pageInfo.success;
        }
        return response;
    }


};

///////////////A function to format the image being sent to user
var formatImages = function (string) {
    var result = [];
  if(string.length > 0 && string.indexOf("|") ==-1)
  {
      result.push(unescape(string.trim()));
  }
   else if(string.length > 0 && string.indexOf("|") != -1)
  {
      result = string.split("|");
      result = result.map(function (image) {
          return unescape(image.trim());
      });
  }

    return result;
};
var statusCodeToMessage = function (statusCode) {
    var errorMssg = "";
    switch(statusCode)
    {
        case 200:
            errorMssg = "";
            break;
        case 404:
            errorMssg = "Resource not found";
            break;
        case 503:
            errorMssg = "Error from server interaction";
            break;
        case 400:
            errorMssg = "Bad request";
            break;
        case 401:
            errorMssg = "You are not authorized to perform this operation";
            break;
    }

    return errorMssg;
};

var unescape =  function (str) {
    return str ? str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '\/').replace(/&#96;/g, '\`') : null;
};