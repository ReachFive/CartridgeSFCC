'use strict';

/**
 * @constructor
 * @classdesc Reachfive session data
 *
 * @param {Object} [authRespObj] - A response containing the access token
 * @param {string} authRespObj.access_token - The Access token itself
 * @param {string} authRespObj.id_token - Id token with auth information inside
 * @param {string} authRespObj.provider_access_token - The Provider Access token (Social Login)
 * @param {string} [authRespObj.refresh_token] - Refresh token
 * @param {string} authRespObj.token_type - Type of the authentication
 * @param {string} authRespObj.expires_in - Expired time in seconds
 */
function ReachfiveSession(authRespObj) {
    this.profile = null;

    this.initialize(authRespObj);

    Object.defineProperty(this, 'access_token', {
        get: function () {
            return session.privacy.access_token;
        }
    });

    Object.defineProperty(this, 'refresh_token', {
        get: function () {
            return session.privacy.refresh_token;
        }
    });

    Object.defineProperty(this, 'provider_access_token', {
        get: function () {
            return session.privacy.provider_access_token;
        }
    });

    Object.defineProperty(this, 'access_token_exp', {
        get: function () {
            return session.privacy.access_token_exp;
        }
    });

    Object.defineProperty(this, 'access_token_iat', {
        get: function () {
            return session.privacy.access_token_iat;
        }
    });

    Object.defineProperty(this, 'one_time_token', {
        get: function () {
            var oneTimeTkn = session.privacy.one_time_token;
            delete session.privacy.one_time_token;
            return oneTimeTkn;
        },
        set: function (value) {
            session.privacy.one_time_token = value;
        }
    });

    Object.defineProperty(this, 'has_password', {
        get: function () {
            return !!session.privacy.has_password;
        },
        set: function (value) {
            if (value === 'true' || (typeof value === 'boolean' && value)) {
                session.privacy.has_password = true;
            } else {
                delete session.privacy.has_password;
            }
        }
    });

    Object.defineProperty(this, 'prefill_register', {
        get: function () {
            return !!session.privacy.prefill_register;
        },
        set: function (value) {
            if (value === 'true' || (typeof value === 'boolean' && value)) {
                session.privacy.prefill_register = true;
            } else {
                delete session.privacy.prefill_register;
            }
        }
    });
}

/**
 * Decode id_token string in idTokenPayload object
 *
 * @param {string} idToken - id_token string
 * @returns {Object|null} - result of the decoding
 */
function decodeIdToken(idToken) {
    var Encoding = require('dw/crypto/Encoding');

    var decodedObj = null;
    var partsofidtoken;
    var decoded;

    if (idToken) {
        partsofidtoken = idToken.split('.')[1];
        decoded = Encoding.fromBase64(partsofidtoken);
        decodedObj = JSON.parse(decoded.toString());
    }

    return decodedObj;
}

ReachfiveSession.prototype = {
    /**
     * @description Set Salesforce session values from reachfive response object
     *
     * @param {Object} authRespObj - A response containing the access token
     * @param {string} authRespObj.access_token - The Access token itself
     * @param {string} authRespObj.id_token - Id token with auth information inside
     * @param {string} [authRespObj.refresh_token] - Refresh token
     * @param {string} [authRespObj.provider_access_token] - Provider Access token
     * @param {string} authRespObj.token_type - Type of the authentication
     * @param {string} authRespObj.expires_in - Expired time in seconds
     */
    initialize: function (authRespObj) {
        var externalProfile;

        if (authRespObj && authRespObj.access_token && authRespObj.id_token) {
            externalProfile = decodeIdToken(authRespObj.id_token);

            if (externalProfile) {
                session.privacy.access_token = authRespObj.access_token;
                session.privacy.access_token_exp = externalProfile.exp;
                session.privacy.access_token_iat = externalProfile.iat;

                if (Object.hasOwnProperty.call(authRespObj, 'refresh_token')) {
                    session.privacy.refresh_token = authRespObj.refresh_token;
                }

                if (Object.hasOwnProperty.call(authRespObj, 'provider_access_token')) {
                    session.privacy.provider_access_token = authRespObj.provider_access_token;
                }
            }
        }

        if (externalProfile) {
            this.profile = externalProfile;
        }
    },
    isAccessToken5MinLimit: function () {
        var DURATION_HORIZON = 290; // 5 min - 10sec
        var status = false;
        var timeStamp = +('' + Date.now()).slice(0, -3);

        if (timeStamp < (this.access_token_iat + DURATION_HORIZON)) {
            status = true;
        }

        return status;
    },
    isOneTimeTkn: function () {
        return !!session.privacy.one_time_token;
    },
    isPrefillRegister: function () {
        return this.prefill_register && !empty(this.profile);
    }
};

module.exports = ReachfiveSession;
