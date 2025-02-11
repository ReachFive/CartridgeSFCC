'use strict';

var server = require('server');
var LOGGER = require('dw/system/Logger').getLogger('reachfive');
var CustomerMgr = require('dw/customer/CustomerMgr');
var salesforceInterface = require('~/cartridge/scripts/interfaces/salesforceInterface');

// https://zzka-004.dx.commercecloud.salesforce.com/on/demandware.store/Sites-RefArch-Site/en_US/ReachFiveWebhooks-UpdateUser
server.post('UpdateUser', function (req, res, next) {
    var webhookData;
    try {
        webhookData = JSON.parse(req.body);
    } catch (e) {
        res.setStatusCode(400);
        res.json({ error: 'Invalid JSON' });
        LOGGER.error('Invalid JSON in webhook update user: {0}', e);
        return next();
    }

    var reachFiveUser = webhookData.user;
    var reach5ObjType = 'user';
    var profileFieldsObj = {
        user: {
            email: 'email',
            phone_number: 'phoneHome',
            given_name: 'firstName',
            family_name: 'lastName'
        }
    };

    if (!reachFiveUser || !reach5ObjType) {
        res.setStatusCode(400);
        res.json({ error: 'Missing data' });
        return next();
    }

    var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile('ReachFive', reachFiveUser.id);

    if (!profile) {
        res.setStatusCode(404);
        res.json({ error: 'Customer not found' });
        LOGGER.warn('Customer not found');
        return next();
    }

    salesforceInterface.updateSFCCProfile(profileFieldsObj, profile, reachFiveUser, reach5ObjType);

    res.setStatusCode(200);
    res.json({ success: true });

    return next();
});

server.post('DeleteUser', server.middleware.https, function (req, res, next) {
    var payload = req.httpParameterMap.getRequestBodyAsString();

    try {
        var eventData = JSON.parse(payload);
        var userId = eventData.user.id;

        var customerProfile = salesforceInterface.findCustomerProfileByExternalID('ReachFive', userId);
        if (customerProfile) {
            salesforceInterface.deleteCustomerUsingOCAPI(customerProfile.getCustomer());
        } else {
            LOGGER.warn('No profil finded');
        }

        res.setStatusCode(204);
        res.json({});
    } catch (e) {
        LOGGER.error('Error when webhook is processing : {0}', e);
        res.setStatusCode(500);
        res.json({ error: e ? e.toString() : '' });
    }

    next();
});

module.exports = server.exports();
