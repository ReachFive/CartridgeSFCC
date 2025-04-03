/* eslint-disable */
'use strict';

/**
 * @typedef {import('./reachfiveSession')} ReachFiveSessionType
 */

const LOGGER = require('dw/system/Logger').getLogger('reachfive');
const Encoding = require('dw/crypto/Encoding');
var {enableKakaoTalkNameSplit} = require('*/cartridge/models/reachfiveSettings');

const TOKEN_LENGTH_LIMIT = 1999;
const DURATION_HORIZON = 290;

/**
 * Recursively removes properties from an object if their string length exceeds TOKEN_LENGTH_LIMIT.
 *
 * @param {Object} obj - The object to process.
 * @returns {Object} - The processed object.
 */
const removeLongStrings = (obj) => {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            removeLongStrings(obj[key]);
        } else if (typeof obj[key] === 'string' && obj[key].length > TOKEN_LENGTH_LIMIT) {
            delete obj[key];
        }
    });
    return obj;
};

/**
 * Decode id_token string into an object.
 *
 * @param {string} idToken - The id_token string.
 * @returns {Object|null} - The decoded object or null if decoding fails.
 */
const decodeIdToken = (idToken) => {
    try {
        const partsofidtoken = idToken.split('.')[1];
        const decoded = Encoding.fromBase64(partsofidtoken);
        return JSON.parse(decoded.toString());
    } catch (e) {
        LOGGER.error('Error decoding id_token: ' + e.message);
        return null;
    }
};

/**
 * @constructor
 * @classdesc Manages ReachFive session data.
 *
 * @param {Object} [authRespObj] - A response containing the access token.
 * @returns {ReachFiveSessionType} - The ReachFive session object.
 */
function ReachfiveSession(authRespObj) {
    this.profile = null;
    this.initialize(authRespObj);

    this.defineSessionProperties();
    return this;
}

ReachfiveSession.prototype = {
    /**
     * Sets Salesforce session values from the ReachFive response object.
     *
     * @param {Object} authRespObj - The authentication response object.
     */
    initialize(authRespObj) {
        if (authRespObj && authRespObj.id_token && authRespObj.id_token.length <= TOKEN_LENGTH_LIMIT) {
            session.privacy.id_token = authRespObj.id_token;
        }

        const externalProfile = this.setSessionTokens(authRespObj);
        if (externalProfile) {
            this.profile = externalProfile;
            this.handleKakaoTalkNameSplit(externalProfile);
        }
    },

    /**
     * Sets session tokens and returns the decoded profile.
     *
     * @param {Object} authRespObj - The authentication response object.
     * @returns {Object|null} - The decoded profile or null.
     */
    setSessionTokens(authRespObj) {
        if (authRespObj && authRespObj.access_token && authRespObj.id_token) {
            const externalProfile = decodeIdToken(authRespObj.id_token);
            if (externalProfile) {
                session.privacy.access_token = authRespObj.access_token;
                session.privacy.access_token_exp = externalProfile.exp;
                session.privacy.access_token_iat = externalProfile.iat;

                if (authRespObj.refresh_token) {
                    session.privacy.refresh_token = authRespObj.refresh_token;
                }

                if (authRespObj.provider_access_token) {
                    session.privacy.provider_access_token = authRespObj.provider_access_token;
                }
            }
            return externalProfile;
        }
        return session.privacy.id_token ? decodeIdToken(session.privacy.id_token) : null;
    },

    /**
     * Handles name splitting for KakaoTalk authentication.
     *
     * @param {Object} externalProfile - The external profile object.
     */
    handleKakaoTalkNameSplit(externalProfile) {
        if (enableKakaoTalkNameSplit &&
            externalProfile.auth_type === 'kakaotalk' && externalProfile.name) {
            try {
                const fullName = externalProfile.name;
                this.profile.family_name = fullName.substring(0, 1);
                this.profile.given_name = fullName.substring(1);
            } catch (e) {
                LOGGER.error('Error splitting KakaoTalk name: ' + e.message);
            }
        }
    },

    /**
     * Defines session properties with getters and setters.
     */
    defineSessionProperties() {
        Object.defineProperties(this, {
            id_token: { get: () => session.privacy.id_token },
            access_token: { get: () => session.privacy.access_token },
            refresh_token: { get: () => session.privacy.refresh_token },
            provider_access_token: { get: () => session.privacy.provider_access_token },
            access_token_exp: { get: () => session.privacy.access_token_exp },
            access_token_iat: { get: () => session.privacy.access_token_iat },
            one_time_token: {
                get: () => {
                    const oneTimeTkn = session.privacy.one_time_token;
                    delete session.privacy.one_time_token;
                    return oneTimeTkn;
                },
                set: (value) => { session.privacy.one_time_token = value; }
            },
            has_password: {
                get: () => !!session.privacy.has_password,
                set: (value) => {
                    if (value === 'true' || (typeof value === 'boolean' && value)) {
                        session.privacy.has_password = true;
                    } else {
                        delete session.privacy.has_password;
                    }
                }
            }
        });
    },

    /**
     * Checks if the access token is within a 5-minute limit from its issue time.
     *
     * @returns {boolean} - True if within the limit, otherwise false.
     */
    isAccessToken5MinLimit() {
        const timeStamp = Math.floor(Date.now() / 1000);
        return timeStamp < (this.access_token_iat + DURATION_HORIZON);
    },

    /**
     * Checks if a one-time token is present in the session.
     *
     * @returns {boolean} - True if a one-time token is present, otherwise false.
     */
    isOneTimeTkn() {
        return !!session.privacy.one_time_token;
    }
};

module.exports = ReachfiveSession;
