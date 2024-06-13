'use strict';

var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');


/**
 * @description Login with reachfive password interface
 * @param {string} email - reachfive customer login
 * @param {string} password - reachfive customer password
 * @returns {Object} prepared result object
 */
function loginWithPassword(email, password) {
    var requestObj = {
        email: email,
        password: password
    };

    var result = reachFiveService.passwordLogin(requestObj);

    return result;
}

// TODO: obviously that this function should be refactored after splitting Reachfvie helper
/**
 * @description Signup with login and password interface
 * @param {Object} credentialsObj - Object with credentials data
 * @param {string} [credentialsObj.email] - Customer email
 * @param {string} [credentialsObj.phone_number] - Customer phone number
 * @param {string} [credentialsObj.custom_identifier] - Customer custom identifier
 * @param {string} credentialsObj.password - Customer password
 * @param {Object} profile - Customer profile data
 * @returns {Object} Signup result
 */
function signUp(credentialsObj, profile) {
    var login = credentialsObj.email;
    var password = credentialsObj.password;

    var result = reachFiveService.signUp(login, password, profile);

    return result;
}

/**
 * @function
 * @description Compare phones number on digits basis.
 * @param {string|undefined} oldPhone old phone number
 * @param {string|undefined} newPhone new phone number
 * @return {Object} Result of call
 * */
function isNewPhone(oldPhone, newPhone) {
    var result = false;

    /**
     * @function
     * @description Extract digits from string, normally used for phone compare
     * @param {string} value string with digits
     * @return {string} result of function
     * */
    function digitsOnly(value) {
        return String.prototype.replace.call(value, /[^+\d]/g, '');
    }

    // Compare 2 phone numbers
    if (oldPhone && newPhone) {
        result = digitsOnly(oldPhone) !== digitsOnly(newPhone);
    // Phone number does not exist, but we got new one
    } else if (newPhone) {
        result = true;
    }

    return result;
}

/**
 * @function
 * @description Return profile object.
 * @param {string} [profileFields] Comma separated profile user fields
 * @return {Object} Result of call
 * */
function getReachfiveProfileFields(profileFields) {
    // TODO: This object should be taken from site preferences
    // Temporal static answer
    var result = profileFields || 'id,email,emails.verified,given_name,family_name,birthdate,phone_number,gender,addresses,consents';
    return result;
}

/**
 * Request access token with customer password
 * @param {string} login reachfive customer login
 * @param {string} password reachfive customer password
 * @return {Object} Result of call
 */
function getTokenWithPassword(login, password) {
    var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

    var requestObj = {
        grant_type: 'password',
        username: login,
        password: password,
        scope: 'email openid profile test offline_access full_write'
    };

    var result = reachFiveService.oauthToken(requestObj);

    if (result.ok & !empty(result.object)) {
        var reachfiveSession = new ReachfiveSessionModel();
        reachfiveSession.initialize(result.object);
    } else {
        try {
            result.errorObj = JSON.parse(result.errorMessage);
        } catch (error) {
            LOGGER.error('Error during parse getTokenWithPassword error object: {0}', error);
        }
        LOGGER.error('Error during request access token with customer password: {0}', result.errorMessage);
    }

    return result;
}

/**
 * Update Reach Five password for account.
 * @param {string} email customer mail
 * @param {string} newPassword new customer password
 * @param {string} oldPassword old customer password
 * @return {Object} Result of call
 */
function updatePassword(email, newPassword, oldPassword) {
    var clientId = reachFiveHelper.getReachFiveApiKey();
    var result = reachFiveService.updatePassword(email, newPassword, oldPassword, clientId);

    if (!result.ok) {
        try {
            result.errorObj = JSON.parse(result.errorMessage);
        } catch (error) {
            LOGGER.error('Error during parse updatePassword error object: {0}', error);
        }
        LOGGER.error('Error during get ReachFive update password: {0}', result.errorMessage);
    }

    return result;
}

/**
 * @function
 * @description Get Reachfive user profile object.
 * @param {string} [profileFields] Comma separated profile user fields
 * @return {Object} Result of call
 * */
function getUserProfile(profileFields) {
    var fields = profileFields || 'id,consents,has_password,emails';

    var result = reachFiveService.getUserProfile(fields);

    if (!result.ok) {
        LOGGER.error('Error during get ReachFive user Profile: {0}', result.errorMessage);
    }

    return result;
}

/**
 * @function
 * @description Update Reachfive customer phone with token.
 * @param {string} phone new login
 * @return {Object} Result of call
 * */
function updateReachfivePhoneWithTnk(phone) {
    var result = reachFiveService.updatePhone({ phone_number: phone });

    if (!result.ok) {
        LOGGER.error('Error during update ReachFive phone number: {0}', result.errorMessage);

        if (result.errorMessage) {
            try {
                result.errorObj = JSON.parse(result.errorMessage);

                if (result.errorObj && Object.prototype.hasOwnProperty.call(result.errorObj, 'error_details')) {
                    var errorObj = Array.prototype.find.call(result.errorObj.error_details, function (element) {
                        return element.field === 'phone_number';
                    });

                    if (errorObj) {
                        result.errorObj.error_description = errorObj.message;
                    }
                }
            } catch (error) {
                LOGGER.error('Error during parse ReachFive phone number update error: {0}', error);
            }
        }
    }

    return result;
}

/**
 * @function
 * @description Update Reachfive customer login/email with token.
 * @param {string} login new login
 * @return {Object} Result of call
 * */
