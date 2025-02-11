'use strict';

var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var configureService = require('./serviceConfig').configureService;

/**
 * @typedef {import('@types/reachFiveSettings')} ReachFiveSettings
 */

/**
 * Generates an OAuth token using the provided request object.
 *
 * @param {Object} requestObj - The request object containing additional parameters for the token request.
 * @param {string} requestObj.grant_type - The type of grant being requested.
 * @param {string} [requestObj.username] - The username for password grant type.
 * @param {string} [requestObj.password] - The password for password grant type.
 * @param {string} [requestObj.refresh_token] - The refresh token for refresh token grant type.
 * @returns {Object} The result of the token request.
 */
function oauthToken(requestObj) {
    var requestParams = {
        client_id: reachfiveSettings.reach5ApiKey,
        client_secret: reachfiveSettings.reach5ClientSecret
    };

    Object.assign(requestParams, requestObj);

    var service = configureService('reachfive.rest.auth');
    var serviceResult = service.call(requestParams);

    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

/**
 * Generates an OAuth token for the ReachFive Management API.
 *
 * This function constructs a request object with the necessary credentials
 * and scope to obtain an OAuth token using the client credentials grant type.
 *
 * @returns {Object} The OAuth token response object.
 */
function generateTokenForManagementAPI() {
    var requestObj = {
        grant_type: 'client_credentials',
        client_id: reachfiveSettings.getReachFiveManagementApiKey(),
        client_secret: reachfiveSettings.getReachFiveManagementClientSecret(),
        scope: reachfiveSettings.getReachFiveManagementScope()
    };
    return oauthToken(requestObj);
}

/**
 * Generates an OAuth token using client credentials.
 *
 * @returns {Promise<string>} A promise that resolves to the access token.
 */
function generateToken() {
    var requestObj = {
        grant_type: 'client_credentials',
        client_id: reachfiveSettings.getReachFiveApiKey(),
        client_secret: reachfiveSettings.getReachFiveClientSecret()
    };
    return oauthToken(requestObj).then(result => result.object.access_token);
}

/**
 * Exchanges an authorization code for an ID token.
 *
 * @param {Object} customFields - The custom fields required for the token exchange.
 * @param {string} customFields.code - The authorization code to be exchanged.
 * @param {string} [customFields.redirectUrl] - The redirect URI to be used. If not provided, a default URL is used.
 * @returns {Object} The response object containing the ID token.
 */
function exchangeAuthorizationCodeForIDToken(customFields) {
    var requestObj = {
        code: customFields.code,
        client_id: reachfiveSettings.getReachFiveApiKey(),
        client_secret: reachfiveSettings.getReachFiveClientSecret(),
        grant_type: 'authorization_code',
        return_provider_token: reachfiveSettings.isReachFiveReturnProviderToken,
        redirect_uri: customFields.redirectUrl || URLUtils.https('ReachFiveController-CallbackReachFiveRequest').toString()
    };
    if (customFields.codeVerifier) {
        requestObj.code_verifier = customFields.codeVerifier;
        requestObj.code_challenge_method = 'S256';
    }
    return oauthToken(requestObj);
}

/**
 * Retrieves a new access token using a refresh token.
 *
 * @param {string} refreshToken - The refresh token used to obtain a new access token.
 * @returns {Object} The response object containing the new access token.
 */
function retrieveAccessTokenWithRefresh(refreshToken) {
    var requestObj = {
        client_id: reachfiveSettings.getReachFiveApiKey(),
        client_secret: reachfiveSettings.getReachFiveClientSecret(),
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    };
    return oauthToken(requestObj);
}

/**
 * @function
 * @description Checks/updates the current tokens from the session for a 5 minute horizon
 * @param {boolean} [updateFlag] is update access token required
 * @return {Object} result
 * */
function verifySessionAccessTkn(updateFlag) {
    var status = {
        success: false,
        msg: Resource.msg('reachfive.access_tkn.expired', 'reachfive', null)
    };

    var updateToken = true;
    if (typeof updateFlag !== 'undefined') {
        updateToken = updateFlag;
    }

    var reachfiveSession = new ReachfiveSessionModel();

    if (reachfiveSession.isAccessToken5MinLimit()) {
        status.success = true;
    } else if (updateToken) {
        if (reachfiveSession.refresh_token) {
            var tokenObj = retrieveAccessTokenWithRefresh(reachfiveSession.refresh_token);

            if (tokenObj.ok) {
                status.success = true;
                reachfiveSession.initialize(tokenObj.object);
            } else {
                LOGGER.error('Error. Unable to update access_token with refresh_token, error: {0}', tokenObj.errorMessage);
                status.msg = Resource.msg('reachfive.server.error', 'reachfive', null);
            }
        } else {
            LOGGER.error('Error. access_token has expired and can not be updated. Check reachfive client preferences scope for "offline_access".');
        }
    }

    return status;
}

module.exports = {
    oauthToken: oauthToken,
    generateTokenForManagementAPI: generateTokenForManagementAPI,
    generateToken: generateToken,
    exchangeAuthorizationCodeForIDToken: exchangeAuthorizationCodeForIDToken,
    retrieveAccessTokenWithRefresh: retrieveAccessTokenWithRefresh,
    verifySessionAccessTkn: verifySessionAccessTkn
};
