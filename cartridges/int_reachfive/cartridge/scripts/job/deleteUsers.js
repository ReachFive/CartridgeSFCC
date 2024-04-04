'use strict';

var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');

var reachFiveServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/reachFiveInterface');
var salesforceServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/salesforceInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

function execute() {
    var profileIterator = CustomerMgr.queryProfiles('custom.toDelete = true', 'creationDate desc');

    while (profileIterator.hasNext()) {
        var customerProfile = profileIterator.next();
        if (customerProfile.custom.toDelete) {
            var customer = customerProfile.getCustomer();
            if (customer && customer.registered) {
                try {
                    var result = reachFiveServiceInterface.deleteUser(customerProfile);
                    var ocapiResult = salesforceServiceInterface.deleteCustomerUsingOCAPI(customer);
                    if (result.ok && ocapiResult.ok) {
                        LOGGER.info("Client supprimé avec succès: " + customerProfile.customerNo);
                    }
                    else{
                        if(!result.ok){
                            LOGGER.warn("Problème lors de la suppression sur Reachfive du client : " + customerProfile.customerNo);
                        }
                        else{
                            LOGGER.warn("Problème lors de la suppression sur SFCC du client : " + customerProfile.customerNo);
                        }

                    }
                } catch (e) {
                    LOGGER.error("Erreur lors de la suppression du client: " + customerProfile.customerNo + ". Erreur: " + e.toString());
                }
            }
        }
    }
}

module.exports = {
    execute: execute
};