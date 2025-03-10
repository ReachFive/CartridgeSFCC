'use strict';

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

module.exports = {
    mergeObjects: mergeObjects,
    addReachFiveProfileError: addReachFiveProfileError
};