function updateReachfiveLoginWithTkn(login) {
    var result = reachFiveService.updateEmail({ email: login });

    if (!result.ok) {
        LOGGER.error('Error during update ReachFive login: {0}', result.errorMessage);

        if (result.errorMessage) {
            try {
                result.errorObj = JSON.parse(result.errorMessage);
            } catch (error) {
                LOGGER.error('Error during parse ReachFive login update error: {0}', error);
            }
        }
    }

    return result;
}

/**
 * @function
 * @description Update reach five profile with given customer request object
 * @param {Object} customerObj reachfive profile object
 * @return {Object|null} update service call
 * */
function updateReachFiveProfile(customerObj) {
    var result = null;
    if (customerObj) {
        result = reachFiveService.updateProfileIdentityAPI(customerObj);
        if (!result.ok) {
            LOGGER.error('Error during update ReachFive profile: {0}', result.errorMessage);
        }
    }

    return result;
}

/**
 * @function
 * @description Get ReachFive profile from customer external profiles list if exist.
 * @param {dw.customer.Customer} thatCustomer Customer Profile
 * @return {null|dw.customer.ExternalProfile} ReachFive profile or null
 * */
function getCustomerReachFiveExtProfile(thatCustomer) {
    var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
    var customerReachFiveProfile = null;
    if (thatCustomer && thatCustomer.externalProfiles.length) {
        for (var i = 0, length = thatCustomer.externalProfiles.length; i < length; i++) {
            if (thatCustomer.externalProfiles[i].authenticationProviderID === reachFiveProviderId) {
                customerReachFiveProfile = thatCustomer.externalProfiles[i];
                break;
            }
        }
    }

    return customerReachFiveProfile;
}

/**
 * @function
 * @description Reset customer password with managment API
 * @param {dw.customer.Profile} profile Customer Profile
 * @param {string} newPassword New customer password
 * @return {void}
 * */
 function passwordUpdateManagementAPI(profile, newPassword) {
    if (reachFiveHelper.isReachFiveEnabled()) {

        var managementTokenObj = reachFiveService.generateTokenForManagementAPI();
        if (managementTokenObj.ok) {
            var managementToken = managementTokenObj.token;
            var resetPassRsp;

            var reachFiveCustomerId = getReachFiveExternalID(profile);
            if (reachFiveCustomerId) {
                var reqBody = {
                    password: newPassword
                };
                resetPassRsp = reachFiveService.updateProfile(reqBody, managementToken, reachFiveCustomerId);

                if (!resetPassRsp.ok) {
                    LOGGER.error('Error during ReachFive reset password: {0}', resetPassRsp.errorMessage);
                }
            }
        } else {
            LOGGER.error('Error during ReachFive Management token call: {0}', managementTokenObj.errorMessage);
        }
    }
}

/**
 * @function
 * @description Reset customer password with managment API
 * @param {string} reachFiveUserID Customer Profile
 * @param {string} newPassword New customer password
 * @return {Object|null} update result
 * */
function passwordResetManagementAPI(reachFiveUserID, newPassword) {
    var resetPassRsp = null;

    if (reachFiveHelper.isReachFiveEnabled() && reachFiveUserID) {

        var managementTokenObj = reachFiveService.generateTokenForManagementAPI();
        if (managementTokenObj.ok) {
            var managementToken = managementTokenObj.token;
            var reqBody = {
                password: newPassword
            };
            resetPassRsp = reachFiveService.updateProfile(reqBody, managementToken, reachFiveUserID);

            if (!resetPassRsp.ok) {
                LOGGER.error('Error during ReachFive reset password: {0}', resetPassRsp.errorMessage);
            }
        } else {
            LOGGER.error('Error during ReachFive Management token call: {0}', managementTokenObj.errorMessage);
        }
    }

    return resetPassRsp;
}

/**
 * @function
 * @description Get Reach Five External Profile ID
 * @param {dw.customer.Profile} profile сurrent Customer Profile
 * @return {string} Reach Five External Profile ID
 * */
function getReachFiveExternalID(profile) {
    var externalProfiles = profile.customer.getExternalProfiles();
    var externalProfile = null;
    var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();

    for (var i = 0, l = externalProfiles.length; i < l; i++) {
        externalProfile = externalProfiles[i];
        if (externalProfile && externalProfile.externalID
            && externalProfile.authenticationProviderID === reachFiveProviderId) {
            break;
        }
    }

    return externalProfile && externalProfile.externalID;
}

module.exports.loginWithPassword = loginWithPassword;
module.exports.signUp = signUp;
module.exports.isNewPhone = isNewPhone;
module.exports.getReachfiveProfileFields = getReachfiveProfileFields;
module.exports.getTokenWithPassword = getTokenWithPassword;
module.exports.updatePassword = updatePassword;
module.exports.getUserProfile = getUserProfile;
module.exports.updateReachfivePhoneWithTnk = updateReachfivePhoneWithTnk;
module.exports.updateReachfiveLoginWithTkn = updateReachfiveLoginWithTkn;
module.exports.updateReachFiveProfile = updateReachFiveProfile;
module.exports.getCustomerReachFiveExtProfile = getCustomerReachFiveExtProfile;
module.exports.passwordUpdateManagementAPI = passwordUpdateManagementAPI;
module.exports.passwordResetManagementAPI = passwordResetManagementAPI;
module.exports.getReachFiveExternalID = getReachFiveExternalID;
