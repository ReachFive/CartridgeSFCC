'use strict';

/**
 * The API provides the operation to let developers handle the profile lifecycle. In order to use the API you have to obtain a long lived access token
 * Documentation here : https://developers.reach5.co/en/api-rest
 * */

/* eslint-disable no-use-before-define */
/* eslint-disable indent */

/**
 * API Includes
 * */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var URLUtils = require('dw/web/URLUtils');

/**
 * Script Modules
 */
var reachFiveHelper = require('~/cartridge/scripts/helpers/reachFiveHelper');
var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');

var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * Constructs and configures a service with a callback.
 * @param {string} serviceName Service Name
 * @param {Object} [substObj] Replaceable value object
 * @returns {dw.svc.HTTPService} Service Object
 */
function configureService(serviceName, substObj) {
	return LocalServiceRegistry.createService(serviceName, {
        createRequest: function (svc, params) {
            svc.setAuthentication('NONE');
            svc.addHeader('Content-type', 'application/json');
            svc.addHeader('charset', 'UTF-8');

            var svcUrl = svc.configuration.credential.URL;

            if (svcUrl) {
                svcUrl = svcUrl.replace('{reach5Domain}', reachfiveSettings.reach5Domain);

                if (substObj && Object.keys(substObj).length !== 0) {
                    Object.keys(substObj).forEach(function (key) {
                        if (String.prototype.indexOf.call(svcUrl, '{' + key + '}') !== -1) {
                            svcUrl = svcUrl.replace('{' + key + '}', substObj[key]);
                        } else {
                            svcUrl += '&' + key + '=' + substObj[key];
                        }
                    });
                }

                svc.setURL(svcUrl);
            }

			var jsonArgs = JSON.stringify(params);
			return jsonArgs;
        },
        parseResponse: function (svc, client) {
			var jsonResponse = client.text;
			var objResponse = JSON.parse(jsonResponse);
			return objResponse;
		}
	});
}

/**
 * @description Merge 2 objects in one result with overriding
 * @param {Object} obj1 - first redefinable object to merge
 * @param {Object} obj2 = second object to merge
 * @returns {Object} result of the merging
 */
function mergeObjects(obj1, obj2) {
    var result = obj1;
    var keys = Object.keys(obj2);

    keys.forEach(function (key) {
        result[key] = obj2[key];
    });

    return result;
}

// TODO: Need to be refactored in order to use: oauthToken function
/**
 * @function
 * @description Call Service Registry ReachFive. This method is not exposed
 * @return {string} response.auth.accessToken
 * */
function generateToken() {
	var requestParams = {
		grant_type: 'client_credentials',
		client_id: reachFiveHelper.getReachFiveApiKey(),
        client_secret: reachFiveHelper.getReachFiveClientSecret()
	};
	// Service Call
	var service = configureService('reachfive.rest.auth');
	var result = service.call(requestParams);
	return result.object.access_token;
}

// TODO: Need to be refactored in order to use: oauthToken function
/**
 * @function
 * @description Call Service to have access_token for management API
 * @return {Object} result Obj which contains response.auth.accessToken or errorMessage
 * */
function generateTokenForManagementAPI() {
	var requestParams = {
		grant_type: 'client_credentials',
		client_id: reachFiveHelper.getReachFiveManagementApiKey(),
		client_secret: reachFiveHelper.getReachFiveManagementClientSecret(),
		scope: reachFiveHelper.getReachFiveManagementScope()
	};
	// Service Call
	var service = configureService('reachfive.rest.auth');
	var serviceResult = service.call(requestParams);

	var result = {
		ok: serviceResult.ok,
		token: serviceResult.object && serviceResult.object.access_token,
		errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
	};

	return result;
}

// TODO: Need to be refactored in order to use: oauthToken function
/**
 * @function
 * @description Call Service Registry ReachFive. This method is not exposed
 * @param {Object} customFields Custom Fields
 * @return {string} response.auth.accessToken
 * */
