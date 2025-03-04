'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

// var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
var reachFiveApiHelper = require('*/cartridge/scripts/helpers/reachfiveApiHelper');
var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
var reachFiveInterface = require('*/cartridge/scripts/interfaces/reachFiveInterface');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

server.append('Login', function (req, res, next) {
    if (
        reachfiveSettings.isReachFiveEnabled &&
        reachfiveSettings.isReachFiveLoginAllowed
    ) {
        var viewData = res.getViewData();
        var authenticatedCustomer = viewData.authenticatedCustomer;

        if (authenticatedCustomer) {
            var apiHelper = require('*/cartridge/scripts/helpers/reachfiveApiHelper');
            var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

            var email = req.form.loginEmail;
            var password = req.form.loginPassword;
            var profile = authenticatedCustomer.profile;
            var authResult;
            var errorMessagePrefix =
                '[Account-Login] ReachFive profile [' +
                email +
                '] was not created because of:';

            // Check does the customer profile already contain reachfive account
            var customerReachFiveProfile =
                reachFiveApiHelper.getCustomerReachFiveExtProfile(
                    authenticatedCustomer
                );

            if (customerReachFiveProfile) {
                errorMessagePrefix =
                    '[Account-Login] ReachFive profile[' +
                    email +
                    '] was not logged in because of:';

                authResult = apiHelper.loginWithPassword(email, password);
            } else {
                var credentialsObject = {
                    email: email,
                    password: password
                };

                authResult = apiHelper.signUp(credentialsObject, profile);

                if (authResult.ok) {
                    var reachFiveProviderId =
                        reachfiveSettings.reachFiveProviderId;

                    Transaction.wrap(function () {
                        customerReachFiveProfile =
                            authenticatedCustomer.createExternalProfile(
                                reachFiveProviderId,
                                authResult.object.id
                            );
                        customerReachFiveProfile.setEmail(email);
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
    }
    return next();
});

server.append('Show', function (req, res, next) {
    var passwordUpdateCTA = true;
    var passwordResetCTA = true;
    var profileUpdateCTA = true;
    var socialNetworksCTA = true;

    var viewData = res.getViewData();

    if (reachfiveSettings.isReachFiveEnabled) {
        var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');
        var ReachfiveProfileModel = require('*/cartridge/models/profile/customerOrigin');

        var reachfiveSession = new ReachfiveSessionModel();
        var reachfiveProfile = new ReachfiveProfileModel(
            req.currentCustomer.raw
        );

        if (reachfiveSession.profile) {
            //If ReachFive profile exist
            //If Social Login only or email null or mode CIAM without password already setted
            if (
                !reachfiveSettings.isReachFiveLoginAllowed ||
                reachfiveProfile.profile.email == '' ||
                (reachfiveSettings.isReachFiveLoginAllowed &&
                    !reachfiveSettings.isReachFiveTransitionActive &&
                    !reachfiveSession.has_password)
            ) {
                passwordResetCTA = false;
            }

            // If the profile doesn't has a ReachFive password
            // AND has a technical password OR doesn't has a SFCC password
            if (
                !reachfiveSession.has_password &&
                (reachfiveProfile.hasTechnicalPassword ||
                    !reachfiveProfile.salesforcePasswordSet)
            ) {
                passwordUpdateCTA = false;
            }
        } else {
            socialNetworksCTA = false;

            if (req.session.raw.isCustomerExternallyAuthenticated()) {
                passwordUpdateCTA = false;
            }
        }
    } else {
        socialNetworksCTA = false;
        profileUpdateCTA = !viewData.account.isExternallyAuthenticated;
        passwordUpdateCTA = !viewData.account.isExternallyAuthenticated;
        passwordResetCTA = !viewData.account.isExternallyAuthenticated;
    }

    //If Social Unlink / Link displayed
    if (socialNetworksCTA) {
        var tknStatus = reachFiveInterface.verifySessionAccessTkn(); //Check and refresh the access token if needed
        if (!tknStatus.success) {
            socialNetworksCTA = false;
        }
    }

    res.setViewData({
        reachfive: {
            passwordUpdateCTA: passwordUpdateCTA,
            passwordResetCTA: passwordResetCTA,
            socialNetworksCTA: socialNetworksCTA,
            profileUpdateCTA: profileUpdateCTA
        }
    });

    next();
});

server.append('EditPassword', function (req, res, next) {
    if (reachfiveSettings.isReachFiveEnabled) {
        //var ReachfiveProfileModel = require('*/cartridge/models/profile/customerOrigin');
        var context = {
            reachfive: {
                formTemplate: 'ACCOUNT_WITH_PASSWORD'
            }
        };

        //var reachfiveProfile = new ReachfiveProfileModel(req.currentCustomer.raw);

        //if (!reachfiveProfile.salesforcePasswordSet) {
        if (
            reachfiveSettings.isReachFiveLoginAllowed &&
            !reachfiveSettings.isReachFiveTransitionActive
        ) {
            context.reachfive.formTemplate = 'ACCOUNT_SOCIAL';
        }

        res.setViewData(context);
    }

    next();
});

/**
 * Account-SavePassword : The Account-SavePassword endpoint is the endpoit that handles changing the shopper's password
 * @name Base/Account-SavePassword
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - dwfrm_profile_login_currentpassword - Input field for the shopper's current password
 * @param {httpparameter} - dwfrm_profile_login_newpasswords_newpassword - Input field for the shopper's new password
 * @param {httpparameter} - dwfrm_profile_login_newpasswords_newpasswordconfirm - Input field for the shopper to confirm their new password
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace(
    'SavePassword',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;
        // form validation
        if (
            newPasswords.newpassword.value !==
            newPasswords.newpasswordconfirm.value
        ) {
            profileForm.valid = false;
            newPasswords.newpassword.valid = false;
            newPasswords.newpasswordconfirm.valid = false;
            newPasswords.newpasswordconfirm.error = Resource.msg(
                'error.message.mismatch.newpassword',
                'forms',
                null
            );
        }

        var result = {
            currentPassword: profileForm.login.currentpassword.value,
            newPassword: newPasswords.newpassword.value,
            newPasswordConfirm: newPasswords.newpasswordconfirm.value,
            profileForm: profileForm
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () {
                // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var status;
                var response = {
                    ok: true
                };

                Transaction.begin();

                status = customer.profile.credentials.setPassword(
                    formInfo.newPassword,
                    formInfo.currentPassword,
                    true
                );

                if (
                    reachfiveSettings.isReachFiveEnabled &&
                    reachfiveSettings.isReachFiveLoginAllowed
                ) {
                    response = reachFiveApiHelper.updatePassword(
                        customer.profile.credentials.login,
                        formInfo.newPassword,
                        formInfo.currentPassword
                    );
                }

                if (!status.error && response.ok) {
                    Transaction.commit();

                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.newPasswordConfirm;
                    delete formInfo.profileForm;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                } else {
                    Transaction.rollback();

                    if (status.error) {
                        if (
                            !CustomerMgr.isAcceptablePassword(
                                newPasswords.newpassword.value
                            )
                        ) {
                            formInfo.profileForm.login.newpasswords.newpassword.valid = false;
                            formInfo.profileForm.login.newpasswords.newpassword.error =
                                Resource.msg(
                                    'error.message.password.constraints.not.matched',
                                    'forms',
                                    null
                                );
                        } else {
                            formInfo.profileForm.login.currentpassword.valid = false;
                            formInfo.profileForm.login.currentpassword.error =
                                Resource.msg(
                                    'error.message.currentpasswordnomatch',
                                    'forms',
                                    null
                                );
                        }
                    } else if (!response.ok) {
                        formInfo.profileForm.login.newpasswords.newpassword.valid = false;

                        if (
                            response.errorObj &&
                            response.errorObj.error_description
                        ) {
                            formInfo.profileForm.login.newpasswords.newpassword.error =
                                response.errorObj.error_description;
                        } else {
                            formInfo.profileForm.login.newpasswords.newpassword.error =
                                Resource.msg(
                                    'reachfive.server.error',
                                    'forms',
                                    null
                                );
                        }
                    }

                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.newPasswordConfirm;
                    delete formInfo.profileForm;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.append('SubmitRegistration', function (req, res, next) {
    if (reachfiveSettings.isReachFiveEnabled) {
        var registrationForm = res.getViewData();

        if (
            registrationForm.validForm &&
            reachfiveSettings.isReachFiveTransitionActive
        ) {
            var reachFiveCache = {
                password: registrationForm.password
            };

            res.setViewData({ reachFiveCache: reachFiveCache });

            this.on('route:Complete', function (req, res) {
                // eslint-disable-line no-shadow
                var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');
                var data = res.getViewData();
                var authenticatedCustomer = data.authenticatedCustomer;

                if (authenticatedCustomer && data.validForm) {
                    var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');
                    var reachFiveProviderId =
                        reachfiveSettings.reachFiveProviderId;
                    var signUpResult = {
                        errorMessage:
                            'Should not happens because of strict logic'
                    };

                    var email = data.email;
                    var password = data.reachFiveCache.password;

                    signUpResult = reachFiveService.signUp(
                        email,
                        password,
                        authenticatedCustomer.profile
                    );

                    if (signUpResult.ok) {
                        Transaction.wrap(function () {
                            var externalProfile = authenticatedCustomer.createExternalProfile(
                                reachFiveProviderId,
                                signUpResult.object.id
                            );
                            externalProfile.setEmail(email);
                        });

                        var reachfiveSession = new ReachfiveSessionModel();
                        reachfiveSession.one_time_token =
                            signUpResult.object.tkn;

                        reachFiveHelper.setReachFiveConversionCookie();
                    } else {
                        LOGGER.error(
                            '[Account-SubmitRegistration] ReachFive profile was not created because of: ' +
                                signUpResult.errorMessage
                        );
                        // TODO: Error during new customer registration need to be processed separately
                        //      Potentially we could return some specific error and block logging
                        //      Or detect signUpResult.errorMessage and based on error display something
                    }
                }

                delete data.reachFiveCache;
            });
        }
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
    if (
        reachfiveSettings.isReachFiveEnabled &&
        reachfiveSettings.isReachFiveTransitionActive
    ) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var viewData = res.getViewData();

        var reachFiveCache = {
            tokenCustomer: CustomerMgr.getCustomerByToken(viewData.token)
        };

        res.setViewData({ reachFiveCache: reachFiveCache });
        this.on('route:Complete', function (req, res) {
            // eslint-disable-line no-shadow
            var data = res.getViewData();
            var tokenCustomer = data.reachFiveCache.tokenCustomer;

            if (data.passwordForm.valid && !empty(tokenCustomer)) {
                reachFiveApiHelper.passwordUpdateManagementAPI(
                    tokenCustomer.profile,
                    data.newPassword
                );

                //If the password is not set by the customer
                if (
                    tokenCustomer.profile.custom.reachfiveHasTechnicalPassword
                ) {
                    var profile = tokenCustomer.getProfile();

                    Transaction.begin();

                    try {
                        profile.custom.reachfiveHasTechnicalPassword = false; //Update the flag value as the password is now a real one
                        Transaction.commit();
                    } catch (error) {
                        LOGGER.error(
                            'Error during modify the reachfiveHasTechnicalPassword value to false : {0}',
                            error
                        );
                        Transaction.rollback();
                    }
                }
            }

            delete data.reachFiveCache;
        });
    }

    next();
});

/**
 * Account-EditProfile : The Account-EditProfile endpoint renders the page that allows a shopper to edit their profile. The edit profile form is prefilled with the shopper's first name, last name, phone number and email
 * @name Base/Account-EditProfile
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace(
    'EditProfile',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var content = ContentMgr.getContent('tracking_hint');
        var profileForm;

        var context = {
            formTemplate: 'NORMAL',
            showEmailEditor: false,
            showPhoneNumberEditor: false,
            showSocialPassword: false,
            consentApi: Object.prototype.hasOwnProperty.call(
                req.session.raw,
                'setTrackingAllowed'
            ),
            caOnline: content ? content.online : false,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg(
                        'page.title.myaccount',
                        'account',
                        null
                    ),
                    url: URLUtils.url('Account-Show').toString()
                }
            ]
        };

        profileForm = server.forms.getForm('profile');
        profileForm.clear();

        if (reachfiveSettings.isReachFiveEnabled) {
            var ReachfiveProfile = require('*/cartridge/models/profile/customerOrigin');
            var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

            var reachfiveProfile = new ReachfiveProfile(
                req.currentCustomer.raw
            );
            var reachfiveSession = new ReachfiveSessionModel();

            //If the user didn't use ReachFive to login
            if (reachfiveSession.access_token == null) {
                context.formTemplate = 'ACCOUNT_SALESFORCE_PASSWORD';

                profileForm.customer.firstname.value =
                    reachfiveProfile.profile.given_name;
                profileForm.customer.lastname.value =
                    reachfiveProfile.profile.family_name;
                profileForm.customer.phone.value =
                    reachfiveProfile.profile.phone_number;
                profileForm.customer.email.value =
                    reachfiveProfile.profile.email;
            } else {
                context.formTemplate = 'ACCOUNT_SOCIAL';

                context.showEmailEditor = true;
                context.showPhoneNumberEditor = true;

                profileForm.customer.firstname.value =
                    reachfiveProfile.profile.given_name;
                profileForm.customer.lastname.value =
                    reachfiveProfile.profile.family_name;
                profileForm.customer.phoneNotStrict.value =
                    reachfiveProfile.profile.phone_number;
                profileForm.customer.email.value =
                    reachfiveProfile.profile.email;

                //If the profile has a ReachFive password AND don't have a technical password on SFCC
                if (
                    reachfiveSession.has_password &&
                    !reachfiveProfile.hasTechnicalPassword
                ) {
                    if (
                        String.prototype.indexOf.call(
                            reachfiveSettings.reachFiveCheckCredentials,
                            'password'
                        ) !== -1
                    ) {
                        context.showSocialPassword = true;
                    }
                }
            }
        } else {
            var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');

            var accountModel = accountHelpers.getAccountModel(req);

            profileForm.customer.firstname.value =
                accountModel.profile.firstName;
            profileForm.customer.lastname.value = accountModel.profile.lastName;
            profileForm.customer.phone.value = accountModel.profile.phone;
            profileForm.customer.email.value = accountModel.profile.email;
        }

        context.profileForm = profileForm;

        res.render('account/profile', context);
        next();
    }
);

/**
 * Account-SaveProfile : The Account-SaveProfile endpoint is the endpoint that gets hit when a shopper has edited their profile
 * @name Base/Account-SaveProfile
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - dwfrm_profile_customer_firstname - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_profile_customer_lastname - Input field for the shopper's last name
 * @param {httpparameter} - dwfrm_profile_customer_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_profile_customer_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_customer_emailconfirm - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_login_password  - Input field for the shopper's password
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensititve
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'SaveProfileReachfive',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var ReachfiveProfile = require('*/cartridge/models/profile/customerOrigin');

        var profileForm = server.forms.getForm('profile');

        // form validation
        if (
            profileForm.customer.email.value.toLowerCase() !==
            profileForm.customer.emailconfirm.value.toLowerCase()
        ) {
            profileForm.valid = false;
            profileForm.customer.email.valid = false;
            profileForm.customer.emailconfirm.valid = false;
            profileForm.customer.emailconfirm.error = Resource.msg(
                'error.message.mismatch.email',
                'forms',
                null
            );
        }

        var result = {
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phone.value,
            email: profileForm.customer.email.value,
            confirmEmail: profileForm.customer.emailconfirm.value,
            password: profileForm.login.password.value,
            profileForm: profileForm
        };
        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) {
                // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();
                var oldLogin = profile.getEmail();
                var oldPhone = profile.getPhoneHome();
                var customerLogin;
                var status;
                var tknStatus;
                var reachfiveUpdateLogin = {
                    ok: true
                };
                var reachfiveUpdatePhone = {
                    ok: true
                };
                var verifiedTknObj = {
                    status: false,
                    verified: false
                };

                Transaction.wrap(function () {
                    status = profile.credentials.setPassword(
                        formInfo.password,
                        formInfo.password,
                        true
                    );
                });
                if (status.error) {
                    formInfo.profileForm.login.password.valid = false;
                    formInfo.profileForm.login.password.error = Resource.msg(
                        'error.message.currentpasswordnomatch',
                        'forms',
                        null
                    );
                } else {
                    Transaction.begin();
                    customerLogin = profile.credentials.setLogin(
                        formInfo.email,
                        formInfo.password
                    );

                    if (customerLogin && oldLogin !== formInfo.email) {
                        tknStatus = reachFiveHelper.verifySessionAccessTkn();
                        verifiedTknObj.status = tknStatus.success;
                        verifiedTknObj.verified = true;

                        if (verifiedTknObj.status) {
                            reachfiveUpdateLogin =
                                reachFiveApiHelper.updateReachfiveLoginWithTkn(
                                    formInfo.email
                                );
                        }
                    }

                    if (customerLogin && reachfiveUpdateLogin.ok) {
                        Transaction.commit();
                    } else {
                        customerLogin = false;
                        Transaction.rollback();
                    }
                }

                delete formInfo.password;
                delete formInfo.confirmEmail;

                if (customerLogin) {
                    Transaction.begin();

                    profile.setFirstName(formInfo.firstName);
                    profile.setLastName(formInfo.lastName);
                    profile.setEmail(formInfo.email);
                    profile.setPhoneHome(formInfo.phone);

                    if (
                        reachFiveApiHelper.isNewPhone(oldPhone, formInfo.phone)
                    ) {
                        if (!verifiedTknObj.verified) {
                            tknStatus =
                                reachFiveHelper.verifySessionAccessTkn();
                            verifiedTknObj.status = tknStatus.success;
                            verifiedTknObj.verified = true;
                        }

                        if (verifiedTknObj.status) {
                            reachfiveUpdatePhone =
                                reachFiveApiHelper.updateReachfivePhoneWithTnk(
                                    formInfo.phone
                                );
                        }
                    }

                    if (reachfiveUpdatePhone.ok) {
                        Transaction.commit();

                        // Send account edited email
                        accountHelpers.sendAccountEditedEmail(customer.profile);

                        var reachfiveProfile = new ReachfiveProfile(customer);
                        var profileRequestObj =
                            reachfiveProfile.getUserProfileObj(
                                'email,given_name,family_name' /* fields */
                            );
                        reachFiveApiHelper.updateReachFiveProfile(
                            profileRequestObj
                        );

                        delete formInfo.profileForm;
                        delete formInfo.email;

                        res.json({
                            success: true,
                            redirectUrl: URLUtils.url('Account-Show').toString()
                        });
                    } else {
                        Transaction.rollback();

                        if (!status.error) {
                            formInfo.profileForm.customer.phone.valid = false;
                            if (
                                reachfiveUpdatePhone.errorObj &&
                                reachfiveUpdatePhone.errorObj.error_description
                            ) {
                                formInfo.profileForm.customer.phone.error =
                                    reachfiveUpdatePhone.errorObj.error_description;
                            } else {
                                formInfo.profileForm.customer.phone.error =
                                    Resource.msg(
                                        'error.message.parse.phone',
                                        'forms',
                                        null
                                    );
                            }
                        }

                        delete formInfo.profileForm;
                        delete formInfo.email;

                        res.json({
                            success: false,
                            fields: formErrors.getFormErrors(profileForm)
                        });
                    }
                } else {
                    if (!status.error) {
                        formInfo.profileForm.customer.email.valid = false;

                        if (
                            !reachfiveUpdateLogin.ok &&
                            reachfiveUpdateLogin.errorObj &&
                            reachfiveUpdateLogin.errorObj.error_description
                        ) {
                            formInfo.profileForm.customer.email.error =
                                reachfiveUpdateLogin.errorObj.error_description;
                        } else {
                            formInfo.profileForm.customer.email.error =
                                Resource.msg(
                                    'error.message.username.invalid',
                                    'forms',
                                    null
                                );
                        }
                    }

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.post(
    'SaveProfileSocialReachfive',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var errorDetected = false;
        var updateToken = true;
        var context = {
            success: false,
            redirectUrl: URLUtils.url('Account-Show').toString()
        };

        var profileForm = server.forms.getForm('profile');

        if (
            !empty(profileForm.customer.emailconfirm.value) &&
            profileForm.customer.email.value.toLowerCase() !==
                profileForm.customer.emailconfirm.value.toLowerCase()
        ) {
            profileForm.valid = false;
            profileForm.customer.email.valid = false;
            profileForm.customer.emailconfirm.valid = false;
            profileForm.customer.emailconfirm.error = Resource.msg(
                'error.message.mismatch.email',
                'forms',
                null
            );
        }

        var result = {
            profileFields: 'given_name,family_name',
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phoneNotStrict.value,
            email: profileForm.customer.email.value,
            confirmEmail: profileForm.customer.emailconfirm.value,
            password: profileForm.login.password.value,
            profileForm: profileForm
        };

        if (profileForm.valid) {
            // Check "reachFiveCheckCredentials" preference
            var checkCredentials = reachfiveSettings.reachFiveCheckCredentials;

            if (
                String.prototype.indexOf.call(checkCredentials, 'password') !==
                -1
            ) {
                // If customer with login and password (not SLO profile)
                if (!empty(result.password)) {
                    // Disable refresh "access_token" with "refresh_token"
                    updateToken = false;

                    // Check customer password and update access token in session
                    var authResult = reachFiveApiHelper.getTokenWithPassword(
                        req.currentCustomer.profile.email,
                        result.password
                    );

                    if (!authResult.ok) {
                        errorDetected = true;
                        profileForm.login.password.valid = false;
                        if (
                            !empty(authResult.errorObj) &&
                            Object.prototype.hasOwnProperty.call(
                                authResult.errorObj,
                                'error_description'
                            )
                        ) {
                            profileForm.login.password.error =
                                authResult.errorObj.error_description;
                        } else {
                            profileForm.login.password.error = Resource.msg(
                                'error.message.error.unknown',
                                'login',
                                null
                            );
                        }
                    }
                }
            }
        } else {
            errorDetected = true;
        }

        if (!errorDetected) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) {
                // eslint-disable-line no-shadow
                var CustomerReachfiveProfileModel = require('*/cartridge/models/profile/customerOrigin');
                var FormReachfiveProfileModel = require('*/cartridge/models/profile/reachfiveOrigin');

                var tknStatus;
                var reachfiveUpdatePhone;
                var reachfiveUpdateLogin;
                var reachfiveUpdateProfile;

                var formInfo = res.getViewData();
                var profileFields = formInfo.profileFields;

                var equalList = {
                    trigger: false,
                    profile: true,
                    email: true,
                    phone: true
                };
                var validList = {
                    trigger: false,
                    profile: true,
                    email: true,
                    phone: true
                };

                var customerModel = new CustomerReachfiveProfileModel(
                    req.currentCustomer.raw
                );
                var formModel = new FormReachfiveProfileModel({
                    id: customerModel.profile.id,
                    given_name: formInfo.firstName,
                    family_name: formInfo.lastName,
                    email: formInfo.email,
                    phone_number: formInfo.phone
                });

                // Data freshness check
                equalList.profile = formModel.equal(
                    customerModel,
                    profileFields
                );
                if (formInfo.email) {
                    equalList.email = formModel.equal(customerModel, 'email');
                }
                if (formInfo.phone) {
                    equalList.phone = !reachFiveApiHelper.isNewPhone(
                        customerModel.profile.phone_number,
                        formModel.profile.phone_number
                    );
                }

                equalList.trigger = !(
                    equalList.profile &&
                    equalList.email &&
                    equalList.phone
                );

                if (equalList.trigger) {
                    tknStatus =
                        reachFiveHelper.verifySessionAccessTkn(updateToken);

                    if (tknStatus.success) {
                        // Update phone_number
                        if (!equalList.phone) {
                            reachfiveUpdatePhone =
                                reachFiveApiHelper.updateReachfivePhoneWithTnk(
                                    formInfo.phone
                                );

                            if (reachfiveUpdatePhone.ok) {
                                formModel.updateCustomerProfile('phone_number');
                            } else {
                                validList.phone = false;
                                formInfo.profileForm.customer.phoneNotStrict.valid = false;
                                formInfo.profileForm.customer.phoneNotStrict.error =
                                    reachfiveUpdatePhone.errorObj.error_description;
                            }
                        }
                        // Update email
                        if (!equalList.email) {
                            reachfiveUpdateLogin =
                                reachFiveApiHelper.updateReachfiveLoginWithTkn(
                                    formInfo.email
                                );

                            if (reachfiveUpdateLogin.ok) {
                                formModel.updateCustomerProfile('email');
                            } else {
                                validList.email = false;
                                formInfo.profileForm.customer.email.valid = false;
                                formInfo.profileForm.customer.email.error =
                                    reachfiveUpdateLogin.errorObj.error_description;
                            }
                        }
                        // Update other profile fields
                        if (!equalList.profile) {
                            var profileRequestObj =
                                formModel.getUserProfileObj(profileFields);
                            reachfiveUpdateProfile =
                                reachFiveApiHelper.updateReachFiveProfile(
                                    profileRequestObj
                                );

                            if (reachfiveUpdateProfile.ok) {
                                formModel.updateCustomerProfile(profileFields);
                            } else {
                                formInfo.profileForm.customer.firstname.valid = false;
                                formInfo.profileForm.customer.firstname.error =
                                    reachfiveUpdateProfile.errorMessage;
                            }
                        }

                        validList.trigger = !(
                            validList.email &&
                            validList.phone &&
                            validList.profile
                        );

                        // Collect errors if exist
                        if (validList.trigger) {
                            res.json({
                                success: false,
                                fields: formErrors.getFormErrors(profileForm)
                            });
                        }
                    } else {
                        formInfo.profileForm.customer.firstname.valid = false;
                        formInfo.profileForm.customer.firstname.error =
                            tknStatus.msg;

                        res.json({
                            success: false,
                            fields: formErrors.getFormErrors(profileForm)
                        });
                    }
                }
            });
        }

        if (errorDetected) {
            context.fields = formErrors.getFormErrors(profileForm);
        } else {
            context.success = true;
        }

        res.json(context);

        return next();
    }
);

server.post('DeleteProfile', function (req, res, next) {
    var currentCustomer = req.currentCustomer.raw;

    if (currentCustomer && currentCustomer.isAuthenticated()) {
        Transaction.wrap(function () {
            CustomerMgr.removeCustomer(currentCustomer);
        });

        // Destroy session and clear cookies
        req.session.privacy = {};
        res.clearCookie('dwsid');

        res.json({
            success: true,
            redirectUrl: URLUtils.url('Login-Show').toString()
        });
    } else {
        res.json({
            success: false,
            errorMessage: 'No authenticated customer found.'
        });
    }

    return next();
});

module.exports = server.exports();
