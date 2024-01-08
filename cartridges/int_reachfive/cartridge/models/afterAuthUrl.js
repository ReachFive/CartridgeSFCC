'use strict';

var ENDPOINTS = {
    1: 'Account-Show',
    2: 'Checkout-Begin'
};

/**
 * @constructor
 * @classdesc Profile data model
 */
function AfterUrl() {
    this.ENDPOINTS = ENDPOINTS;
}

AfterUrl.prototype = {
    /**
     * Creates redirect url after login/registration
     * @param {string|undefined} redirectUrl - rurl of the req.querystring
     * @param {Object} privacyCache - req.session.privacyCache
     * @param {boolean} newlyRegisteredUser - type of account action
     * @returns {string} redirect url
     */
    getLoginRedirectURL: function (redirectUrl, privacyCache, newlyRegisteredUser) {
        var URLUtils = require('dw/web/URLUtils');

        var endpoint = ENDPOINTS[1];
        var result;
        var targetEndPoint = redirectUrl
            ? parseInt(redirectUrl, 10)
            : 1;

        var registered = newlyRegisteredUser ? 'submitted' : 'false';

        var argsForQueryString = privacyCache.get('args');

        if (targetEndPoint && this.ENDPOINTS[targetEndPoint]) {
            endpoint = this.ENDPOINTS[targetEndPoint];
        }

        if (argsForQueryString) {
            result = URLUtils.url(endpoint, 'registration', registered, 'args', argsForQueryString).relative().toString();
        } else {
            result = URLUtils.url(endpoint, 'registration', registered).relative().toString();
        }

        return result;
    },
    /**
     * return rurl value for correct redirection
     * @param {string} endpoint controller endpoint
     * @returns {string} rurl value
     */
    getRurlValue: function (endpoint) {
        var reversed = {};
        var rurl = '1'; // Account-Show
        var keys = Object.keys(this.ENDPOINTS);

        keys.forEach(function (key) {
            reversed[this[key]] = key;
        }, this.ENDPOINTS);

        if (endpoint && reversed[endpoint]) {
            rurl = '' + reversed[endpoint];
        }

        return rurl;
    },
    /**
     * Determinate does any actions require after login/register
     * @param {string|undefined} rurl - querystring rurl action value
     * @returns {boolean} result of check
     */
    isHandlerActionRequire: function (rurl) {
        var result = false;
        if (rurl === '2') { // Checkout-Begin
            result = true;
        }

        return result;
    }
};

module.exports = new AfterUrl();
