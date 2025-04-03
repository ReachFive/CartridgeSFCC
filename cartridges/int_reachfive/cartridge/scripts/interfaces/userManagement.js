'use strict';

var configureService = require('./serviceConfig').configureService;
var generateTokenForManagementAPI = require('./tokenManagement').generateTokenForManagementAPI;

var reachFiveHelper = require('~/cartridge/scripts/helpers/reachFiveHelper');
var reachfiveSettings = require('~/cartridge/models/reachfiveSettings');
var { mergeObjects } = require('~/cartridge/scripts/helpers/utils');

/**
 * Sends a verification email.
 * @param {string} managementToken - The management token.
 * @param {string} reachFiveExternalID - The ReachFive external ID.
 * @returns {Object} The result of the service call.
 */
function sendVerificationEmail(managementToken, reachFiveExternalID) {
    var service = configureService('reachfive.verifyemail.post', {
        user_id: reachFiveExternalID
    });
    service.addHeader('Authorization', 'Bearer ' + managementToken);

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        errorMessage: !serviceResult.ok
            ? serviceResult.error + ' ' + serviceResult.errorMessage
            : ''
    };
}

/**
 * Sends a verification phone message.
 * @param {string} managementToken - The management token.
 * @param {string} reachFiveExternalID - The ReachFive external ID.
 * @returns {Object} The result of the service call.
 */
function sendVerificationPhone(managementToken, reachFiveExternalID) {
    var service = configureService('reachfive.verifyphone.post', {
        user_id: reachFiveExternalID
    });
    service.addHeader('Authorization', 'Bearer ' + managementToken);

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        errorMessage: !serviceResult.ok
            ? serviceResult.error + ' ' + serviceResult.errorMessage
            : ''
    };
}

/**
 * Signs up a new user.
 * @param {string} login - The user's login.
 * @param {string} password - The user's password.
 * @param {Object} profile - The user's profile.
 * @returns {Object} The result of the service call.
 */
function signUp(login, password, profile) {
    var requestParams = {
        client_id: reachfiveSettings.reach5ApiKey,
        scope: 'openid profile email phone',
        data: {
            given_name: profile.firstName,
            family_name: profile.lastName,
            email: login,
            password: password,
            consents: {
                newsletter: {
                    granted: false,
                    consent_type: 'opt-in'
                }
            }
        }
    };

    if (profile && profile.phoneHome) {
        requestParams.data.phone_number = profile.phoneHome;
    }

    var service = configureService('reachfive.signup.post');
    service.setRequestMethod('POST');

    var serviceResult = service.call(requestParams);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: !serviceResult.ok ? serviceResult.errorMessage : ''
    };
}

/**
 * Updates the user's password.
 * @param {string} email - The user's email.
 * @param {string} newPassword - The new password.
 * @param {string} oldPassword - The old password.
 * @param {string} [clientId] - The client ID.
 * @returns {Object} The result of the service call.
 */
function updatePassword(email, newPassword, oldPassword, clientId) {
    var requestParams = {
        client_id: clientId || reachfiveSettings.getReachFiveApiKey(),
        email: email,
        password: newPassword,
        old_password: oldPassword
    };

    var service = configureService('reachfive.updatepassword.post');
    service.setRequestMethod('POST');
    service.addHeader(
        'Authorization',
        'Bearer ' + session.privacy.access_token
    );

    var serviceResult = service.call(requestParams);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: !serviceResult.ok ? serviceResult.errorMessage : ''
    };
}

/**
 * Logs in a user with a password.
 * @param {Object} requestFields - The request fields.
 * @returns {Object} The result of the service call.
 */
function passwordLogin(requestFields) {
    var baseFields = {
        client_id: reachfiveSettings.reach5ApiKey
    };

    var requestObj = mergeObjects(baseFields, requestFields);

    var service = configureService('reachfive.passwordlogin.post');
    service.setRequestMethod('POST');

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: !serviceResult.ok ? serviceResult.errorMessage : ''
    };
}

/**
 * Deletes a user.
 * @param {Object} customer - The customer object.
 * @returns {Object|null} The result of the service call or null if clientId is not found.
 */
function deleteUser(customer) {
    var managementToken = generateTokenForManagementAPI();

    var clientId = reachFiveHelper.getReachFiveExternalID(
        customer.profile
    );
    if (clientId) {
        var service = configureService('reachfive.deleteuser', {
            user_id: clientId
        });
        service.setRequestMethod('DELETE');
        service.addHeader('Authorization', 'Bearer ' + managementToken.token);

        var serviceResult = service.call();
        return {
            ok: serviceResult.ok,
            errorMessage: !serviceResult.ok ? serviceResult.errorMessage : null
        };
    }
    return null;
}

/**
 * Gets user fields.
 * @param {string} clientId - The client ID.
 * @returns {Object} The result of the service call.
 */
function getUserFields(clientId) {
    var managementTokenObj = generateTokenForManagementAPI();
    if (!clientId || !managementTokenObj.ok) {
        return {
            ok: false,
            errorMessage: 'Missing userId or failed to obtain management token'
        };
    }

    var managementToken = managementTokenObj.token;
    var service = configureService('reachfive.getuser', { user_id: clientId });
    service.setRequestMethod('GET');
    service.addHeader('Authorization', 'Bearer ' + managementToken);
    service.addHeader('Content-type', 'application/json');

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: !serviceResult.ok ? serviceResult.errorMessage : ''
    };
}

module.exports = {
    sendVerificationEmail: sendVerificationEmail,
    sendVerificationPhone: sendVerificationPhone,
    signUp: signUp,
    updatePassword: updatePassword,
    passwordLogin: passwordLogin,
    deleteUser: deleteUser,
    getUserFields: getUserFields
};
