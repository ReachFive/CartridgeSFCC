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
var LOGGER = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');

/**
 * Script Modules
 */
var reachFiveHelper = require('~/cartridge/scripts/helpers/reachFiveHelper');

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
		redirect_uri: customFields.redirectUrl || URLUtils.https('ReachFiveController-CallbackReachFiveRequest').toString()
	};
	// Service Call
	var service = configureService('reachfive.rest.auth');
	var result = service.call(requestParams);
	return result.object;
}

/**
 * @function
 * @description Call Service Registry reachfive.setcustomfields.post to save custom fields in reachfive backoffice.
 * First of all,We need configure mapping fields in reachfive backoffice.
 * In data object the key is the field was set in reachfive backoffice
 * @param {Object} customFields Custom Fields
 * @return {boolean} response.status
 * */
function saveCustomFields(customFields) {
	LOGGER.debug('saveCustomFields START');
	LOGGER.debug('customerCode: ' + customFields.data.external_id);

	// Generate token before save custom fields. The token is mandatory for the next steps
	var token = generateTokenForManagementAPI().token;
	LOGGER.debug('token: ' + token);
	if (!token) {
		LOGGER.error('No token generated before call reachfive.setcustomfields.post : ');
		return null;
	}

	var requestParams = {
		customerParams: customFields,
		token: token
	};
	// Service Call
	var service = configureService('reachfive.setcustomfields.post');
	var httpServiceResult = service.call(requestParams);

	LOGGER.debug('httpServiceResult: ' + httpServiceResult);

	if (!httpServiceResult.ok || !httpServiceResult.object) {
		LOGGER.error('Error during reachfive call : ', httpServiceResult.errorMessage);
		return null;
	}

    var response = JSON.parse(httpServiceResult.object);
    LOGGER.debug('response.external_id: ' + response.external_id);

	return (response.external_id === customFields.data.external_id);
}

/**
 * @function
 * @description Call Service to trigger the verification email sending
 * @param {string} managementToken Management API token
 * @param {string} reachFiveExternalID ReachFive external profile ID
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
function sendVerificationEmail(managementToken, reachFiveExternalID) {
	var reach5Domain = reachFiveHelper.getReachFiveDomain();

	var service = configureService('reachfive.verifyemail.post');
	service.addHeader('Authorization', 'Bearer ' + managementToken);

	var serviceUrl = service.configuration.credential.URL;
	serviceUrl = serviceUrl.replace('{reach5Domain}', reach5Domain).replace('{user_id}', reachFiveExternalID);
	service.setURL(serviceUrl);

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
 * @param {Object} requestObj Request Object with profile data
 * @param {string} managementToken Management API token
 * @param {string} reachFiveExternalID Reach Five external profile ID
 * @return {Object} Result Obj which contains response result with errorMessage if error
 * */
 function updateProfile(requestObj, managementToken, reachFiveExternalID) {
	var reach5Domain = reachFiveHelper.getReachFiveDomain();

	var service = configureService('reachfive.updateprofile.put');
	service.setRequestMethod('PUT');
	service.addHeader('Authorization', 'Bearer ' + managementToken);

	var serviceUrl = service.configuration.credential.URL;
	serviceUrl = serviceUrl.replace('{reach5Domain}', reach5Domain).replace('{user_id}', reachFiveExternalID);
	service.setURL(serviceUrl);

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
	var reach5Domain = reachFiveHelper.getReachFiveDomain();

	var service = configureService('reachfive.update.profile.post');
	service.setRequestMethod('POST');
	service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceUrl = service.configuration.credential.URL;
    serviceUrl = serviceUrl.replace('{reach5Domain}', reach5Domain);
    service.setURL(serviceUrl);

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
 * @param {string} identityAccessToken Identity API access token
 * @return {Object} Result Obj which contains response result or errorMessage if error
 * */
function getUserInfo(identityAccessToken) {
	var reach5Domain = reachFiveHelper.getReachFiveDomain();

	var service = configureService('reachfive.userinfo.get');
	service.setRequestMethod('Get');
	service.addHeader('Authorization', 'Bearer ' + identityAccessToken);

	var serviceUrl = service.configuration.credential.URL;
	serviceUrl = serviceUrl.replace('{reach5Domain}', reach5Domain);
	service.setURL(serviceUrl);

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
    // Generate token before save custom fields. The token is mandatory for the next steps
    var reach5Domain = reachFiveHelper.getReachFiveDomain();

	var requestParams = {
        client_id: reachFiveHelper.getReachFiveApiKey(),
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

    var serviceUrl = service.configuration.credential.URL;
	serviceUrl = serviceUrl.replace('{reach5Domain}', reach5Domain);
	service.setURL(serviceUrl);

    var serviceResult = service.call(requestParams);
    var result = {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };

    return result;
}

/**
 * Constructs and configures a service with a callback.
 * @param {string} serviceName Service Name
 * @returns {dw.svc.Service} Service Object
 */
function configureService(serviceName) {
	return LocalServiceRegistry.createService(serviceName, {
        createRequest: function (svc, params) {
			svc.setAuthentication('NONE');
			svc.addHeader('Content-type', 'application/json');
			svc.addHeader('charset', 'UTF-8');
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
 * Update Reach Five password for account.
 * @param {string} email customer mail
 * @param {string} newPassword new customer password
 * @param {string} oldPassword old customer password
 * @returns {dw.svc.Service} Service Object
 */
function updatePassword(email, newPassword, oldPassword) {
    var reach5Domain = reachFiveHelper.getReachFiveDomain();
    var requestParams = {
        client_id: reachFiveHelper.getReachFiveApiKey(),
        email: email,
        password: newPassword,
        old_password: oldPassword
    };

    // Service Call
    var service = configureService('reachfive.updatepassword.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceUrl = service.configuration.credential.URL;
    serviceUrl = serviceUrl.replace('{reach5Domain}', reach5Domain);
    service.setURL(serviceUrl);

    var serviceResult = service.call(requestParams);

    var result = {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };

    return result;
}

/* Expose Methods */
exports.generateTokenForManagementAPI = generateTokenForManagementAPI;
exports.saveCustomFields = saveCustomFields;
exports.exchangeAuthorizationCodeForIDToken = exchangeAuthorizationCodeForIDToken;
exports.generateToken = generateToken;
exports.updateProfile = updateProfile;
exports.updateProfileIdentityAPI = updateProfileIdentityAPI;
exports.sendVerificationEmail = sendVerificationEmail;
exports.getUserInfo = getUserInfo;
exports.signUp = signUp;
exports.updatePassword = updatePassword;
