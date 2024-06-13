'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Transaction = require('dw/system/Transaction');
var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

server.prepend(
    'LoginCustomer',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        if (reachfiveSettings.isReachFiveEnabled && reachfiveSettings.isReachFiveTransitionActive) {
            var coRegisteredCustomerForm = server.forms.getForm('coRegisteredCustomer');

            var reachfiveCache = {
                loginEmail: coRegisteredCustomerForm.email.value,
                loginPassword: coRegisteredCustomerForm.password.value
            };

            res.setViewData({ reachFiveCache: reachfiveCache });

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var viewData = res.getViewData();
                var authenticatedCustomer = viewData.customerLoginResult.authenticatedCustomer;

                if (!viewData.customerLoginResult.error && authenticatedCustomer) {
                    var apiHelper = require('*/cartridge/scripts/helpers/reachfiveApiHelper');
                    var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

                    var email = viewData.reachFiveCache.loginEmail;
                    var password = viewData.reachFiveCache.loginPassword;
                    var profile = authenticatedCustomer.profile;
                    var authResult;
                    var errorMessagePrefix = '[CheckoutService-LoginCustomer] ReachFive profile ['
                        + email
                        + '] was not created because of:';

                    var customerReachFiveProfile = apiHelper.getCustomerReachFiveExtProfile(authenticatedCustomer);

                    if (customerReachFiveProfile) {
                        errorMessagePrefix = '[CheckoutService-LoginCustomer] ReachFive profile ['
                            + email
                            + '] was not logged in because of:';

                        authResult = apiHelper.loginWithPassword(email, password);
                    } else {
                        var credentialsObject = {
                            email: email,
                            password: password
                        };

                        authResult = apiHelper.signUp(credentialsObject, profile);

                        if (authResult.ok) {
                            var reachFiveProviderId = reachfiveSettings.reachFiveProviderId;

                            Transaction.wrap(function () {
                                customerReachFiveProfile = authenticatedCustomer.createExternalProfile(reachFiveProviderId, authResult.object.id);
                            });
                        }
                    }

                    if (authResult.ok) {
                        var reachfiveSession = new ReachfiveSessionModel();

                        reachfiveSession.one_time_token = authResult.object.tkn;
                    } else {
                        LOGGER.error(errorMessagePrefix + authResult.errorMessage);
                    }
                }

                delete viewData.reachFiveCache;
            });
        }
        return next();
    }
);

module.exports = server.exports();