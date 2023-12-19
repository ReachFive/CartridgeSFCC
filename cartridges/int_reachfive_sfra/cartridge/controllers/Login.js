'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Show', function (req, res, next) {
    var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
    var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');

    var context = {
        isReachFivePasswordReset: false,
        isReachFiveEnabled: false,
        isReachFiveLoginAllowed: false,
        isReachFiveTransitionActive: false,
        isReachFiveConversionMute: true
    };

    if (reachfiveSettings.isReachFiveEnabled) {
        context.isReachFiveEnabled = true;
        context.isReachFiveLoginAllowed = reachfiveSettings.isReachFiveLoginAllowed;
        context.isReachFiveTransitionActive = reachfiveSettings.isReachFiveTransitionActive;
        context.isReachFiveConversionMute = reachFiveHelper.getReachFiveConversionMute();

        if (req.httpParameterMap.isParameterSubmitted('verification_code')) {
            context.isReachFivePasswordReset = true;
        }
    }

    res.setViewData(context);

    return next();
});

module.exports = server.exports();
