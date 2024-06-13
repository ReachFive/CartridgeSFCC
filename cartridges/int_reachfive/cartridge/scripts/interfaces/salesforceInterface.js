'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var URLUtils = require('dw/web/URLUtils');

var CustomerMgr = require('dw/customer/CustomerMgr');
var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var bearer;

var ocapiService = ServiceRegistry.createService("reachfive.ocapiDeleteCustomer", {
    createRequest: function (svc, args) {
        var svcUrl = svc.configuration.credential.URL;
        svc.addHeader("Content-Type", "application/json");
        svc.addHeader("Authorization", "Bearer " + bearer);
        svc.setRequestMethod("DELETE");
        svc.setURL(svcUrl + args.listId + "/customers/" + args.customerNo);
    }, parseResponse: function (svc, client) {
        return client.text;
    },

    filterLogMessage: function(msg) {
        return msg;
    }
});

var ocapiOauth = ServiceRegistry.createService("reachfive.ocapiOauth", {
    createRequest: function (svc, args) {
        var clientId = args.clientId; 
        var clientPassword = args.clientPassword; 
        var credentials = clientId + ':' + clientPassword;
        var encodedCredentials = Encoding.toBase64(new Bytes(credentials));
        
        svc.addHeader('Authorization', 'Basic ' + encodedCredentials);
        svc.addHeader("Content-Type", "application/x-www-form-urlencoded");
        svc.setRequestMethod("POST");

        return "grant_type=client_credentials";
    },
    parseResponse: function (svc, client) {
        var response = JSON.parse(client.text);
        bearer = response.access_token;
        return response.access_token;
    }
});

/**
 * @function
 * @description Get Salesforce Ocapi access token
 * @param {string} clientId clientId
 * @param {string} clientPassword clientPassword
 * @return {Object} request result
 */
function getAccessToken(clientId, clientPassword) {
    var result = ocapiOauth.call({
        clientId: clientId,
        clientPassword: clientPassword
    });

    if (result.ok) {
        return result;
    } else {
        var error = result.errorMessage;
        LOGGER.error("Error getting access token: {0}", error);
        return null;
    }
}

/**
 * @function
 * @description Delete customer on Salesforce with Ocapi API
 * @param {Object} customer 
 * @return {Object} request result
 */
function deleteCustomerUsingOCAPI(customer) {
    var clientId = Site.getCurrent().getCustomPreferenceValue("ocapiTokenClientId");
    var clientPassword = Site.getCurrent().getCustomPreferenceValue("ocapiTokenClientPassword");
    var customerListId = CustomerMgr.getSiteCustomerList().ID; 
    var customerNo = customer.profile.getCustomerNo(); 
    var baseURL = Site.getCurrent().getCustomPreferenceValue('customInstanceURL');
    var accessToken = getAccessToken(clientId, clientPassword);
    var result = ocapiService.call({
        listId: customerListId,
        customerNo: customerNo
    });
    return result;
}

/**
 * Searches for the SFCC customer profile based on a ReachFive externalID and an authenticationProviderId.
 * @param {string} authenticationProviderId The ID of the authentication provider configured in SFCC.
 * @param {string} externalId The externalID provided by the ReachFive webhook.
 * @return {dw.customer.Profile} The corresponding SFCC customer profile, if found.
 */
function findCustomerProfileByExternalID(authenticationProviderId, externalId) {
    var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(authenticationProviderId, externalId);

    return profile;
}

/* Expose Methods */
exports.getAccessToken = getAccessToken;
exports.deleteCustomerUsingOCAPI = deleteCustomerUsingOCAPI;
exports.findCustomerProfileByExternalID = findCustomerProfileByExternalID;
