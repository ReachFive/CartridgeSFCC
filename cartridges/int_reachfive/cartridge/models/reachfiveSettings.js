'use strict';

/**
 * @typedef {import('@types/reachFiveSettings')} ReachFiveSettings
 */

var currentSite = require('dw/system/Site').getCurrent();
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * @constructor
 * @classdesc Reachfive site preferences
 * @implements {ReachFiveSettings}
 */
function Settings() {
    Object.defineProperties(this, {
        isReachFiveEnabled: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveEnabled'); }
        },
        isReachFiveTransitionActive: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveTransitionActive'); }
        },
        reachFiveTransitionCookieDuration: {
            get: function () { return currentSite.getCustomPreferenceValue('reachFiveTransitionCookieDuration'); }
        },
        isReachFiveSessionForcedAuth: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveSessionForcedAuth'); }
        },
        isReach5ThemeActive: {
            get: function () { return currentSite.getCustomPreferenceValue('isReach5ThemeActive'); }
        },
        reach5Domain: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5Domain'); }
        },
        reach5ApiKey: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5ApiKey'); }
        },
        reach5ClientSecret: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5ClientSecret'); }
        },
        reachFiveProviderId: {
            get: function () { return currentSite.getCustomPreferenceValue('reachFiveProviderId'); }
        },
        isReachFiveFastRegister: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveFastRegister'); }
        },
        isReachFiveLoginAllowed: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveLoginAllowed'); }
        },
        isReachFiveEmailAsLogin: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveEmailAsLogin'); }
        },
        isReachFiveReturnProviderToken: {
            get: function () { return currentSite.getCustomPreferenceValue('isReachFiveReturnProviderToken'); }
        },
        reach5ManagementApiKey: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5ManagementApiKey'); }
        },
        reach5ManagementClientSecret: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5ManagementClientSecret'); }
        },
        reach5ManagementScope: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5ManagementScope'); }
        },
        reach5ProfileFieldsJSON: {
            get: function () {
                var jsonStr = currentSite.getCustomPreferenceValue('reach5ProfileFieldsJSON');
                var jsonObj = null;
                try {
                    jsonObj = JSON.parse(jsonStr);
                } catch (error) {
                    LOGGER.error('Error while parsing site preference "reach5ProfileFieldsJSON": {0}', error);
                }
                return jsonObj;
            }
        },
        reach5UiSdkUrl: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5UiSdkUrl'); }
        },
        reach5CoreSdkUrl: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5CoreSdkUrl'); }
        },
        reach5SupportedLanguageCodes: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5SupportedLanguageCodes'); }
        },
        reach5DefaulLanguageCode: {
            get: function () { return currentSite.getCustomPreferenceValue('reach5DefaulLanguageCode'); }
        },
        reachFiveCheckCredentials: {
            get: function () {
                var prefEnum = currentSite.getCustomPreferenceValue('reachFiveCheckCredentials');
                return prefEnum ? prefEnum.getValue() : '';
            }
        }
    });
}

module.exports = new Settings();
