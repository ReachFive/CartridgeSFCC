'use strict';

var LOGGER = require('dw/system/Logger').getLogger('reachfive');

/**
 * Called after a customer was updated.
 *
 * @param {dw.customer.Customer} customer - The customer to be updated.
 * @param {Partial<dw.customer.Customer>} customerInput - CustomerRegistration - The input customer containing the patch changes.
 * @returns {dw.system.Status|void} A non-null Status ends the hook execution.
 */
exports.afterPATCH = (customer, customerInput) => {
    LOGGER.debug('Hook Customer updated: {0}', customer.profile.email);
};

/**
 * Called after a new customer registration.
 *
 * @param {dw.customer.Customer} customer - The registered customer.
 * @param {Partial<dw.customer.Customer>} registration - CustomerRegistration - The customer registration information.
 * @returns {dw.system.Status|void} A non-null Status ends the hook execution.
 */
exports.afterPOST = (customer, registration) => {
    LOGGER.debug('Hook Customer registration: {0}', customer.profile.email);
};