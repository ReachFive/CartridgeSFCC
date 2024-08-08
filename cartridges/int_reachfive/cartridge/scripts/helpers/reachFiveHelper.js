/* eslint-disable indent */
/* eslint-disable no-use-before-define */

// TODO: After refactoring this helper should be splitted by 3 module
// TODO: 1. Preferences model
// TODO: 2. API interface helper (all interfaces of the API calls)
// TODO: 3. Functions helper (real helpers for code and frequently used functions)
'use strict';

var Encoding = require('dw/crypto/Encoding');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');
var Cookie = require('dw/web/Cookie');
var Resource = require('dw/web/Resource');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var StringUtils = require('dw/util/StringUtils');

var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');



/**
 * @function
 * @description Return reach five cookie name
 * @return {string} cookie name
 * */
 function getReachFiveCookieName() {
    return 'r5.conversion';
}

/**
 * @function
 * @description Return reach five user custom object type
 * @return {string} cookie name
 * */
function getReachFiveUserCustomObjectType() {
    return 'ReachFiveUserUpdate';
}

/**
 * @function
 * @description Return reach five login cookie name
 * @return {string} cookie name
 * */
 function getReachFiveLoginCookieName() {
    return 'r5.login';
}

/**
 * @function
 * @description is Reach Five Transition Active
 * @return {boolean} True or False
 * */
 function isReachFiveTransitionActive() {
    return getReachFivePreferences('isReachFiveTransitionActive');
}

/**
 * @function
 * @description is Reach Five enabled
 * @return {boolean} True or False
 * */
function isReachFiveEnabled() {
    return getReachFivePreferences('isReachFiveEnabled');
}

/**
 * @function
 * @description get reach five Theme
 * @return {string} Reachfive theme name
 * */
function getReachFiveTheme() {
    return getReachFivePreferences('isReach5ThemeActive') ? 'light' : '';
}

/**
 * @function
 * @description Get Reach Five Domain
 * @return {string} Reachfive domain
 * */
function getReachFiveDomain() {
    return getReachFivePreferences('reach5Domain');
}

/**
 * @function
 * @description Get Reach Five API KEY
 * @return {string} Reach Five API KEY
 * */
function getReachFiveApiKey() {
    return getReachFivePreferences('reach5ApiKey');
}


/**
 * @function
 * @description Get Reach Five provider ID
 * @return {string} Reach Five provider ID
 * */
function getReachFiveProviderId() {
    return getReachFivePreferences('reachFiveProviderId');
}

/**
 * @function
 * @description Get Reach Five fast register preferences
 * @return {string} Reach Five fast register preferences
 * */
function isFastRegister() {
    return getReachFivePreferences('isReachFiveFastRegister');
}

/**
 * @function
 * @description Get Reach Five Client Secret
 * @return {string} Reach Five Client Secret
 * */
function getReachFiveClientSecret() {
    return getReachFivePreferences('reach5ClientSecret');
}

/**
 * @function
 * @description Get Reach Five UI SDK URL
 * Details about ReachFive UI SDK:
 * https://www.npmjs.com/package/@reachfive/identity-ui
 * https://developer.reachfive.com/sdk-ui/index.html
 * @return {string} Reach Five UI SDK URL
 * */
function getReachFiveUiSdkUrl() {
    return getReachFivePreferences('reach5UiSdkUrl');
}

/**
 * @function
 * @description Get Reach Five Core SDK URL
 * Details about ReachFive Core SDK:
 * https://www.npmjs.com/package/@reachfive/identity-core
 * https://developer.reachfive.com/sdk-core/index.html
 * @return {string} Reach Five Core SDK URL
 * */
function getReachFiveCoreSdkUrl() {
    return getReachFivePreferences('reach5CoreSdkUrl');
}

/**
 * @function
 * @description check if external field exists and not null
 * @param {Object} externalProfile External profil object
 * @param {string} key Field's key
 * @return {boolean} True if a value is found for the field
 * */
function isFieldExist(externalProfile, key) {
    return !!externalProfile[key];
}

/**
 * @function
 * @description return an encoded String as URL Safe Base64. Note: This function encodes to the RFC 4648 Spec where '+' is encoded  as '-' and '/' is encoded as '_'. The padding character '=' is removed.
 * @param {string} key Key to encode
 * @return {string} encoded key value
 */
