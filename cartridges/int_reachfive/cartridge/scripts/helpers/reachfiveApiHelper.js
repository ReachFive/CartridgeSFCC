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
 * @description Moves the social identities of the profile that a social login created to the
 * profile the customer is linked to, then deletes the former, with the Management API. A failure
 * is logged and changes nothing for the customer, who is logged in either way.
 * The social profile is deleted first: Purse Identity refuses an identity that another profile
 * still holds.
 * @param {string} socialProfileId Purse Identity profile created by the social login
 * @param {string} profileId Purse Identity profile the customer is linked to
 * @return {boolean} true when the identities were moved
 * */
function moveSocialIdentities(socialProfileId, profileId) {
    if (!socialProfileId) {
        LOGGER.warn('No social profile in session to merge into {0}', profileId);
        return false;
    }
    if (!profileId || socialProfileId === profileId) {
        return false;
    }

    // Deleting a profile an SFCC customer is linked to would delete that customer: the DeleteUser
    // webhook deletes the customer of a deleted profile.
    var CustomerMgr = require('dw/customer/CustomerMgr');
    if (CustomerMgr.getExternallyAuthenticatedCustomerProfile(reachFiveHelper.getReachFiveProviderId(), socialProfileId)) {
        LOGGER.warn('Social profile {0} not merged into {1}: a customer is linked to it', socialProfileId, profileId);
        return false;
    }

    var managementToken = reachFiveService.generateTokenForManagementAPI();
    if (!managementToken.ok) {
        LOGGER.error('Social profile {0} not merged into {1}: no Management API token: {2}', socialProfileId, profileId, managementToken.errorMessage);
        return false;
    }

    var socialProfile = reachFiveService.getManagementUser(managementToken.token, socialProfileId, 'has_password,identities{user_id,provider,provider_variant}');
    if (!socialProfile.ok || !socialProfile.object) {
        LOGGER.error('Social profile {0} not merged into {1}: cannot read it: {2}', socialProfileId, profileId, socialProfile.errorMessage);
        return false;
    }

    // A profile with a password is an account of its own, not one that a social login created.
    if (socialProfile.object.has_password) {
        LOGGER.warn('Social profile {0} not merged into {1}: it has a password', socialProfileId, profileId);
        return false;
    }

    var identities = (socialProfile.object.identities || []).filter(function (identity) {
        return identity.user_id && identity.provider && identity.provider !== 'local' && identity.provider !== 'lite';
    });
    if (!identities.length) {
        LOGGER.warn('Social profile {0} not merged into {1}: it has no social identity', socialProfileId, profileId);
        return false;
    }

    var deletion = reachFiveService.deleteManagementUser(managementToken.token, socialProfileId);
    if (!deletion.ok) {
        LOGGER.error('Social profile {0} not merged into {1}: cannot delete it: {2}', socialProfileId, profileId, deletion.errorMessage);
        return false;
    }

    var moved = true;
    identities.forEach(function (identity) {
        var addition = reachFiveService.addManagementIdentity(managementToken.token, profileId, {
            provider: identity.provider,
            provider_variant: identity.provider_variant,
            user_id: identity.user_id
        });
        if (!addition.ok) {
            moved = false;
            LOGGER.error('Identity {0} of deleted social profile {1} not added to {2}: {3}', identity.provider, socialProfileId, profileId, addition.errorMessage);
        }
    });

    return moved;
}

/**
 * @function
 * @description Checks the password of the link form against Purse Identity, for a customer
 * already linked to a Purse Identity profile. Such a customer has no usable SFCC password in
 * Full CIAM mode, so the SFCC check alone always fails.
 * The customer stays linked to that profile, which receives the social identities of the profile
 * that the social login created.
 * @param {string} email Email entered in the link form
 * @param {string} password Password entered in the link form
 * @param {string} target URL to open once logged in
 * @param {string} socialProfileId Purse Identity profile created by the social login
 * @return {string|null} URL that opens the Purse Identity session and comes back to the
 * callback, or null when the customer is not linked to Purse Identity or the password is wrong
 * */
function getLinkFormLoginRedirectUrl(email, password, target, socialProfileId) {
    if (!reachFiveHelper.isReachFiveLoginAllowed() || empty(email) || empty(password)) {
        return null;
    }

    var CustomerMgr = require('dw/customer/CustomerMgr');
    var existingCustomer = CustomerMgr.getCustomerByLogin(email);
    var reachFiveProfile = getCustomerReachFiveExtProfile(existingCustomer);

    if (!reachFiveProfile) {
        return null;
    }

    var authResult = loginWithPassword(email, password);

    if (!authResult.ok || !authResult.object || !authResult.object.tkn) {
        return null;
    }

    moveSocialIdentities(socialProfileId, reachFiveProfile.externalID);

    return reachFiveHelper.createLoginRedirectUrl(authResult.object.tkn, target);
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
module.exports.getLinkFormLoginRedirectUrl = getLinkFormLoginRedirectUrl;
module.exports.passwordUpdateManagementAPI = passwordUpdateManagementAPI;
module.exports.passwordResetManagementAPI = passwordResetManagementAPI;
module.exports.getReachFiveExternalID = getReachFiveExternalID;
