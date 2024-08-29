'use strict';

var server = require('server');
var LOGGER = require('dw/system/Logger').getLogger('reachfive');

var salesforceInterface = require('~/cartridge/scripts/interfaces/salesforceInterface');

server.post('DeleteUser', server.middleware.https, function(req, res, next) {
    var payload = req.httpParameterMap.getRequestBodyAsString();

    try {
        var eventData = JSON.parse(payload);
        var userId = eventData.user.id; 

        var customerProfile = salesforceInterface.findCustomerProfileByExternalID("ReachFive", userId);
        if (customerProfile) {
            var result = salesforceInterface.deleteCustomerUsingOCAPI(customerProfile.getCustomer())
        } else {
            LOGGER.warn("No profil finded");
        }

        res.setStatusCode(204);
        res.json({});
    } catch (e) {
        LOGGER.error("Error when webhook is processing : " + e.toString());
        res.setStatusCode(500);
        res.json({ error: e.toString() });
    }

    next();
});

server.post('DeleteUser', server.middleware.https, function(req, res, next) {
    var payload = req.httpParameterMap.getRequestBodyAsString();
    LOGGER.warn("payload" + payload);
    try {
        var eventData = JSON.parse(payload);
        var userId = eventData.user.id; 
        
        var customerProfile = salesforceInterface.findCustomerProfileByExternalID("ReachFive", userId);
        
        if (customerProfile) {
            Transaction.wrap(function() {
                LOGGER.warn("Utilisateur déconnecté (si possible)");
            });
            var result = salesforceInterface.deleteCustomerUsingOCAPI(customerProfile.getCustomer());
            res.setStatusCode(200);
        } else {
            LOGGER.warn("No profile found");
            res.setStatusCode(404);
            res.json({ error: 'No profile found' });
        }
    } catch (e) {
        LOGGER.error("Error when webhook is processing : " + e.toString());
        res.setStatusCode(500);
        res.json({ error: e.toString() });
    }

    next();
});

module.exports = server.exports();

