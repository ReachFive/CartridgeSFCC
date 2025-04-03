'use strict';
/* Global pay attention: returns a non-null Status ends the hook execution */

var LOGGER = require('dw/system/Logger').getLogger('reachfive');

/**
 * Called after the customer has been authenticated.
 *
 * @param {dw.customer.Customer} customer - The authenticated customer.
 * @param {dw.value.EnumValue} authRequestType - Specifies if the request is for guest, login, or refresh authentication.
 * @returns {dw.system.Status|void} A non-null Status ends the hook execution.
 */
exports.afterPOST = (customer, authRequestType) => {
    LOGGER.debug('Hook auth post: {0}', customer.profile.email);
};

/**
 * Called before the customer has been authenticated.
 *
 * @param {string} authorizationHeader - The authorization header.
 * @param {dw.value.EnumValue} authRequestType - Specifies if the request is for guest, login, or refresh authentication.
 * @returns {dw.system.Status|void} A non-null Status ends the hook execution.
 */
exports.beforePOST = (authorizationHeader, authRequestType) => {
    LOGGER.debug('Hook before post: {0}', customer.profile.email);
};

/**
 * Modifies the POST response.
 *
 * @param {dw.customer.Customer} customer - The authenticated customer.
 * @param {Object} customerResponse - The customer response object.
 * @param {dw.value.EnumValue} authRequestType - Specifies if the request is for guest, login, or refresh authentication.
 * @returns {dw.system.Status|void} A non-null Status ends the hook execution.
 */
exports.modifyPOSTResponse = (customer, customerResponse, authRequestType) => {
    // Your implementation here
};