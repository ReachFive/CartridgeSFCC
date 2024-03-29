'use strict';

var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');

var reachFiveServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/reachFiveInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

function execute() {
}

function read () {
    var customer = CustomerMgr.queryProfiles('custom.toDelete = true', 'creationDate desc');
    LOGGER.warn(customer)
    if (customer) {
        try {
            var result = reachFiveServiceInterface.deleteUser(customer);
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