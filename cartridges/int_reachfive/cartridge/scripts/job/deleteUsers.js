'use strict';

var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');

var reachFiveServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/reachFiveInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

function execute() {
}

function read () {
    var customers = CustomerMgr.queryProfiles('custom.toDelete = true', 'creationDate desc');

    if (customers) {
        try { 
            //var result = reachFiveServiceInterface.deleteUser(customer);
            while (customers.hasNext()) {
                var customerProfile = customers.next();
                var customer = customerProfile.getCustomer(); 
                if (customer && customer.registered && customerProfile.custom.toDelete) {
                    try {
                        var ocapiResult = reachFiveServiceInterface.deleteCustomerUsingOCAPI(customer);
                    } catch (e) {
                        Logger.error("Erreur lors de la suppression du client : " + customer.customerNo + ". Erreur : " + e.toString());
                    }
                }
                var customerProfile = customers.next();
            }
        } catch (e) {
            LOGGER.error("Erreur lors de la suppression du client : " + customerNo + ". Erreur : " + e.toString());
        }
    }
};

function process() {
   
};

function write () {

};



module.exports = {
    execute: execute,
    read: read,
    process: process,
    write: write
};