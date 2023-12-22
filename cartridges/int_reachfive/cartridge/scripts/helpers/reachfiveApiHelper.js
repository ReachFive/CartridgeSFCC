'use strict';

// var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');

/**
 * @description Login with reachfive password interface
 * @param {string} email - reachfive customer login
 * @param {string} password - reachfive customer password
 * @returns {Object} prepared result object
 */
function loginWithPassword(email, password) {
    var requestObj = {
        email: email,
        password: password
    };

    var result = reachFiveService.passwordLogin(requestObj);

    return result;
}

// TODO: obviously that this function should be refactored after splitting Reachfvie helper
/**
 * @description Signup with login and password interface
 * @param {Object} credentialsObj - Object with credentials data
 * @param {string} [credentialsObj.email] - Customer email
 * @param {string} [credentialsObj.phone_number] - Customer phone number
 * @param {string} [credentialsObj.custom_identifier] - Customer custom identifier
 * @param {string} credentialsObj.password - Customer password
 * @param {Object} profile - Customer profile data
 * @returns {Object} Signup result
 */
function signUp(credentialsObj, profile) {
    var login = credentialsObj.email;
    var password = credentialsObj.password;

    var result = reachFiveService.signUp(login, password, profile);

    return result;
}

module.exports.loginWithPassword = loginWithPassword;
module.exports.signUp = signUp;
