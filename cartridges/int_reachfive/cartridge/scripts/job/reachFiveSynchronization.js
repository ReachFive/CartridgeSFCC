'use strict';

/**
 * API
 */
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var Status = require('dw/system/Status');
var CustomerMgr = require('dw/customer/CustomerMgr');

/**
 * Script Modules
 */
var reachFiveHelper = require('int_reachfive/cartridge/scripts/helpers/reachFiveHelper');
var reachFivApiHelper = require('int_reachfive/cartridge/scripts/helpers/reachFiveApiHelper');
var libReachFiveSynchronization = require('int_reachfive/cartridge/scripts/job/libReachFiveSynchronization');
var reachFiveServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/reachFiveInterface');

/**
 * Globals
 */
var profilesIterator = null;
var managementTokenObj = null;
var profileFieldsObj = null;

/**
 * @function
 * @description Gets not exported profiles list
 * @returns {dw.system.Status} The step status
 */
module.exports.beforeStep = function () {
    try {
        var profileFields = reachFiveHelper.getReachFiveProfileFieldsJSON();
        if (!profileFields) {
            LOGGER.error('Error - "reach5ProfileFieldsJSON" Site Preference is missing');
            return new Status(Status.ERROR);
        }
        profileFieldsObj = JSON.parse(profileFields);

        profilesIterator = CustomerMgr.searchProfiles(
            'custom.reachfiveSendVerificationEmail = TRUE OR custom.reachfiveUpdateEmailAddress = TRUE OR custom.reachfiveUpdateProfile = TRUE',
            'creationDate ASC');

        if (profilesIterator.hasNext()) {
            managementTokenObj = reachFiveServiceInterface.generateTokenForManagementAPI();
            if (!managementTokenObj.ok) {
                LOGGER.error('Error during ReachFive Management token call: {0}', managementTokenObj.errorMessage);
                return new Status(Status.ERROR);
            }
        }

        return new Status(Status.OK);
    } catch (e) {
        LOGGER.error(
            '[{0}] - [{1}] - {2} - at line: {3}',
            e.fileName,
            e.name,
            e.message,
            e.lineNumber
        );
    }
    return new Status(Status.ERROR);
};

/**
 * @function
 * @description Set the counter for chunk-oriented job
 * @returns {number} The total count of profiles
 */
module.exports.getTotalCount = function () {
    return profilesIterator && profilesIterator.getCount();
};

/**
 * Read one profile if still an profile to read
 * @returns {?dw.customer.Profile} The read profile
 */
module.exports.read = function () {
    if (profilesIterator && profilesIterator.hasNext()) {
        return profilesIterator.next();
    }
    return null;
};

/**
 * @function
 * @description Send appropriate ReachFive API calls for Profiles synchronization
 * @param {dw.customer.Profile} profile - The current profile
 * @returns {dw.system.Status} The step status
 */
module.exports.process = function (profile) {
    try {
        var reachFiveExternalID = reachFivApiHelper.getReachFiveExternalID(profile);
        var managementToken = managementTokenObj.token;

        libReachFiveSynchronization.cleanUpProfileErrorAttr(profile);

        if (profile.custom.reachfiveSendVerificationEmail) {
            libReachFiveSynchronization.sendVerificationEmail(profile, managementToken, reachFiveExternalID);
        }

        if (profile.custom.reachfiveUpdateEmailAddress) {
            libReachFiveSynchronization.updateEmailAddress(profile, managementToken, reachFiveExternalID);
        }

        if (profile.custom.reachfiveUpdateProfile) {
            libReachFiveSynchronization.updateProfile(profileFieldsObj, profile, managementToken, reachFiveExternalID);
        }

        return new Status(Status.OK);
    } catch (e) {
        LOGGER.error(
            '[{0}] - [{1}] - {2} - at line: {3} for Profile No.: {4}',
            e.fileName,
            e.name,
            e.message,
            e.lineNumber,
            profile.customerNo
        );
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
    if (profilesIterator) {
        profilesIterator.close();
    }
};
