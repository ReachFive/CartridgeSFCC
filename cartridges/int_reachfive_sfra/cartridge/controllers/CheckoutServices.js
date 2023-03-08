'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

/**
 * Validates the given form and creates response JSON if there are errors.
 * @param {Object} form - the customer form to validate
 * @return {Object} validation result
 */
function validateCustomerForm(form) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var result = COHelpers.validateCustomerForm(form);

    if (result.formFieldErrors.length) {
        result.customerForm.clear();
        // prepare response JSON with form data and errors
        result.json = {
            form: result.customerForm,
            fieldErrors: result.formFieldErrors,
            serverErrors: [],
            error: true
        };
    }

    return result;
}

server.post(
    'LoginCustomerReachFive',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // skip if ReachFive is disabled
        if (Site.current.getCustomPreferenceValue('isReachFiveEnabled')) {
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
            var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
            var URLUtils = require('dw/web/URLUtils');
            var Resource = require('dw/web/Resource');

            // validate registered customer form
            var coRegisteredCustomerForm = server.forms.getForm('coRegisteredCustomer');
            var result = validateCustomerForm(coRegisteredCustomerForm);
            if (result.json) {
                res.json(result.json);
                return next();
            }

            // login the registered customer
            var viewData = result.viewData;
            var customerForm = result.customerForm;
            var formFieldErrors = result.formFieldErrors;

            viewData.customerLoginResult = accountHelpers.loginCustomer(customerForm.email.value, customerForm.password.value, false);
            if (viewData.customerLoginResult.error) {
                // add customer error message for invalid password
                res.json({
                    form: customerForm,
                    fieldErrors: formFieldErrors,
                    serverErrors: [],
                    customerErrorMessage: Resource.msg('error.message.login.wrong', 'checkout', null),
                    error: true
                });
                return next();
            }

            var authenticatedCustomer = viewData.customerLoginResult.authenticatedCustomer;
            var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();

            // Check does the customer profile already contain reachfive account
            var customerReachFiveProfile = reachFiveHelper.getCustomerReachFiveExtProfile(authenticatedCustomer);

            if (!customerReachFiveProfile) {
                // Sign up customer R5 account with same login and password
                var signUpResult = reachFiveService.signUp(customerForm.email.value, customerForm.password.value, authenticatedCustomer.profile);

                if (signUpResult.ok) {
                    Transaction.wrap(function () {
                        customerReachFiveProfile = authenticatedCustomer.createExternalProfile(reachFiveProviderId, signUpResult.object.id);
                    });
                } else {
                    // TODO: Error during new customer registration need to be processed separatly
                    //      Potentially we could return some specific error and block logging
                    //      Or detect signUpResult.errorMessage and based on error display something
                }
            }

            var redirectURL = URLUtils.https('Checkout-Begin', 'stage', 'shipping').abs().toString();
            var stateObjBase64 = reachFiveHelper.getStateObjBase64(redirectURL, true);

            res.json({
                reachFiveLogin: true,
                stateObjBase64: stateObjBase64,
                error: false
            });
            res.setViewData(viewData);
        } else {
            // TODO: return error object to identify that Reachfive disable.
            //      Normally should not heppened
        }
        return next();
    }
);

module.exports = server.exports();