function encodeBase64UrlSafe(key) {
    
    if (!key) {
        return null;
    }
    var encodedString = Encoding.toBase64(key);
    return encodedString.replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_') // Convert '/' to '_'
    .replace(/=+$/, ''); // Remove ending '='
}

/**
 * @function
 * @description return an decoded Bytes from a Base64 ecoded String.
 * @param {string} idToken Token to encode
 * @return {string} decoded token value
 */
function reachFiveTokenDecode(idToken) {
    var partsofidtoken = idToken.split('.')[1];
    if (!partsofidtoken) {
        return null;
    }
    var decodedString = Encoding.fromBase64(partsofidtoken);
    return decodedString;
}

/**
 * @function
 * @description is Reach Five Login Allowed
 * @return {boolean} True or False
 * */
function isReachFiveLoginAllowed() {
    return getReachFivePreferences('isReachFiveLoginAllowed');
}

/**
 * @function
 * @description check if it's a fresh timestamp (for ex. less than 2 minutes) and that the signature matches the generated one.
 * @param {string} signinTimestamp Timestamp value
 * @return {boolean} True or False
 */
function compareTimestamp(signinTimestamp) {
    var now = new Calendar();
    // eslint-disable-next-line no-new-wrappers
    var dateSigninTimestamp = new Date(new Number(signinTimestamp) * 1000);
    var calendarSigninTimestamp = new Calendar(dateSigninTimestamp);
    // less than 2 minutes
    now.add(Calendar.MINUTE, 2);
    return calendarSigninTimestamp.compareTo(now) < 0;
}

/**
 * @function
 * @description Get custom preference value
 * @param {string} key Key of the preference to get the value from
 * @return {mixed} value from the key
 * */
function getReachFivePreferences(key) {
    return Site.getCurrent().getCustomPreferenceValue(key);
}

/**
 * @function
 * @description Get Reach Five MANAGEMENT API KEY
 * @return {string} Reach Five MANAGEMENT API KEY
 * */
function getReachFiveManagementApiKey() {
    return getReachFivePreferences('reach5ManagementApiKey');
}

/**
 * @function
 * @description Get Reach Five Management Client Secret
 * @return {string} Reach Five Management Client Secret
 * */
function getReachFiveManagementClientSecret() {
    return getReachFivePreferences('reach5ManagementClientSecret');
}

/**
 * @function
 * @description Get Reach Five Management Scope
 * @return {string} Reach Five Management Scope
 * */
function getReachFiveManagementScope() {
    return getReachFivePreferences('reach5ManagementScope');
}

/**
 * @function
 * @description Get Reach Five Profile fields JSON
 * @return {string} Reach Five JSON which contains fields to synchronize and mapping between SFCC and ReachFive profile fields
 * */
function getReachFiveProfileFieldsJSON() {
    return getReachFivePreferences('reach5ProfileFieldsJSON');
}

/**
 * @function
 * @description Is Reach Five forced authentification from any page allowed
 * @return {boolean} Is Reach Five session forced auth
 * */
 function isReachFiveSessionForcedAuth() {
    return getReachFivePreferences('isReachFiveSessionForcedAuth');
}


/**
 * @function
 * @description Gets Reach Five language code. If current language code is not supported then default code will be returned
 * @return {string} The language lowercase ISO 639-1 code
 */
function getReachFiveLanguageCode() {
    var currentLanguageCode = Locale.getLocale(request.getLocale()).getLanguage();

    var supportedReachFiveLanguageCodes = getReachFivePreferences('reach5SupportedLanguageCodes');
    var defaultLanguageCode = getReachFivePreferences('reach5DefaulLanguageCode') || 'en';

    if (supportedReachFiveLanguageCodes && supportedReachFiveLanguageCodes.length && supportedReachFiveLanguageCodes.indexOf(currentLanguageCode) > -1) {
        return currentLanguageCode;
    }

    return defaultLanguageCode;
}

/**
 * @function
 * @description Send SFCC locale in order to be retrieve by the ReachFive
 * @return {string} The country lowercase ISO 639-1 code
 */
