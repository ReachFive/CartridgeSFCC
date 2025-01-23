'use strict';

var Site = require('dw/system/Site');
var LOGGER = require('dw/system/Logger').getLogger('reachfive');

const removeLongStrings = (obj) => {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                removeLongStrings(obj[key]); // recursive call to handle nested objects
            } else if (typeof obj[key] === 'string' && obj[key].length > 1999) {
                delete obj[key];
            }
        }
    }
    return obj;
}

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

    Object.defineProperty(this, 'id_token', {
        get: function () {
            return session.privacy.id_token;
        }
    });

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

        try {
            // we need to keep the external profile in session for later use
            // simply remove image
            if (authRespObj && !empty(authRespObj.id_token)) {
                if (authRespObj.id_token.length <= 1999) {
                    session.privacy.id_token = authRespObj.id_token;
                } else {
                    // too long id_token
                    // var cleanedProfile = removeLongStrings(JSON.parse(extrenalProfile));
                    // session.privacy.id_token = JSON.stringify(cleanedProfile);
                }
            }
        } catch (e) {
            LOGGER.error('Error setting id_token in session: ' + e.message);
        }

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
        } else if (session.privacy.id_token) {
            externalProfile = decodeIdToken(session.privacy.id_token);
        }

        if (externalProfile) {
            this.profile = externalProfile;
            if (Site.getCurrent().getCustomPreferenceValue('enableKakaoTalkNameSplit')) {
                try {
                    if ( Object.hasOwnProperty.call(externalProfile, 'auth_type') && !empty(externalProfile) && !empty(externalProfile.auth_type) && externalProfile.auth_type === 'kakaotalk') {
                        if (!empty(externalProfile.name)) {
                            var fullName = externalProfile.name;
        
                            // Split the name into the first letter and the rest
                            var lastName = fullName.substring(0, 1); // First letter
                            var firstName = fullName.substring(1);   // Rest of the name
        
                            this.profile.family_name = lastName;
                            this.profile.given_name = firstName;
                        }
                    }
                } catch (e) {
                    // Do nothing
                    LOGGER.error('Error splitting KakaoTalk name: ' + e.message);
                }
            }
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
    }
};

module.exports = ReachfiveSession;
