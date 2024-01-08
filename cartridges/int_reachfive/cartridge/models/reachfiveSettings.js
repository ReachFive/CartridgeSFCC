'use strict';

var currentSite = require('dw/system/Site').getCurrent();
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * @constructor
 * @classdesc Reachfive site preferences
 * @property {boolean} isReachFiveEnabled - is Reachfive enabled
 * @property {boolean} isReachFiveTransitionActive - is Reach Five Transition Active
 * @property {number} reachFiveTransitionCookieDuration - Reach Five Transition Cookie Duration
 * @property {boolean} isReachFiveSessionForcedAuth - Session Forced Authentication
 * @property {boolean} isReach5ThemeActive - Active or not default reach five theme
 * @property {string} reach5Domain - Reach Five Domain
 * @property {string} reach5ApiKey - Define the API KEY for the Identity API
 * @property {string} reach5ClientSecret - Define the Client Secret for the Identity API
 * @property {string} reachFiveProviderId - Reach Five provider ID
 * @property {boolean} isReachFiveFastRegister - is Reach Five Fast Register
 * @property {boolean} isReachFiveLoginAllowed - is Reach Five Login Allowed
 * @property {string} reach5ManagementApiKey - Define the API KEY for the Management API
 * @property {string} reach5ManagementClientSecret - Define the Client Secret for the Management API
 * @property {string} reach5ManagementScope - Reach Five Management scope
 * @property {json} reach5ProfileFieldsJSON - ReachFive profile fields JSON
 * @property {string} reach5UiSdkUrl - Web UI SDK Url
 * @property {string} reach5CoreSdkUrl - Web Core SDK Url
 * @property {Array} reach5SupportedLanguageCodes - Supported ReachFive LanguageCodes
 * @property {string} reach5DefaulLanguageCode - Default ReachFive LanguageCode
 * @property {string} reachFiveCheckCredentials - Check credentials method
 * @property {boolean} isReachFiveEmailAsLogin - Create profile with login as an email
 * @property {boolean} isReachFiveReturnProviderToken - Retrieve the provider token in the SFCC session
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
                return prefEnum.getValue() || '';
            }
        }
    });
}

module.exports = new Settings();
