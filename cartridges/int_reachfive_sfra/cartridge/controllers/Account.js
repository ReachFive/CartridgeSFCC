'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

server.append('Login', function (req, res, next) {
    // skip if ReachFive is disabled
    if (Site.current.getCustomPreferenceValue('isReachFiveEnabled')
        && Site.current.getCustomPreferenceValue('isReachFiveTransitionActive')) {
        var viewData = res.getViewData();
        var authenticatedCustomer = viewData.authenticatedCustomer;

        if (authenticatedCustomer) {
            var email = req.form.loginEmail;
            var password = req.form.loginPassword;
            var profile = authenticatedCustomer.profile;
            var reachFiverediRectObjBase64 = reachFiveHelper.getStateObjBase64(viewData.redirectUrl);

            // Check does the customer profile already contain reachfive account
            var customerReachFiveProfile = reachFiveHelper.getCustomerReachFiveExtProfile(authenticatedCustomer);

            if (customerReachFiveProfile) {
                // Process login from storefront with the same login and password
                res.setViewData({
                    success: false,
                    reachFiveLogin: true,
                    reachFiveStateObj: reachFiverediRectObjBase64
                });
            } else {
                var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
                // Sign up customer R5 account with same login and password
                var signUpResult = reachFiveService.signUp(email, password, profile);

                if (signUpResult.ok) {
                    Transaction.wrap(function () {
                        customerReachFiveProfile = authenticatedCustomer.createExternalProfile(reachFiveProviderId, signUpResult.object.id);
                    });
                    reachFiveHelper.setOnetimeTknInSession(signUpResult.object.tkn);
                } else {
                    LOGGER.error('[Account-Login] ReachFive profile was not created because of: ' + signUpResult.errorMessage);
                    // TODO: Error during new customer registration need to be processed separatly
                    //      Potentially we could return some specific error and block logging
                    //      Or detect signUpResult.errorMessage and based on error display something
                }
            }
        }
    }
    return next();
});

server.append('SavePassword', function (req, res, next) {
    // skip if ReachFive is disabled
    if (Site.current.getCustomPreferenceValue('isReachFiveEnabled')) {
        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;
        var reachFiveCache = {
            currentPassword: profileForm.login.currentpassword.value,
            newPassword: newPasswords.newpassword.value,
            newPasswordConfirm: newPasswords.newpasswordconfirm.value
        };
        res.setViewData({ reachFiveCache: reachFiveCache });

        this.on('route:Complete', function (req, res) {  // eslint-disable-line no-shadow
            var data = res.getViewData();

            if (data.success) {
                reachFiveService.updatePassword(customer.profile.email, data.reachFiveCache.newPasswordConfirm, data.reachFiveCache.currentPassword);
            }

            delete data.reachFiveCache.currentPassword;
            delete data.reachFiveCache.newPassword;
            delete data.reachFiveCache.newPasswordConfirm;
        });
    }

    return next();
});

server.append('SubmitRegistration', function (req, res, next) {
    var registrationForm = res.getViewData();
    var profileSettledStr = req.session.privacyCache.get('reachFivePrefilRegister');

    if (Site.current.getCustomPreferenceValue('isReachFiveEnabled')
        && registrationForm.validForm
        && (Site.current.getCustomPreferenceValue('isReachFiveTransitionActive')
            || req.httpParameterMap.isParameterSubmitted('preg'))) {
        var reachFiveCache = {
            password: registrationForm.password
        };

        if (req.httpParameterMap.isParameterSubmitted('preg') && profileSettledStr) {
            var profileSettledObj = JSON.parse(profileSettledStr);
            req.session.privacyCache.set('reachFivePrefilRegister', null);

            // Prohibit changing email address
            if (registrationForm.email) {
                registrationForm.email = profileSettledObj.email;
                reachFiveCache.profileSettledObj = profileSettledObj;
                res.setViewData(registrationForm);
            }
        }

        res.setViewData({ reachFiveCache: reachFiveCache });

        this.on('route:Complete', function (req, res) {  // eslint-disable-line no-shadow
            var data = res.getViewData();
            var authenticatedCustomer = data.authenticatedCustomer;

            if (authenticatedCustomer && data.validForm) {
                var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
                var signUpResult = {
                    errorMessage: 'Should not heppens because of strict logic'
                };

                var email = data.email;
                var password = data.reachFiveCache.password;

                if (Site.current.getCustomPreferenceValue('isReachFiveTransitionActive')
                    && !empty(data.reachFiveCache.profileSettledObj)) {
                    // Update existing Reachfive record with new password
                    // As result customer could use ligin and password to login
                    signUpResult = reachFiveHelper.passwordResetManagementAPI(data.reachFiveCache.profileSettledObj.externalID, password);
                } else if (!empty(data.reachFiveCache.profileSettledObj)) {
                    // Prepare mock object for proper external profile creation
                    signUpResult.ok = true;
                    signUpResult.object = {
                        id: data.reachFiveCache.profileSettledObj.externalID
                    };
                } else {
                    // Sign up customer ReachFive account with same login and password
                    signUpResult = reachFiveService.signUp(email, password, authenticatedCustomer.profile);
                }

                if (signUpResult.ok) {
                    Transaction.wrap(function () {
                        authenticatedCustomer.createExternalProfile(reachFiveProviderId, signUpResult.object.id);
                    });
                    reachFiveHelper.setOnetimeTknInSession(signUpResult.object.tkn);
                    reachFiveHelper.setReachFiveConversionCookie();
                } else {
                    LOGGER.error('[Account-SubmitRegistration] ReachFive profile was not created because of: ' + signUpResult.errorMessage);
                    // TODO: Error during new customer registration need to be processed separatly
                    //      Potentially we could return some specific error and block logging
                    //      Or detect signUpResult.errorMessage and based on error display something
                }
            }

            delete data.reachFiveCache;
        });
    }

    return next();
});

/**
 * Account-SaveNewPassword : The Account-SaveNewPassword endpoint handles resetting a shoppers password. This is the last step in the forgot password user flow. (This step does not log the shopper in.)
 * @name Base/Account-SaveNewPassword
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {httpparameter} - token - SFRA utilizes this token to retrieve the shopper
 * @param {httpparameter} - dwfrm_newPasswords_newpassword - Input field for the shopper's new password
 * @param {httpparameter} - dwfrm_newPasswords_newpasswordconfirm  - Input field to confirm the shopper's new password
 * @param {httpparameter} - save - unutilized param
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - post
 */
server.append('SaveNewPassword', function (req, res, next) {
    if (Site.current.getCustomPreferenceValue('isReachFiveEnabled')
        && Site.current.getCustomPreferenceValue('isReachFiveTransitionActive')) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var viewData = res.getViewData();

        var reachFiveCache = {
            tokenCustomer: CustomerMgr.getCustomerByToken(viewData.token)
        };

        res.setViewData({ reachFiveCache: reachFiveCache });
        this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
            var data = res.getViewData();
            var tokenCustomer = data.reachFiveCache.tokenCustomer;

            if (data.passwordForm.valid && !empty(tokenCustomer)) {
                reachFiveHelper.passwordUpdateManagementAPI(tokenCustomer.profile, data.newPassword);
            }

            delete data.reachFiveCache;
        });
    }

    next();
});

module.exports = server.exports();
