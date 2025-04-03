'use strict';

var Encoding = require('dw/crypto/Encoding');
var Calendar = require('dw/util/Calendar');
var Cookie = require('dw/web/Cookie');
var StringUtils = require('dw/util/StringUtils');
var {
    isReachFiveTransitionActive,
    getReachFivePreferences,
    getReachFiveCookieName,
    getReachFiveLoginCookieName,
    getReachFiveProviderId
} = require('*/cartridge/models/reachfiveSettings');

var { getStateData } = require('./utils');

/**
 * Check if external field exists and not null
 * @param {Object} externalProfile External profil object
 * @param {string} key Field's key
 * @return {boolean} True if a value is found for the field
 */
function isFieldExist(externalProfile, key) {
    return !!externalProfile[key];
}

/**
 * Return an encoded String as URL Safe Base64
 * @param {string} key Key to encode
 * @return {string|null} encoded key value
 */
function encodeBase64UrlSafe(key) {
    if (!key) {
        return null;
    }
    var encodedString = Encoding.toBase64(key);
    return encodedString
        .replace(/\+/g, '-') // Convert '+' to '-'
        .replace(/\//g, '_') // Convert '/' to '_'
        .replace(/=+$/, ''); // Remove ending '='
}

/**
 * Return an decoded Bytes from a Base64 encoded String
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
 * Check if it's a fresh timestamp (for ex. less than 2 minutes) and that the signature matches the generated one
 * @param {string} signinTimestamp Timestamp value
 * @return {boolean} True or False
 */
function compareTimestamp(signinTimestamp) {
    var now = new Calendar();
    var dateSigninTimestamp = new Date(Number(signinTimestamp) * 1000);
    var calendarSigninTimestamp = new Calendar(dateSigninTimestamp);
    now.add(Calendar.MINUTE, 2);
    return calendarSigninTimestamp.compareTo(now) <= 0;
}

/**
 * Prepare BASE64 string object for redirect
 * @param {string} redirectURL redirect url
 * @param {string} action Controller endpoint action
 * @param {boolean} [handleCustomerRoute] handle flag
 * @param {data} data Data object
 * @return {string} result
 */
function getStateObjBase64(redirectURL, action, handleCustomerRoute, data) {
    var stateObj = {
        redirectURL: redirectURL,
        action: action
    };

    if (handleCustomerRoute) {
        stateObj.handleCustomerRoute = handleCustomerRoute;
    }

    if (data) {
        stateObj.data = data;
    }

    return StringUtils.encodeBase64(JSON.stringify(stateObj));
}

/**
 * Create profile update R5 request Obj from SG form
 * @param {Object} customerForm Customer form
 * @return {Object} request object
 */
function getProfileRequestObjFromForm(customerForm) {
    var birthdate = customerForm.get('birthday').value();
    var requestObj = {
        name:
            customerForm.get('firstname').value()
            + ' '
            + customerForm.get('lastname').value(),
        given_name: customerForm.get('firstname').value(),
        family_name: customerForm.get('lastname').value(),
        birthdate: birthdate
            ? StringUtils.formatCalendar(new Calendar(birthdate), 'yyyy-MM-dd')
            : null
    };

    return requestObj;
}

/**
 * Get Reach Five Conversion period value based on request cookie and preference
 * @return {boolean} True or False
 */
function getReachFiveConversionMute() {
    var reachFiveConversion = true;
    if (isReachFiveTransitionActive) {
        var r5Cookie = request.getHttpCookies[getReachFiveCookieName()];
        if (r5Cookie) {
            reachFiveConversion = r5Cookie.value === '1';
        } else {
            reachFiveConversion = false;
        }
    }
    return reachFiveConversion;
}

/**
 * Set Reach Five Conversion period cookie
 * @return {void}
 */
function setReachFiveConversionCookie() {
    if (isReachFiveTransitionActive) {
        var cookie = new Cookie(getReachFiveCookieName(), '1');
        var CONVERSION_COOKIE_AGE = getReachFivePreferences('reachFiveTransitionCookieDuration')
            * 24
            * 60
            * 60;
        cookie.setPath('/');
        cookie.setMaxAge(CONVERSION_COOKIE_AGE);

        response.addHttpCookie(cookie);
    }
}

/**
 * Set Reach Five Login period cookie
 * @return {void}
 */
function setReachFiveLoginCookie() {
    var cookie = new Cookie(getReachFiveLoginCookieName(), '1');
    var CONVERSION_COOKIE_AGE = getReachFivePreferences('reachFiveLoginCookieDuration') * 24 * 60 * 60;
    cookie.setPath('/');
    cookie.setMaxAge(CONVERSION_COOKIE_AGE);

    response.addHttpCookie(cookie);
}

/**
 * Get Reach Five External Profile ID
 * @param {dw.customer.Profile} profile current Customer Profile
 * @return {string|null} Reach Five External Profile ID
 */
function getReachFiveExternalID(profile) {
    var externalProfiles = profile.customer.getExternalProfiles();
    var reachFiveProviderId = getReachFiveProviderId();

    var externalProfile = externalProfiles
        .toArray()
        .filter(function (extProfile) {
            return (
                extProfile
                && extProfile.externalID
                && extProfile.authenticationProviderID === reachFiveProviderId
            );
        });
    return externalProfile ? externalProfile[0].externalID : null;
}

module.exports = {
    getStateData,
    getReachFiveCookieName,
    getReachFiveLoginCookieName,
    isFieldExist,
    encodeBase64UrlSafe,
    reachFiveTokenDecode,
    compareTimestamp,
    getStateObjBase64,
    getProfileRequestObjFromForm,
    getReachFiveConversionMute,
    setReachFiveConversionCookie,
    setReachFiveLoginCookie,
    getReachFiveExternalID
};