function getReachFiveLocaleCode() {
    var localeCode = Locale.getLocale(request.getLocale()).getCountry();
    return localeCode;
}

/**
 * @function
 * @description Get Reach Five Conversion period value based on request cookie and preference. True - no changes. False - change flow.
 * @return {boolean} True or False
 * */
 function getReachFiveConversionMute() {
    // Check sitepreferense of the R5 conversion period
        // If disabled - set r5conversion variable true (do not change flow)
        // If enable - check cookie
            // If cookie does not exist - set r5conversion variable false (change flow, need to show normal login instead R5)
            // If cookie exist - set r5conversion variable true (do not change flow)
    var reachFiveConversion = true;
    if (isReachFiveTransitionActive()) {
        var r5Cookie = request.httpCookies[getReachFiveCookieName()];
        if (r5Cookie) {
            reachFiveConversion = r5Cookie.value === '1';
        } else {
            reachFiveConversion = false;
        }
    }
    return reachFiveConversion;
}

/**
 * @function
 * @description Set Reach Five Conversion period cookie.
 * @return {void}
 * */
 function setReachFiveConversionCookie() {
    if (isReachFiveTransitionActive()) {
        var cookie = new Cookie(getReachFiveCookieName(), '1');
        var CONVERSION_COOKIE_AGE = getReachFivePreferences('reachFiveTransitionCookieDuration') * 24 * 60 * 60;
        cookie.setPath('/');
        cookie.setMaxAge(CONVERSION_COOKIE_AGE);

        response.addHttpCookie(cookie);
    }
}

/**
 * @function
 * @description Set Reach Five Login period cookie.
 * @return {void}
 * */
 function setReachFiveLoginCookie() {
    var cookie = new Cookie(getReachFiveLoginCookieName(), '1');
    var CONVERSION_COOKIE_AGE = getReachFivePreferences('reachFiveLoginCookieDuration') * 24 * 60 * 60;
    cookie.setPath('/');
    cookie.setMaxAge(CONVERSION_COOKIE_AGE);

    response.addHttpCookie(cookie);
}

/**
 * @function
 * @description Create profile update R5 request Obj from SG form
 * @param {Object} customerForm Customer form
 * @return {Object} request object
 * */
function getProfileRequestObjFromForm(customerForm) {
    var birthdate = customerForm.get('birthday').value();
    var requestObj = {
        name: customerForm.get('firstname').value() + ' ' + customerForm.get('lastname').value(),
        given_name: customerForm.get('firstname').value(),
        family_name: customerForm.get('lastname').value(),
        birthdate: birthdate ? StringUtils.formatCalendar(new Calendar(birthdate), 'yyyy-MM-dd') : null
    };

    // TODO: Update consents suppose to changes in SG cartridge because current customer status does not fill on storefront from profile

    return requestObj;
}



/**
 * @function
 * @description Prepare BASE64 string object for redirect
 * @param {string} redirectURL redirect url
 * @param {string} action Controller endpoint action
 * @param {boolean} [handleCustomerRoute] handle flag
 * @return {string} result
 * */
function getStateObjBase64(redirectURL, action, handleCustomerRoute, data) {
    var stateObj = {
        redirectURL: redirectURL,
        action: action
    };

    if (handleCustomerRoute) {
        stateObj.handleCustomerRoute = handleCustomerRoute;
    }

    //Put the data query param as a JSON object in the state
    if (data) {
        stateObj.data = data;
    }

    return dwStringUtils.encodeBase64(JSON.stringify(stateObj));
}


/**
 * @function
 * @description Create ReachFive login redirect url for Storefront action
 * @param {string} tkn The one-time use authentication token
 * @param {string} stateTarget state object url
 * @return {string|null} result
 * */
