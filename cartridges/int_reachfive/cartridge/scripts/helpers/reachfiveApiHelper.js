'use strict';

var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
var {
    getStateObjBase64,
    getReachFiveExternalID
} = require('*/cartridge/scripts/helpers/reachFiveHelper');

var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var {
    getReachFiveApiKey,
    getReachFiveDomain,
    getReachFiveProviderId,
    isReachFiveEnabled
} = require('*/cartridge/models/reachfiveSettings');

const initPkce = () => {
    const uuidStr = dw.util.UUIDUtils.createUUID();
    const codeVerifier = uuidStr.replace(/-/g, '');
    
    // Create hash using MessageDigest
    const md = new dw.crypto.MessageDigest(dw.crypto.MessageDigest.DIGEST_SHA_256);
    const hashedBytes = md.digestBytes(new dw.util.Bytes(codeVerifier));
    
    // Base64 encode and make URL safe
    const codeChallenge = dw.crypto.Encoding.toBase64(hashedBytes)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    
    return {
        codeVerifier,
        codeChallenge
    };
};

/**
 * Create ReachFive login redirect url for Storefront action
 * @param {string} tkn The one-time use authentication token
 * @param {string} stateTarget state object url
 * @return {string|null} result
 */
function createLoginRedirectUrl(tkn, stateTarget) {
    const { codeVerifier, codeChallenge } = initPkce();
    session.privacy.codeChallenge = codeChallenge;
    session.privacy.codeVerifier = codeVerifier;
    var querystring = '';
    var PROTOCOL = 'https';
    var domain = getReachFiveDomain();
    var ENDPOINT = 'oauth/authorize';
    var url = PROTOCOL + '://' + domain + '/' + ENDPOINT;

    var queryObj = {
        client_id: getReachFiveApiKey(),
        scope: 'openid profile email phone full_write',
        response_type: 'code',
        redirect_uri: URLUtils.https(
            'ReachFiveController-CallbackReachFiveRequest'
        ).toString(),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        origin: Site.getCurrent().getID(),
        display: 'page'
    };

    var queryObjEncoded = {};
    Object.keys(queryObj).forEach(function (key) {
        queryObjEncoded[key] = encodeURIComponent(queryObj[key]);
    });

    // No need additional encoding
    queryObjEncoded.state = getStateObjBase64(stateTarget);
    queryObjEncoded.tkn = tkn;

    Object.keys(queryObjEncoded).forEach(function (key) {
        querystring += '&' + key + '=' + queryObjEncoded[key];
    });

    // Remove first '&' symbol
    querystring = querystring.substring(1);

    url = url + '?' + querystring;

    return url;
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
    var result = profileFields
        || 'id,email,emails.verified,given_name,family_name,birthdate,phone_number,gender,addresses,consents';
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

    if (result.ok && !empty(result.object)) {
        var reachfiveSession = new ReachfiveSessionModel();
        reachfiveSession.initialize(result.object);
    } else {
        try {
            result.errorObj = JSON.parse(result.errorMessage);
        } catch (error) {
            LOGGER.error(
                'Error during parse getTokenWithPassword error object: {0}',
                error
            );
        }
        LOGGER.error(
            'Error during request access token with customer password: {0}',
            result.errorMessage
        );
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
    var clientId = getReachFiveApiKey();
    var result = reachFiveService.updatePassword(
        email,
        newPassword,
        oldPassword,
        clientId
    );

    if (!result.ok) {
        try {
            result.errorObj = JSON.parse(result.errorMessage);
        } catch (error) {
            LOGGER.error(
                'Error during parse updatePassword error object: {0}',
                error
            );
        }
        LOGGER.error(
            'Error during get ReachFive update password: {0}',
            result.errorMessage
        );
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
        LOGGER.error(
            'Error during get ReachFive user Profile: {0}',
            result.errorMessage
        );
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
        LOGGER.error(
            'Error during update ReachFive phone number: {0}',
            result.errorMessage
        );

        if (result.errorMessage) {
            try {
                result.errorObj = JSON.parse(result.errorMessage);

                if (
                    result.errorObj
                    && Object.prototype.hasOwnProperty.call(
                        result.errorObj,
                        'error_details'
                    )
                ) {
                    var errorObj = Array.prototype.find.call(
                        result.errorObj.error_details,
                        function (element) {
                            return element.field === 'phone_number';
                        }
                    );

                    if (errorObj) {
                        result.errorObj.error_description = errorObj.message;
                    }
                }
            } catch (error) {
                LOGGER.error(
                    'Error during parse ReachFive phone number update error: {0}',
                    error
                );
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
        LOGGER.error(
            'Error during update ReachFive login: {0}',
            result.errorMessage
        );

        if (result.errorMessage) {
            try {
                result.errorObj = JSON.parse(result.errorMessage);
            } catch (error) {
                LOGGER.error(
                    'Error during parse ReachFive login update error: {0}',
                    error
                );
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
            LOGGER.error(
                'Error during update ReachFive profile: {0}',
                result.errorMessage
            );
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
    var reachFiveProviderId = getReachFiveProviderId();
    var customerReachFiveProfile = null;
    if (thatCustomer && thatCustomer.getExternalProfiles().length) {
        var externalProfiles = thatCustomer.getExternalProfiles();
        externalProfiles.toArray().forEach(function (profile) {
            if (profile.authenticationProviderID === reachFiveProviderId) {
                customerReachFiveProfile = profile;
            }
        });
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
    if (isReachFiveEnabled) {
        var managementTokenObj = reachFiveService.generateTokenForManagementAPI();
        if (managementTokenObj.ok) {
            var managementToken = managementTokenObj.token;
            var resetPassRsp;

            var reachFiveCustomerId = getReachFiveExternalID(profile);
            if (reachFiveCustomerId) {
                var reqBody = {
                    password: newPassword
                };
                resetPassRsp = reachFiveService.updateProfile(
                    reqBody,
                    managementToken,
                    reachFiveCustomerId
                );

                if (!resetPassRsp.ok) {
                    LOGGER.error(
                        'Error during ReachFive reset password: {0}',
                        resetPassRsp.errorMessage
                    );
                }
            }
        } else {
            LOGGER.error(
                'Error during ReachFive Management token call: {0}',
                managementTokenObj.errorMessage
            );
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

    if (isReachFiveEnabled && reachFiveUserID) {
        var managementTokenObj = reachFiveService.generateTokenForManagementAPI();
        if (managementTokenObj.ok) {
            var managementToken = managementTokenObj.token;
            var reqBody = {
                password: newPassword
            };
            resetPassRsp = reachFiveService.updateProfile(
                reqBody,
                managementToken,
                reachFiveUserID
            );

            if (!resetPassRsp.ok) {
                LOGGER.error(
                    'Error during ReachFive reset password: {0}',
                    resetPassRsp.errorMessage
                );
            }
        } else {
            LOGGER.error(
                'Error during ReachFive Management token call: {0}',
                managementTokenObj.errorMessage
            );
        }
    }

    return resetPassRsp;
}

module.exports = {
    isNewPhone,
    getReachfiveProfileFields,
    getTokenWithPassword,
    updatePassword,
    getUserProfile,
    updateReachfivePhoneWithTnk,
    updateReachfiveLoginWithTkn,
    updateReachFiveProfile,
    getCustomerReachFiveExtProfile,
    passwordUpdateManagementAPI,
    passwordResetManagementAPI,
    createLoginRedirectUrl
};
