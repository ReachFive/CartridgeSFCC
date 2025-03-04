'use strict';

var CustomerMgr = require('dw/customer/CustomerMgr');
var reachFiveServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/reachFiveInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * Executes the job to delete user profiles marked for deletion.
 *
 * This function searches for customer profiles with the custom attribute `toDelete` set to true,
 * and attempts to delete them using the ReachFive service interface. It logs the result of each
 * deletion attempt.
 *
 * @returns {dw.system.Status} - The status of the job execution.
 */
function execute() {
    var profileIterator = CustomerMgr.searchProfiles('custom.toDelete = true', 'creationDate desc');

    while (profileIterator.hasNext()) {
        var customerProfile = profileIterator.next();
        if (customerProfile.custom.toDelete) {
            var customer = customerProfile.getCustomer();
            if (customer && customer.registered) {
                try {
                    var result = reachFiveServiceInterface.deleteUser(customerProfile);
                    if (result && result.ok) {
                        LOGGER.info('Customer successfully deleted: ' + customerProfile.customerNo);
                    } else if (!result || !result.ok) {
                        LOGGER.warn('Issue when deleting the profile on Reachfive: ' + customerProfile.customerNo);
                    } else {
                        LOGGER.warn('Issue when deleting the profile on SFCC : ' + customerProfile.customerNo);
                    }
                    return new dw.system.Status(dw.system.Status.OK, 'OK', 'Profiles processed successfully.');
                } catch (e) {
                    LOGGER.error('Issue when deleting the profile: {0}. Erreur: {1}', customerProfile.customerNo, e);
                }
            }
        }
    }
    return new dw.system.Status(dw.system.Status.OK, 'OK');
}

module.exports = {
    execute: execute
};
