'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

server.append('CreateAccount', function (req, res, next) {
    var registrationObj = res.getViewData();

    if (Site.current.getCustomPreferenceValue('isReachFiveEnabled')
        && Object.hasOwnProperty.call(registrationObj, 'passwordForm')
        && registrationObj.passwordForm.valid) {
        var reachFiveCache = {
            email: registrationObj.email,
            password: registrationObj.password
        };

        res.setViewData({ reachFiveCache: reachFiveCache });

        this.on('route:Complete', function () {
            var data = res.getViewData();
            var authenticatedCustomer = data.newCustomer;

            if (authenticatedCustomer && data.passwordForm.valid) {
                var email = data.reachFiveCache.email;
                var password = data.reachFiveCache.password;

                // Sign up customer ReachFive account with same login and password
                var signUpResult = reachFiveService.signUp(email, password, authenticatedCustomer.profile);
                var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();

                if (signUpResult.ok) {
                    Transaction.wrap(function () {
                        authenticatedCustomer.createExternalProfile(reachFiveProviderId, signUpResult.object.id);
                    });
                    reachFiveHelper.setReachFiveConversionCookie();
                } else {
                    LOGGER.error('[Order-CreateAccount] ReachFive profile was not created because of: ' + signUpResult.errorMessage);
                    // TODO: Error during new customer registration need to be processed separatly
                    //      Potentially we could return some specific error and block logging
                    //      Or detect signUpResult.errorMessage and based on error display something
                }
            }

            delete data.reachFiveCache.email;
            delete data.reachFiveCache.password;
        });
    }

    return next();
});

module.exports = server.exports();
