'use strict';

/**
 * @typedef {import('types/reachFiveSettings')} ReachFiveSettings
 */

const currentSite = require('dw/system/Site').getCurrent();
const LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

// Constants for custom preference keys
const PREFERENCE_KEYS = {
    IS_REACHFIVE_ENABLED: 'isReachFiveEnabled',
    IS_REACHFIVE_TRANSITION_ACTIVE: 'isReachFiveTransitionActive',
    REACHFIVE_TRANSITION_COOKIE_DURATION: 'reachFiveTransitionCookieDuration',
    IS_REACHFIVE_SESSION_FORCED_AUTH: 'isReachFiveSessionForcedAuth',
    IS_REACH5_THEME_ACTIVE: 'isReach5ThemeActive',
    REACH5_DOMAIN: 'reach5Domain',
    REACH5_API_KEY: 'reach5ApiKey',
    REACH5_CLIENT_SECRET: 'reach5ClientSecret',
    REACHFIVE_PROVIDER_ID: 'reachFiveProviderId',
    IS_REACHFIVE_FAST_REGISTER: 'isReachFiveFastRegister',
    IS_REACHFIVE_LOGIN_ALLOWED: 'isReachFiveLoginAllowed',
    IS_REACHFIVE_EMAIL_AS_LOGIN: 'isReachFiveEmailAsLogin',
    IS_REACHFIVE_RETURN_PROVIDER_TOKEN: 'isReachFiveReturnProviderToken',
    REACH5_MANAGEMENT_API_KEY: 'reach5ManagementApiKey',
    REACH5_MANAGEMENT_CLIENT_SECRET: 'reach5ManagementClientSecret',
    REACH5_MANAGEMENT_SCOPE: 'reach5ManagementScope',
    REACH5_PROFILE_FIELDS_JSON: 'reach5ProfileFieldsJSON',
    REACH5_UI_SDK_URL: 'reach5UiSdkUrl',
    REACH5_CORE_SDK_URL: 'reach5CoreSdkUrl',
    REACH5_SUPPORTED_LANGUAGE_CODES: 'reach5SupportedLanguageCodes',
    REACH5_DEFAULT_LANGUAGE_CODE: 'reach5DefaultLanguageCode',
    REACH5_DEFAUL_LANGUAGE_CODE: 'reach5DefaulLanguageCode', // Deprecated
    REACHFIVE_CHECK_CREDENTIALS: 'reachFiveCheckCredentials'
};

/**
 * Retrieves a custom preference value from the current site.
 *
 * @param {string} key - The preference key.
 * @returns {Object|string} - The preference value.
 */
function getPreference(key) {
    return currentSite.getCustomPreferenceValue(key);
}

/**
 * Retrieves and parses a JSON custom preference value.
 *
 * @param {string} key - The preference key.
 * @returns {Object|null} - The parsed JSON object or null if parsing fails.
 */
function getJsonPreference(key) {
    const jsonStr = getPreference(key);
    try {
        return JSON.parse(jsonStr);
    } catch (error) {
        LOGGER.error('Error while parsing site preference "{0}": {1}', key, error);
        return null;
    }
}

/**
 * Retrieves an enum custom preference value.
 *
 * @param {string} key - The preference key.
 * @returns {string} - The enum value or an empty string if not found.
 */
function getEnumPreference(key) {
    const prefEnum = getPreference(key);
    return prefEnum ? prefEnum.getValue() : '';
}

/**
 * @constructor
 * @classdesc Manages ReachFive site preferences.
 * @returns {ReachFiveSettings} - The ReachFive settings object.
 */
function Settings() {
    Object.defineProperties(this, {
        isReachFiveEnabled: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_ENABLED) },
        isReachFiveTransitionActive: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_TRANSITION_ACTIVE) },
        reachFiveTransitionCookieDuration: { get: () => getPreference(PREFERENCE_KEYS.REACHFIVE_TRANSITION_COOKIE_DURATION) },
        isReachFiveSessionForcedAuth: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_SESSION_FORCED_AUTH) },
        isReach5ThemeActive: { get: () => getPreference(PREFERENCE_KEYS.IS_REACH5_THEME_ACTIVE) },
        reach5Domain: { get: () => getPreference(PREFERENCE_KEYS.REACH5_DOMAIN) },
        reach5ApiKey: { get: () => getPreference(PREFERENCE_KEYS.REACH5_API_KEY) },
        reach5ClientSecret: { get: () => getPreference(PREFERENCE_KEYS.REACH5_CLIENT_SECRET) },
        reachFiveProviderId: { get: () => getPreference(PREFERENCE_KEYS.REACHFIVE_PROVIDER_ID) },
        isReachFiveFastRegister: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_FAST_REGISTER) },
        isReachFiveLoginAllowed: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_LOGIN_ALLOWED) },
        isReachFiveEmailAsLogin: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_EMAIL_AS_LOGIN) },
        isReachFiveReturnProviderToken: { get: () => getPreference(PREFERENCE_KEYS.IS_REACHFIVE_RETURN_PROVIDER_TOKEN) },
        reach5ManagementApiKey: { get: () => getPreference(PREFERENCE_KEYS.REACH5_MANAGEMENT_API_KEY) },
        reach5ManagementClientSecret: { get: () => getPreference(PREFERENCE_KEYS.REACH5_MANAGEMENT_CLIENT_SECRET) },
        reach5ManagementScope: { get: () => getPreference(PREFERENCE_KEYS.REACH5_MANAGEMENT_SCOPE) },
        reach5ProfileFieldsJSON: { get: () => getJsonPreference(PREFERENCE_KEYS.REACH5_PROFILE_FIELDS_JSON) },
        reach5UiSdkUrl: { get: () => getPreference(PREFERENCE_KEYS.REACH5_UI_SDK_URL) },
        reach5CoreSdkUrl: { get: () => getPreference(PREFERENCE_KEYS.REACH5_CORE_SDK_URL) },
        reach5SupportedLanguageCodes: { get: () => getPreference(PREFERENCE_KEYS.REACH5_SUPPORTED_LANGUAGE_CODES) },
        reach5DefaultLanguageCode: { get: () => getPreference(PREFERENCE_KEYS.REACH5_DEFAULT_LANGUAGE_CODE) },
        reach5DefaulLanguageCode: { get: () => getPreference(PREFERENCE_KEYS.REACH5_DEFAUL_LANGUAGE_CODE) }, // Deprecated
        reachFiveCheckCredentials: { get: () => getEnumPreference(PREFERENCE_KEYS.REACHFIVE_CHECK_CREDENTIALS) }
    });
    return this;
}

module.exports = new Settings();
