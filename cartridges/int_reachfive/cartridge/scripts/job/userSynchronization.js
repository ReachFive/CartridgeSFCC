'use strict';

/**
 * API
 */
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var Status = require('dw/system/Status');
var CustomerMgr = require('dw/customer/CustomerMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Script Modules
 */
var reachFiveHelper = require('int_reachfive/cartridge/scripts/helpers/reachFiveHelper');
var libReachFiveSynchronization = require('int_reachfive/cartridge/scripts/job/libReachFiveSynchronization');

/**
 * Globals
 */
var reachFiveUserUpdateIterator = null;
var profileFieldsObj = null;

/**
 * @function beforeStep
 * @description This method is used to retrieve the collection of ReachFiveUserUpdate to process.
 * @returns {dw.system.Status} The step status
 */
module.exports.beforeStep = function () {
    // Search the orders for orders that have to been sent to pickpack
    reachFiveUserUpdateIterator = CustomObjectMgr.getAllCustomObjects(reachFiveHelper.getReachFiveUserCustomObjectType());

    var profileFields = reachFiveHelper.getReachFiveProfileFieldsJSON();
    if (!profileFields) {
        LOGGER.error('Error - "reach5ProfileFieldsJSON" Site Preference is missing');
        return new Status(Status.ERROR);
    }
    profileFieldsObj = JSON.parse(profileFields);

    return new Status(Status.OK);
};

/**
 * @function getTotalCount
 * @description This method is used to calculate the total count of ReachFiveUserUpdate to process per job-run.
 *
 * @returns {number} Returns the total number of ReachFiveUserUpdate to process for the current job-run.
 */
module.exports.getTotalCount = function () {
    // Return the total number of users found
    return reachFiveUserUpdateIterator.getCount();
};

/**
 * @function read
 * @description This method is used to next reachFiveUserUpdateIterator to process per job-run.
 *
 * @returns {Object} Returns the next reachFiveUserUpdateIterator to process for the current job-run.
 */
module.exports.read = function () {
    if (reachFiveUserUpdateIterator.hasNext()) {
        return reachFiveUserUpdateIterator.next();
    }
    return null;
};

/**
 * @function
 * @description Send appropriate ReachFive API calls for Profiles synchronization
 * @param {dw.customer.Profile} reachFiveUserUpdateCO - The current reachFiveUserUpdate Custom Object
 * @returns {dw.system.Status} The step status
 */
module.exports.process = function (reachFiveUserUpdateCO) {
    try {
        var reachFiveUser = JSON.parse(reachFiveUserUpdateCO.custom.user);
        var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
        var currentCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(reachFiveProviderId, reachFiveUser.id);

        if (!empty(currentCustomerProfile)) {
            libReachFiveSynchronization.updateSFCCProfile(profileFieldsObj, currentCustomerProfile, reachFiveUser, 'user');

            Transaction.wrap(function () {
                CustomObjectMgr.remove(reachFiveUserUpdateCO);
            });
        } else {
            LOGGER.error('Customer profile does not exist: ' + reachFiveUser);
        }

        return new Status(Status.OK);
    } catch (e) {
        LOGGER.error(e);
    }
    return new Status(Status.ERROR);
};

/**
 * Does nothing
 */
module.exports.write = function () {

};

/**
 * Closes all system resources associated with this iterator
 */
module.exports.afterStep = function () {
    if (reachFiveUserUpdateIterator) {
        reachFiveUserUpdateIterator.close();
    }
};
