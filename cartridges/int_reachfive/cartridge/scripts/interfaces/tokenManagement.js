'use strict';

// var reachFiveHelper = require('~/cartridge/scripts/helpers/reachFiveHelper');
var reachFiveHelper = require('../helpers/reachFiveHelper');
var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var configureService = require('./serviceConfig').configureService;

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

function generateTokenForManagementAPI() {
    var requestObj = {
        grant_type: 'client_credentials',
        client_id: reachFiveHelper.getReachFiveManagementApiKey(),
        client_secret: reachFiveHelper.getReachFiveManagementClientSecret(),
        scope: reachFiveHelper.getReachFiveManagementScope()
    };
    return oauthToken(requestObj);
}

function generateToken() {
    var requestObj = {
        grant_type: 'client_credentials',
        client_id: reachFiveHelper.getReachFiveApiKey(),
        client_secret: reachFiveHelper.getReachFiveClientSecret()
    };
    return oauthToken(requestObj).then(result => result.object.access_token);
}

function exchangeAuthorizationCodeForIDToken(customFields) {
    var requestObj = {
        code: customFields.code,
        client_id: reachFiveHelper.getReachFiveApiKey(),
        client_secret: reachFiveHelper.getReachFiveClientSecret(),
        grant_type: 'authorization_code',
        return_provider_token: reachfiveSettings.isReachFiveReturnProviderToken,
        redirect_uri: customFields.redirectUrl || URLUtils.https('ReachFiveController-CallbackReachFiveRequest').toString()
    };
    return oauthToken(requestObj).object;
}

function retrieveAccessTokenWithRefresh(refreshToken) {
    var requestObj = {
        client_id: reachFiveHelper.getReachFiveApiKey(),
        client_secret: reachFiveHelper.getReachFiveClientSecret(),
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