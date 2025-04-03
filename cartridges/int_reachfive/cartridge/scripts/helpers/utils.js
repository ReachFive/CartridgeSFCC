'use strict';

var LOGGER = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');

/**
 * Merges two objects into a new object. Properties from the second object
 * will overwrite properties from the first object if they have the same key.
 *
 * @param {Object} obj1 - The first object to merge.
 * @param {Object} obj2 - The second object to merge.
 * @returns {Object} A new object containing properties from both obj1 and obj2.
 */
function mergeObjects(obj1, obj2) {
    return Object.assign({}, obj1, obj2);
}

/**
 * @function
 * @description Adds API calls errors to the 'reachfiveError' attribute if request is fail
 * @param {string} errorMessage Error message
 * @param {dw.customer.Profile} profile - The current profile
 * @returns {void}
 * */
function addReachFiveProfileError(errorMessage, profile) {
    var LINE_FEED = '\n'; // new line character;

    if (errorMessage && profile) {
        Transaction.wrap(function () {
            profile.custom.reachfiveError = (profile.custom.reachfiveError)
                ? profile.custom.reachfiveError + errorMessage + LINE_FEED + LINE_FEED
                : errorMessage + LINE_FEED + LINE_FEED;
        });
    }
}

/**
 * Analyze state data in request
 * @param {Object} req request object
 * @returns {Object} - parsed state values or defaults
 */
function getStateData(req) {
    var stateData = {
        target: URLUtils.https('Account-Show').toString(),
        handleCustomerRoute: false
    };
    var stateObj = {
        redirectURL: null,
        action: false,
        handleCustomerRoute: false
    };
    if (req.httpParameterMap.isParameterSubmitted('state')) {
        var stateObjStr = StringUtils.decodeBase64(
            req.httpParameterMap.state.value
        );
        try {
            stateObj = JSON.parse(stateObjStr);
        } catch (err) {
            LOGGER.error('Error during state object parsing: {0}', err);
        }

        if (stateObj.redirectURL) {
            stateData.target = stateObj.redirectURL;
        }

        if (typeof stateObj.handleCustomerRoute === 'boolean') {
            stateData.handleCustomerRoute = stateObj.handleCustomerRoute;
        }

        if (stateObj.action) {
            stateData.action = stateObj.action;
        }

        // Get the data param in the state object
        if (stateObj.data) {
            stateData.data = stateObj.data;
        }
    }

    return stateData;
}

module.exports = {
    getStateData: getStateData,
    mergeObjects: mergeObjects,
    addReachFiveProfileError: addReachFiveProfileError
};
