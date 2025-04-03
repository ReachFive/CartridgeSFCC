'use strict';

const Site = require('dw/system/Site');
const LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
const Locale = require('dw/util/Locale');

// using xml2js
// perhaps we can add some script to check if we take all the preferences from
// Metadata/site_template/sites/RefArch/preferences.xml

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
    ENABLE_KAKAO_TALK_NAME_SPLIT: 'enableKakaoTalkNameSplit',
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
    if (!key || !key.length) {
        LOGGER.error('Error while retrieving site preference: key is missing.');
        return null;
    }
    return Site.getCurrent().getCustomPreferenceValue(key);
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
    return prefEnum && 'getValue' in prefEnum ? prefEnum.getValue() : '';
}

/**
 * Get Reach Five Theme
 * @return {string} Reachfive theme name
 */
function getReachFiveTheme() {
    return getPreference(PREFERENCE_KEYS.IS_REACH5_THEME_ACTIVE) ? 'light' : '';
}

/**
 * Gets Reach Five language code. If current language code is not supported then default code will be returned
 * @return {string} The language lowercase ISO 639-1 code
 */
function getReachFiveLanguageCode() {
    const currentLanguageCode = Locale.getLocale(request.getLocale()).getLanguage();
    const supportedReachFiveLanguageCodes = getPreference(PREFERENCE_KEYS.REACH5_SUPPORTED_LANGUAGE_CODES);
    const defaultLanguageCode = getPreference(PREFERENCE_KEYS.REACH5_DEFAULT_LANGUAGE_CODE) || 'en';

    if (supportedReachFiveLanguageCodes && supportedReachFiveLanguageCodes.length && supportedReachFiveLanguageCodes.indexOf(currentLanguageCode) > -1) {
        return currentLanguageCode;
    }

    return defaultLanguageCode;
}

/**
 * Send SFCC locale in order to be retrieve by the ReachFive
 * @return {string} The country lowercase ISO 639-1 code
 */
function getReachFiveLocaleCode() {
    return Locale.getLocale(request.getLocale()).getCountry();
}
/// <reference path="./node_modules/sfcc-dts/@types/sfcc/index.d.ts" />
/// <reference path="./../@types/dw/attrs.d.ts" />
/**
 * @typedef {import('./../@types/dw/attrs.d.ts')} SitePreferencesCustomAttributes
 */
/** @var {SitePreferencesCustomAttributes} */
var settings = Object.keys(PREFERENCE_KEYS).reduce((acc, key) => {
    let value;
    let sitePrefKey = PREFERENCE_KEYS[key];
    if (sitePrefKey.includes('reach5ProfileFieldsJSON')) {
        value = getJsonPreference(sitePrefKey);
    } else if (sitePrefKey.includes('CheckCredentials')) {
        value = getEnumPreference(sitePrefKey);
    } else {
        value = getPreference(sitePrefKey);
    }
    acc[sitePrefKey] = value;
    return acc;
}, {});

module.exports = {
    // like some const :
    getReachFiveCookieName: () => 'r5.conversion',
    getReachFiveLoginCookieName: () => 'r5.login',
    getReachFiveUserCustomObjectType: () => 'ReachFiveUserUpdate',
    // from site preferences
    enableKakaoTalkNameSplit: settings.enableKakaoTalkNameSplit,
    isReachFiveEnabled: settings.isReachFiveEnabled,
    isReachFiveTransitionActive: settings.isReachFiveTransitionActive,
    reachFiveTransitionCookieDuration: settings.reachFiveTransitionCookieDuration,
    isReachFiveSessionForcedAuth: settings.isReachFiveSessionForcedAuth,
    isReach5ThemeActive: settings.isReach5ThemeActive,
    reach5Domain: settings.reach5Domain,
    reach5ApiKey: settings.reach5ApiKey,
    reach5ClientSecret: settings.reach5ClientSecret,
    reachFiveProviderId: settings.reachFiveProviderId,
    isReachFiveFastRegister: settings.isReachFiveFastRegister,
    isReachFiveLoginAllowed: settings.isReachFiveLoginAllowed,
    isReachFiveEmailAsLogin: settings.isReachFiveEmailAsLogin,
    isReachFiveReturnProviderToken: settings.isReachFiveReturnProviderToken,
    reach5ManagementApiKey: settings.reach5ManagementApiKey,
    reach5ManagementClientSecret: settings.reach5ManagementClientSecret,
    reach5ManagementScope: settings.reach5ManagementScope,
    reach5ProfileFieldsJSON: settings.reach5ProfileFieldsJSON,
    reach5UiSdkUrl: settings.reach5UiSdkUrl,
    reach5CoreSdkUrl: settings.reach5CoreSdkUrl,
    reach5SupportedLanguageCodes: settings.reach5SupportedLanguageCodes,
    reach5DefaultLanguageCode: settings.reach5DefaultLanguageCode,
    reach5DefaulLanguageCode: settings.reach5DefaulLanguageCode,
    reachFiveCheckCredentials: settings.reachFiveCheckCredentials,
    getReachFivePreferences: getPreference,
    getReachFiveTheme,
    getReachFiveDomain: () => settings.reach5Domain,
    getReachFiveApiKey: () => settings.reach5ApiKey,
    getReachFiveProviderId: () => settings.reachFiveProviderId,
    isFastRegister: () => settings.isReachFiveFastRegister,
    getReachFiveClientSecret: () => settings.reach5ClientSecret,
    getReachFiveUiSdkUrl: () => settings.reach5UiSdkUrl,
    getReachFiveCoreSdkUrl: () => settings.reach5CoreSdkUrl,
    getReachFiveManagementApiKey: () => settings.reach5ManagementApiKey,
    getReachFiveManagementClientSecret: () => settings.reach5ManagementClientSecret,
    getReachFiveTransitionCookieDuration: () => settings.reachFiveTransitionCookieDuration,
    getReachFiveManagementScope: () => settings.reach5ManagementScope,
    getReachFiveProfileFieldsJSON: () => settings.reach5ProfileFieldsJSON,
    getReachFiveLanguageCode,
    getReachFiveLocaleCode
};