function createLoginRedirectUrl(tkn, stateTarget) {
    var querystring = '';
    var PROTOCOL = 'https';
    var domain = getReachFiveDomain();
    var ENDPOINT = 'oauth/authorize';
    var url = PROTOCOL + '://' + domain + '/' + ENDPOINT;

    var queryObj = {
        client_id: getReachFiveApiKey(),
        scope: 'openid profile email phone full_write',
        response_type: 'code',
        redirect_uri: URLUtils.https('ReachFiveController-CallbackReachFiveRequest').toString(),
        origin: Site.getCurrent().getID(),
        display: 'page'
    };

    var queryObjEncoded = {};
    Object.keys(queryObj).forEach(function (key) {
        queryObjEncoded[key] = encodeURIComponent(queryObj[key]);
    });

    // No need additional encoding
    queryObjEncoded.state = getStateObjBase64(stateTarget);
    queryObjEncoded.tkn = tkn;

    Object.keys(queryObjEncoded).forEach(function (key) {
        querystring += '&' + key + '=' + queryObjEncoded[key];
    });

    // Remove first '&' symbol
    querystring = querystring.substring(1);

    url = url + '?' + querystring;

    return url;
}

/**
 * @function
 * @description Checks/updates the current tokens from the session for a 5 minute horizon
 * @param {boolean} [updateFlag] is update access token required
 * @return {Object} result
 * */
function verifySessionAccessTkn(updateFlag) {
    var Resource = require('dw/web/Resource');
    var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
    var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');
    var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
    var status = {
        success: false,
        msg: Resource.msg('reachfive.access_tkn.expired', 'reachfive', null)
    };

    var updateToken = true;
    if (typeof updateFlag !== 'undefined') {
        updateToken = updateFlag;
    }

    var reachfiveSession = new ReachfiveSessionModel();

    if (reachfiveSession.isAccessToken5MinLimit() || reachfiveSession.isAccessTokenExpired()) {
        if (reachfiveSession.refresh_token) {
            var tokenObj = reachFiveService.retrieveAccessTokenWithRefresh(reachfiveSession.refresh_token);

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
    } else {
         status.success = true;
    }

    return status;
}








/**
 * Export modules
 * */
module.exports.getReachFiveDomain = getReachFiveDomain;
module.exports.getReachFiveApiKey = getReachFiveApiKey;
module.exports.getReachFiveClientSecret = getReachFiveClientSecret;
module.exports.getReachFiveProviderId = getReachFiveProviderId;
module.exports.isReachFiveEnabled = isReachFiveEnabled;
module.exports.isReachFiveTransitionActive = isReachFiveTransitionActive;
module.exports.getReachFiveTheme = getReachFiveTheme;
module.exports.getReachFiveUiSdkUrl = getReachFiveUiSdkUrl;
module.exports.getReachFiveCoreSdkUrl = getReachFiveCoreSdkUrl;
module.exports.isFastRegister = isFastRegister;
module.exports.isFieldExist = isFieldExist;
module.exports.encodeBase64UrlSafe = encodeBase64UrlSafe;
module.exports.compareTimestamp = compareTimestamp;
module.exports.getReachFivePreferences = getReachFivePreferences;
module.exports.reachFiveTokenDecode = reachFiveTokenDecode;
module.exports.isReachFiveLoginAllowed = isReachFiveLoginAllowed;
module.exports.getReachFiveManagementApiKey = getReachFiveManagementApiKey;
module.exports.getReachFiveManagementClientSecret = getReachFiveManagementClientSecret;
module.exports.getReachFiveManagementScope = getReachFiveManagementScope;
module.exports.getReachFiveProfileFieldsJSON = getReachFiveProfileFieldsJSON;
module.exports.getReachFiveLanguageCode = getReachFiveLanguageCode;
module.exports.getReachFiveLocaleCode = getReachFiveLocaleCode;
module.exports.getReachFiveConversionMute = getReachFiveConversionMute;
module.exports.setReachFiveConversionCookie = setReachFiveConversionCookie;
module.exports.isReachFiveSessionForcedAuth = isReachFiveSessionForcedAuth;
module.exports.getProfileRequestObjFromForm = getProfileRequestObjFromForm;
module.exports.getReachFiveCookieName = getReachFiveCookieName;
module.exports.getReachFiveLoginCookieName = getReachFiveLoginCookieName;
module.exports.setReachFiveLoginCookie = setReachFiveLoginCookie;
module.exports.getReachFiveUserCustomObjectType = getReachFiveUserCustomObjectType;
module.exports.getStateObjBase64 = getStateObjBase64;
module.exports.createLoginRedirectUrl = createLoginRedirectUrl;
module.exports.verifySessionAccessTkn = verifySessionAccessTkn;