function exchangeAuthorizationCodeForIDToken(customFields) {
	var requestParams = {
		code: customFields.code,
		client_id: reachFiveHelper.getReachFiveApiKey(),
		client_secret: reachFiveHelper.getReachFiveClientSecret(),
    grant_type: 'authorization_code',
    return_provider_token: reachfiveSettings.isReachFiveReturnProviderToken,
		redirect_uri: customFields.redirectUrl || URLUtils.https('ReachFiveController-CallbackReachFiveRequest').toString()
	};
	// Service Call
	var service = configureService('reachfive.rest.auth');
	var result = service.call(requestParams);
	return result.object;
}

// TODO: Need to be refactored in order to use: oauthToken function
/**
 * @function
 * @description Retrieve new access_token with refresh_token
 * @param {Object} refreshToken Refresh token
 * @return {Object} response.auth.accessToken
 * */
function retrieveAccessTokenWithRefresh(refreshToken) {
	var requestParams = {
		client_id: reachFiveHelper.getReachFiveApiKey(),
		client_secret: reachFiveHelper.getReachFiveClientSecret(),
		grant_type: 'refresh_token',
    refresh_token: refreshToken
	};
	// Service Call
	var service = configureService('reachfive.rest.auth');
	var serviceResult = service.call(requestParams);
    var result = {
		ok: serviceResult.ok,
		object: serviceResult.object,
		errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
	};

	return result;
}

/**
 * @function
 * @description Call Service to trigger the verification email sending
 * @param {string} managementToken Management API token
 * @param {string} reachFiveExternalID ReachFive external profile ID
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
function sendVerificationEmail(managementToken, reachFiveExternalID) {
	var service = configureService('reachfive.verifyemail.post', { user_id: reachFiveExternalID });
	service.addHeader('Authorization', 'Bearer ' + managementToken);

	var serviceResult = service.call();
	var result = {
		ok: serviceResult.ok,
		errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
	};

	return result;
}

/**
 * @function
 * @description Call Service to update ReachFive profile
 * @param {Object} requestObj Request Object with new login
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
function updateEmail(requestObj) {
	var service = configureService('reachfive.updateemail.post');
	service.setRequestMethod('POST');
	service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

	var serviceResult = service.call(requestObj);
	var result = {
		ok: serviceResult.ok,
		object: serviceResult.object,
		errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
	};

	return result;
}

/**
 * @function
 * @description Call Service to update ReachFive phone
 * @param {Object} requestObj Request Object with new login
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
function updatePhone(requestObj) {
    var service = configureService('reachfive.updatephone.post');
    service.setRequestMethod('POST');
	service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
	var result = {
		ok: serviceResult.ok,
		object: serviceResult.object,
		errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
	};

	return result;
}

/**
 * @function
 * @description Call Service to update ReachFive profile
 * @param {Object} requestObj Request Object with profile data
 * @param {string} managementToken Management API token
 * @param {string} reachFiveExternalID Reach Five external profile ID
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
 function updateProfile(requestObj, managementToken, reachFiveExternalID) {
	var service = configureService('reachfive.updateprofile.put', { user_id: reachFiveExternalID });
	service.setRequestMethod('PUT');
	service.addHeader('Authorization', 'Bearer ' + managementToken);

	var serviceResult = service.call(requestObj);
	var result = {
		ok: serviceResult.ok,
		object: serviceResult.object,
		errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
	};

	return result;
}

/**
 * @function
 * @description Call Service to update ReachFive profile by Identity API
 * @param {Object} requestObj Request Object with profile data
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
 function updateProfileIdentityAPI(requestObj) {
	var service = configureService('reachfive.update.profile.post');
	service.setRequestMethod('POST');
	service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    var servResObject;

    try {
        servResObject = JSON.parse(serviceResult.errorMessage);
    } catch (error) {
        servResObject = serviceResult.object;
    }

    var result = {
        ok: serviceResult.ok,
        object: servResObject,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };

    return result;
}

/**
 * @function
 * @description Call Service to get ReachFive profile info
 * @param {string} profileFields Comma separated profile user fields
 * @return {Object} Result Obj which contains response result or errorMessage if error
 * */
