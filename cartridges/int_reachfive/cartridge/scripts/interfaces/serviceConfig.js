'use strict';

/**
 * The API provides the operation to let developers handle the profile lifecycle. In order to use the API you have to obtain a long lived access token
 * Documentation here : https://developers.reach5.co/en/api-rest
 * */

/* eslint-disable no-use-before-define */
/* eslint-disable indent */

/**
 * API Includes
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
/**
 * Script Modules
 */
var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');

/**
 * Constructs and configures a service with a callback.
 * @param {string} serviceName Service Name
 * @param {Object} [substObj] Replaceable value object
 * @returns {dw.svc.HTTPService} Service Object
 */
function configureService(serviceName, substObj) {
    return LocalServiceRegistry.createService(`${serviceName}`, {
        createRequest: function (svc, params) {
            svc.setAuthentication('NONE');
            svc.addHeader('Content-type', 'application/json');
            svc.addHeader('charset', 'UTF-8');

            var svcUrl = svc.configuration.credential.URL;

            if (svcUrl) {
                svcUrl = svcUrl.replace('{reach5Domain}', reachfiveSettings.reach5Domain);

                if (substObj && Object.keys(substObj).length !== 0) {
                    Object.keys(substObj).forEach(function (key) {
                        if (String.prototype.indexOf.call(svcUrl, '{' + key + '}') !== -1) {
                            svcUrl = svcUrl.replace('{' + key + '}', substObj[key]);
                        } else {
                            svcUrl += '&' + key + '=' + substObj[key];
                        }
                    });
                }

                svc.setURL(svcUrl);
            }

            return JSON.stringify(params);
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    });
}

/* Expose Methods */
exports.configureService = configureService;
