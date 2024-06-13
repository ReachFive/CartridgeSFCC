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

module.exports = server.exports();