function getUserProfile(profileFields) {
	var service = configureService('reachfive.userinfo.get', { profile_fields: profileFields });
	service.setRequestMethod('GET');
	service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

	var serviceResult = service.call();
	var result = {
		ok: serviceResult.ok,
		object: serviceResult.object,
		errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
	};

	return result;
}

/**
 * @function
 * @description Call Service to sign up new customer
 * @param {string} login - customer login name
 * @param {string} password - customer password
 * @param {Object} profile - Customer profile
 * @return {Object} Result Obj which contains response result or errorMessage if error
 * */
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

	// Service Call
	var service = configureService('reachfive.signup.post');
    service.setRequestMethod('POST');

    var serviceResult = service.call(requestParams);
    var result = {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };

    return result;
}

/**
 * Update Reach Five password for account.
 * @param {string} email customer mail
 * @param {string} newPassword new customer password
 * @param {string} oldPassword old customer password
 * @param {string} clientId Api client Id
 * @returns {Object} Service Object
 */
function updatePassword(email, newPassword, oldPassword, clientId) {
    var requestParams = {
        client_id: clientId || reachFiveHelper.getReachFiveApiKey(),
        email: email,
        password: newPassword,
        old_password: oldPassword
    };

    // Service Call
    var service = configureService('reachfive.updatepassword.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestParams);

    var result = {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };

    return result;
}

/**
 * @function
 * @description Retrieve an access token (authorization code flow)
 * @param {Object} requestObj Object with request fields
 * @return {Object} result Obj which contains response.auth.accessToken or errorMessage
 * */
function oauthToken(requestObj) {
    var requestParams = {
        client_id: reachfiveSettings.reach5ApiKey,
        client_secret: reachfiveSettings.reach5ClientSecret
    };

    var keys = Object.keys(requestObj);

    if (keys.length) {
        keys.forEach(function (key) {
            requestParams[key] = requestObj[key];
        });
    }

    // Service Call
    var service = configureService('reachfive.rest.auth');
    var serviceResult = service.call(requestParams);

    var result = {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };

    return result;
}

/**
 * @description User logs in with a password
 * @param {Object} requestFields request fields object
 * @returns {Object} request result
 */
function passwordLogin(requestFields) {
    var baseFields = {
        client_id: reachfiveSettings.reach5ApiKey
    };

    var requestObj = mergeObjects(baseFields, requestFields);

    var service = configureService('reachfive.passwordlogin.post');
    service.setRequestMethod('POST');

    var serviceResult = service.call(requestObj);

    var result = {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };

    return result;
}

/**
 * @function
 * @description Delete the user on Reachfive
 * @param {Object} customerProfile Customer
 * @return {Object} request result
 */
function deleteUser(customersIterator) {
    var managementToken = generateTokenForManagementAPI();
    while (customersIterator.hasNext()) {
        var customerProfile = customersIterator.next();

        try {
            var clientId = reachFiveHelper.getReachFiveExternalID(customerProfile);
            var service = configureService('reachfive.deleteuser', { user_id: clientId });
            service.setRequestMethod('DELETE');
            service.addHeader('Authorization', 'Bearer ' + managementToken.token);

            var serviceResult = service.call();
            var result = {
                ok: serviceResult.ok,
                errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : null
            };
        }
        catch(e){
            LOGGER.error("erreur"+e);
        }  
    }
    return result;
}


/* Expose Methods */
exports.generateTokenForManagementAPI = generateTokenForManagementAPI;
exports.exchangeAuthorizationCodeForIDToken = exchangeAuthorizationCodeForIDToken;
exports.retrieveAccessTokenWithRefresh = retrieveAccessTokenWithRefresh;
exports.generateToken = generateToken;
exports.updateEmail = updateEmail;
exports.updatePhone = updatePhone;
exports.updateProfile = updateProfile;
exports.updateProfileIdentityAPI = updateProfileIdentityAPI;
exports.sendVerificationEmail = sendVerificationEmail;
exports.getUserProfile = getUserProfile;
exports.signUp = signUp;
exports.updatePassword = updatePassword;
exports.oauthToken = oauthToken;
exports.passwordLogin = passwordLogin;
exports.deleteUser = deleteUser; 