'use strict';

/**
 * API
 */
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var Status = require('dw/system/Status');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Calendar = require('dw/util/Calendar');

/**
 * Script Modules
 */
var reachFiveHelper = require('int_reachfive/cartridge/scripts/helpers/reachFiveHelper');
var reachFiveSynchHelper = require('int_reachfive/cartridge/scripts/helpers/reachFiveSynchronization');
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
        profileFieldsObj = reachFiveHelper.getReachFiveProfileFieldsJSON();

        var yesterdayCalendar = new Calendar();
        yesterdayCalendar.add(Calendar.DATE, -1);
        var yesterdayDate = yesterdayCalendar.time;

        var dateString = [
            yesterdayDate.getFullYear(),
            ('0' + (yesterdayDate.getMonth() + 1)).slice(-2),
            ('0' + yesterdayDate.getDate()).slice(-2)
        ].join('-');

        var query = 'lastModified >= {0}';
        var sortString = 'lastModified asc';

        profilesIterator = CustomerMgr.searchProfiles(
            query,
            sortString,
            dateString
        );

        if (profilesIterator.hasNext()) {
            managementTokenObj = reachFiveServiceInterface.generateTokenForManagementAPI();
            if (!managementTokenObj.ok) {
                LOGGER.error(
                    'Error during ReachFive Management token call: {0}',
                    managementTokenObj.errorMessage
                );
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
        var reachFiveExternalID = reachFiveHelper.getReachFiveExternalID(profile);
        if (!reachFiveExternalID) {
            LOGGER.warn('External ID not find for this profil.');
            return new Status(Status.ERROR);
        }

        var managementToken = managementTokenObj.token;

        reachFiveSynchHelper.cleanUpProfileErrorAttr(profile);

        if (profile.custom.reachfiveSendVerificationEmail) {
            reachFiveSynchHelper.sendVerificationEmail(
                profile,
                managementToken,
                reachFiveExternalID
            );
        }
        if (profile.custom.reachfiveSendVerificationPhone) {
            reachFiveSynchHelper.sendVerificationPhone(
                profile,
                managementToken,
                reachFiveExternalID
            );
        }
        var userDataResult = reachFiveServiceInterface.getUserFields(reachFiveExternalID);
        if (!userDataResult.ok || !userDataResult.object) {
            LOGGER.error('not possible to get user fields');
            return new Status(Status.ERROR);
        }

        var emailFromAPI = userDataResult.object.email;
        var phoneNumberFromAPI = userDataResult.object.phone_number;
        if (
            phoneNumberFromAPI !== profile.getPhoneMobile()
            || emailFromAPI !== profile.getEmail()
        ) {
            reachFiveSynchHelper.updatePhoneAndEmail(
                profile,
                managementToken,
                reachFiveExternalID
            );
        }
        reachFiveSynchHelper.updateProfile(
            profileFieldsObj,
            profile,
            managementToken,
            reachFiveExternalID
        );

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
module.exports.write = function () {};

/**
 * Closes all system resources associated with this iterator
 */
module.exports.afterStep = function () {
    if (profilesIterator) {
        profilesIterator.close();
    }
};
