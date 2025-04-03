'use strict';

var configureService = require('./serviceConfig').configureService;
var LOGGER = require('dw/system/Logger').getLogger('reachfive');

/**
 * Updates the email address using the provided request object.
 *
 * @param {Object} requestObj - The request object containing the necessary data to update the email.
 * @returns {Object} An object containing the result of the service call.
 */
function updateEmail(requestObj) {
    var service = configureService('reachfive.updateemail.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

/**
 * Updates the phone number using the provided request object.
 *
 * @param {Object} requestObj - The request object containing the phone update details.
 * @returns {Object} An object containing the result of the service call.
 */
function updatePhone(requestObj) {
    var service = configureService('reachfive.updatephone.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

/**
 * Updates a user profile using the ReachFive service.
 *
 * @param {Object} requestObj - The request object containing the profile data to be updated.
 * @param {string} managementToken - The management token for authorization.
 * @param {string} reachFiveExternalID - The external ID of the user in ReachFive.
 * @returns {Object} An object containing the result of the service call.
 */
function updateProfile(requestObj, managementToken, reachFiveExternalID) {
    var service = configureService('reachfive.updateprofile.put', { user_id: reachFiveExternalID });
    service.setRequestMethod('PUT');
    service.addHeader('Authorization', 'Bearer ' + managementToken);

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

/**
 * Updates the profile identity using the ReachFive API.
 *
 * @param {Object} requestObj - The request object containing the profile data to be updated.
 * @returns {Object} An object containing the result of the service call.
 */
function updateProfileIdentityAPI(requestObj) {
    var service = configureService('reachfive.update.profile.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    var servResObject;

    try {
        servResObject = JSON.parse(serviceResult.errorMessage);
    } catch (error) {
        LOGGER.error('Error while parsing serviceResult.errorMessage: {0}', error.message);
        servResObject = serviceResult.object;
    }

    return {
        ok: serviceResult.ok,
        object: servResObject,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

/**
 * Retrieves the user profile using the specified profile fields.
 *
 * @param {Array<string>} profileFields - The fields to include in the user profile request.
 * @returns {Object} An object containing the result of the service call.
 */
function getUserProfile(profileFields) {
    var service = configureService('reachfive.userinfo.get', { profile_fields: profileFields });
    service.setRequestMethod('GET');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

module.exports = {
    updateEmail: updateEmail,
    updatePhone: updatePhone,
    updateProfile: updateProfile,
    updateProfileIdentityAPI: updateProfileIdentityAPI,
    getUserProfile: getUserProfile
};
