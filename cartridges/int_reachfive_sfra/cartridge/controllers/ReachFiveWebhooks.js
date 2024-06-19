'use strict';

var server = require('server');
var CustomerMgr = require('dw/customer/CustomerMgr');
var libReachFiveSynchronization = require('~/cartridges/int_reachfive/cartridge/scripts/libReachFiveSynchronization');

server.post('UpdateUser', function (req, res, next) {
    var webhookData;
    try {
        webhookData = JSON.parse(req.body);
    } catch (e) {
        res.setStatusCode(400);
        res.json({ error: 'Invalid JSON' });
        return next();
    }

    var reachFiveUser = webhookData.user;
    var reach5ObjType = webhookData.event_type; 
    var profileFieldsObj = {
        email: 'email',
        phone: 'phoneMobile',
        firstName: 'firstName',
        lastName: 'lastName'
    }; 

    if (!reachFiveUser || !reach5ObjType) {
        res.setStatusCode(400);
        res.json({ error: 'Missing data' });
        return next();
    }

    var customer = CustomerMgr.getCustomerByCustomerNumber(reachFiveUser.id);
    if (!customer) {
        res.setStatusCode(404);
        res.json({ error: 'Customer not found' });
        return next();
    }

    var profile = customer.getProfile();
    if (!profile) {
        res.setStatusCode(404);
        res.json({ error: 'Profile not found' });
        return next();
    }

    libReachFiveSynchronization.updateSFCCProfile(profileFieldsObj, profile, reachFiveUser, reach5ObjType);

    res.setStatusCode(200);
    res.json({ success: true });

    return next();
});

module.exports = server.exports();
