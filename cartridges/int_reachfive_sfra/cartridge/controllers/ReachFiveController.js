'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Reach Five Modules
 * */
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
var reachFiveApiHelper = require('*/cartridge/scripts/helpers/reachfiveApiHelper');
var ReachFiveModel = require('*/cartridge/models/ReachFiveModel');

/**
 * API Includes
 * */
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Resource = require('dw/web/Resource');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var dwStringUtils = require('dw/util/StringUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

/* eslint-disable no-lonely-if */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable no-param-reassign */
/* eslint-disable one-var */
/* eslint-disable no-undef */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-unused-vars */
/* eslint-disable indent */
/* eslint-disable no-use-before-define */

/**
 * Service interface
 * */
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');

/**
 * Handles the customer route form submission.
 * @param {dw.customer.Customer} loggedCustomer - current customer
 * @param {string} target - url target
 * @param {boolean} customerRoute - process handle hook
 * @return {string} target for redirect
 */
function handleCustomerRoute(loggedCustomer, target, customerRoute) {
    var BasketMgr = require('dw/order/BasketMgr');

    var redirectUrl = target;
    if (loggedCustomer && customerRoute) {
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            Transaction.wrap(function () {
                currentBasket.setCustomerEmail(loggedCustomer.profile.email);
            });
        } else {
            redirectUrl = URLUtils.url('Cart-Show').toString();
        }
    }

    return redirectUrl;
}

/**
 * Analyze state data in request
 * @param {Object} req request object
 * @returns {Object} - parsed state values or defaults
 */
function getStateData(req) {
    var stateData = {
        target: URLUtils.https('Account-Show').toString(),
        handleCustomerRoute: false
    };
    var stateObj = {
        redirectURL: null,
        action: false,
        handleCustomerRoute: false
    };
    if (req.httpParameterMap.isParameterSubmitted('state')) {
        var stateObjStr = dwStringUtils.decodeBase64(req.httpParameterMap.state.value);
        try {
            stateObj = JSON.parse(stateObjStr);
        } catch (err) {
            LOGGER.error('Error during state object parsing: {0}', err);
        }

        if (stateObj.redirectURL) {
            stateData.target = stateObj.redirectURL;
        }

        if (typeof stateObj.handleCustomerRoute === 'boolean') {
            stateData.handleCustomerRoute = stateObj.handleCustomerRoute;
        }

        if (stateObj.action) {
            stateData.action = stateObj.action;
        }

        //Get the data param in the state object
        if (stateObj.data) {
            stateData.data = stateObj.data;
        }
    }

    return stateData;
}

server.get(
    'CallbackReachFiveRequest',
    function (req, res, next) {
        var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
        var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

        //  Step 2: Handle the Authorization Response
        var code = req.httpParameterMap.code.value;
        var error = req.httpParameterMap.error.value;

        //  session.privacy.TargetLocation = request.httpParameterMap.redirectUrl.value;
        if (error || error === '') {
            var message = !!req.httpParameterMap.error_description.value ? req.httpParameterMap.error_description.value : '';
            LOGGER.warn('access denied: reach5 response: ' + message);

            loginFailedNoCode(message, res);
            return next();
        }

        //  Step 3: Exchange authorization code for ID token
        var authorizationResponse = reachFiveService.exchangeAuthorizationCodeForIDToken({ code: code });

        if (!authorizationResponse) {
            LOGGER.warn('authorization error : for code ' + code);
            loginFailed('genericerror', res);
            return next();
        }

    var reachfiveSession = new ReachfiveSessionModel(authorizationResponse);

    var externalProfileAddons = reachFiveApiHelper.getUserProfile();
    reachfiveSession.has_password = externalProfileAddons.object && externalProfileAddons.object.has_password;

        var email = reachfiveSession.profile.email;
        var externalID = reachfiveSession.profile.sub.trim();
        var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
        var reachFiveLoginForm = server.forms.getForm('reachfivelogin');
        var loggedCustomer, existingCustomer;
        var reachFiveConsents = null;

    var stateObj = getStateData(req);
    var target = stateObj.target;

    //Get the data from the state object
    var data = stateObj.data;

        // Logger debug for profile
        LOGGER.debug('Parsed UserId "{0}" from response: {1}', externalID, reachfiveSession.profile);

        // Check if an account with reachfive provider id exist
        var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(reachFiveProviderId, externalID);

        if (empty(profile)) {
            existingCustomer = !!email ? CustomerMgr.getCustomerByLogin(email) : null;
            if (existingCustomer != null && existingCustomer.getExternalProfiles() != null && existingCustomer.getExternalProfiles().length === 0) {
                // Case : We found one customer in Demandware with this login / email. So we have to link customer account with provider reachfive
                // clear fields
                reachFiveLoginForm.clear();
                // Set external ID in session before redirect
                reachFiveLoginForm.externalid.value = externalID;
                var socialNameResponse = !empty(reachfiveSession.profile.auth_type) ? reachfiveSession.profile.auth_type : '';

                var profilesLinked = false;
                if (reachfiveSession.has_password) {
                    profilesLinked = ReachFiveModel.setExternalParams(externalID, existingCustomer.profile);
                }

                if (profilesLinked) {
                    loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, existingCustomer.profile);
                    target = handleCustomerRoute(loggedCustomer, target, stateObj.handleCustomerRoute);
                } else {
                    target = URLUtils.https('ReachFiveController-InitLinkAccount',
                        'ReachFivesocialName', socialNameResponse,
                        'email', email);
                }

                loginRedirect(target, res);
                return next();
            // eslint-disable-next-line no-else-return
            } else {
                // Get profile with email and if email is not null
                if (!empty(email)) {
                    profile = CustomerMgr.searchProfiles('email = {0}', 'lastLoginTime desc', email).first();
                }

                // if profile because an email was found, we change external ID and provider ID for the found profile
                if (profile !== null) {
                    // Case : If a user has already an account with provider, so no login and password
                    // Set external ID and provider ID for the profile found
                    ReachFiveModel.setExternalParams(externalID, profile);
                } else {
                    // Case : Create a new customer
                    // Create customer with external profile
                    // If we want to create a new customer without prefill form
          if (reachfiveSettings.isReachFiveFastRegister || reachfiveSession.has_password) {
                        if (externalProfileAddons.ok) {
                            reachFiveConsents = externalProfileAddons.object.consents;
                        }

                        profile = ReachFiveModel.createReachFiveCustomer(externalID, reachfiveSession.profile, reachfiveSession.has_password, reachFiveConsents, data);
                    } else {
            var afterAuth = require('*/cartridge/models/afterAuthUrl');

            reachfiveSession.prefill_register = true;

            var rurl = afterAuth.getRurlValue(stateObj.action);

            target = URLUtils.url('ReachFiveController-StartPrefillRegister', 'rurl', rurl).toString();

                        loginRedirect(target, res);
                        return next();
                    }
                }
                // Login externally customer
                if (profile) {
                    loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile);
                }
                // If customer was logged, redirect to account show
                if (loggedCustomer) {
                    target = handleCustomerRoute(loggedCustomer, target, stateObj.handleCustomerRoute);
                    loginRedirect(target, res);
                    return next();
                }
            }
        } else {
            // Case : Login a customer with reachfive provider
            // Login externally customer
            loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile);
            target = handleCustomerRoute(loggedCustomer, target, stateObj.handleCustomerRoute);
            loginRedirect(target, res);
            return next();
        }

        loginFailed('genericerror', res);
        return next();
    }
);

/**
 * @function
 * @description Display link login form. Case : We found an account which external email is equal to one account login email.
 */
server.get(
    'InitLinkAccount',
    csrfProtection.generateToken,
    function (req, res, next) {
        var userName, rememberMe, ReachFivesocialName;
        // Prefill login form if the user is registered
        if (req.querystring.email) {
            userName = req.querystring.email;
            rememberMe = true;
        }

        if (req.querystring.ReachFivesocialName) {
            ReachFivesocialName = req.querystring.ReachFivesocialName;
        }

        var rurl = req.querystring.rurl || '1';

        res.render('account/login/reachfivelinkform', {
            disableSSOLogin: true,
            rememberMe: rememberMe,
            userName: userName,
            actionUrl: URLUtils.url('ReachFiveController-HandleLinkForm', 'rurl', rurl).toString(),
            ReachFivesocialName: ReachFivesocialName
        });
        next();
});

/**
 * @function
 * @description Form handler for the link login form. Handles the following actions
 */
server.post(
    'HandleLinkForm',
    csrfProtection.generateToken,
    function (req, res, next) {
        var reachFiveLoginForm = server.forms.getForm('reachfivelogin');
        var email = req.form.loginEmail;
        var password = req.form.loginPassword;
        var rememberMe = req.form.loginRememberMe ? (!!req.form.loginRememberMe) : false;
        var authenticatedCustomer;

        Transaction.wrap(function () {
            authenticatedCustomer = CustomerMgr.loginCustomer(email, password, rememberMe);
        });
        if (authenticatedCustomer && authenticatedCustomer.authenticated) {
            var afterAuth = require('*/cartridge/models/afterAuthUrl');

            var externalID = reachFiveLoginForm.externalid.value;

            if (externalID) {
                // Set external ID and provider ID on customer credentials
                ReachFiveModel.setExternalParams(externalID, customer.getProfile());
            }

            var target = afterAuth.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true);

            target = handleCustomerRoute(authenticatedCustomer, target, afterAuth.isHandlerActionRequire(req.querystring.rurl));

            loginRedirect(target, res);
        } else {
            res.render('account/login/reachfivelinkform', {
                rememberMe: rememberMe,
                userName: email,
                actionUrl: URLUtils.https('ReachFiveController-HandleLinkForm'),
                errorMsg: Resource.msg('error.message.login.form', 'login', null)
            });
        }
    return next();
});

// TODO: Function could be combined with next one "loginFailedNoCode" - the same functional
/**
 * @function
 * @description this method will be used if one step of reachfive process failed. We will redirect to target URL
 * @param {string} errorCode Error code
 * @param {Object} res Response Object
 * */
function loginFailed(errorCode, res) {
    var t = Resource.msg('reachfive.' + errorCode, 'reachfive', 'Error during process login');
    res.redirect(URLUtils.url('Login-Show', 'errormsg', t));
}

/**
 * @function
 * @description this method will be used if one step of reachfive process failed. We will redirect to target URL
 * @param {string} error Error
 * @param {Object} res Response Object
 * */
function loginFailedNoCode(error, res) {
    res.redirect(URLUtils.url('Login-Show', 'errormsg', error));
}

/**
 * @function
 * @description Redirect Customer to target URL if login reachfive process succeeded
 * @param {string} targetUrl Target URL
 * @param {Object} res Response Object
 * */
function loginRedirect(targetUrl, res) {
    if (!targetUrl || targetUrl === '') {
        targetUrl = URLUtils.https('Account-Show');
    }
    res.redirect(targetUrl);
}

/**
 * @function
 * @description Fill the creation form fields with the reach5 callback customer object
 * @param {Object} externalProfile External Profile
 * */
var prefillRegisterForm = function (externalProfile) {
    // prefill form profile
    var profileForm = server.forms.getForm('profile');

    // clear fields before prefill
    profileForm.clear();

    // Complete customer's profile with firstname, lastname, email and birthday if exists
    if (reachFiveHelper.isFieldExist(externalProfile, 'family_name')) {
        profileForm.customer.lastname.value = externalProfile.family_name;
    }

    if (reachFiveHelper.isFieldExist(externalProfile, 'given_name')) {
        profileForm.customer.firstname.value = externalProfile.given_name;
    }

    if (reachFiveHelper.isFieldExist(externalProfile, 'phone_number')) {
        profileForm.customer.phone.value = externalProfile.phone_number;
    }

    if (reachFiveHelper.isFieldExist(externalProfile, 'email')) {
        profileForm.customer.email.value = externalProfile.email;
        profileForm.customer.emailconfirm.value = externalProfile.email;
    }
};

/** Clears the profile form, adds the email address from login as the profile email address,
 *  and renders customer registration page.
 */
server.get(
    'StartPrefillRegister',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reachfiveSettings = require('*/cartridge/models/reachfiveSettings');
        var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

        var reachfiveSession = new ReachfiveSessionModel();

        if (reachfiveSettings.isReachFiveEnabled && reachfiveSession.isPrefillRegister()) {
            var breadcrumbs = [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ];

            prefillRegisterForm(reachfiveSession.profile);

            var rurl = req.querystring.rurl || '1';

            var profileForm = server.forms.getForm('profile');

            res.render('/account/loginPrefill', {
                disableSSOLogin: true,
                profileForm: profileForm,
                breadcrumbs: breadcrumbs,
                actionUrl: URLUtils.url('ReachFiveController-SubmitProfileSocialLogin', 'rurl', rurl).toString()
            });
        } else {
            res.redirect(URLUtils.url('Login-Show'));
        }

        next();
    }
);

server.post(
    'SubmitProfileSocialLogin',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var profileForm = server.forms.getForm('profile');
        var reachfiveSession = new ReachfiveSessionModel();

        if (reachfiveSession.isPrefillRegister()) {
            // form validation
            if (!!profileForm.customer.email.value && profileForm.customer.email.value.toLowerCase() !== profileForm.customer.emailconfirm.value.toLowerCase()) {
                profileForm.valid = false;
                profileForm.customer.email.valid = false;
                profileForm.customer.emailconfirm.valid = false;
                profileForm.customer.emailconfirm.error = Resource.msg('error.message.mismatch.email', 'forms', null);
            }

            var result = {
                profileFields: 'given_name,family_name',
                firstName: profileForm.customer.firstname.value,
                lastName: profileForm.customer.lastname.value,
                phone: profileForm.customer.phone.value,
                email: profileForm.customer.email.value,
                confirmEmail: profileForm.customer.emailconfirm.value,
                profileForm: profileForm
            };

            if (profileForm.valid) {
                res.setViewData(result);
                this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                    var afterAuth = require('*/cartridge/models/afterAuthUrl');
                    var formInfo = res.getViewData();
                    var loggedCustomer;
                    var profileFields = formInfo.profileFields;

                    var externalID = reachfiveSession.profile.sub.trim();
                    var profile = ReachFiveModel.createReachFiveCustomer(externalID,
                        {
                            given_name: formInfo.firstName,
                            family_name: formInfo.lastName,
                            phone_number: formInfo.phone,
                            email: formInfo.email
                        }
                    );

                    // Login externally customer
                    if (!empty(profile)) {
                        loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile);

                        // If customer was logged, redirect to account show
                        if (loggedCustomer) {
                            var CustomerReachfiveProfileModel = require('*/cartridge/models/profile/customerOrigin');
                            var ReachfiveProfileModel = require('*/cartridge/models/profile/reachfiveOrigin');

                            reachfiveSession.prefill_register = false;

                            // Update Reachfive profile after Salesforce, because of potential changes
                            var equalList = {
                                trigger: false,
                                profile: true,
                                phone: true
                            };

                            var customerModel = new CustomerReachfiveProfileModel(loggedCustomer);
                            var sessionModel = new ReachfiveProfileModel(reachfiveSession.profile);

                            // Data freshness check
                            equalList.profile = sessionModel.equal(customerModel, profileFields);
                            if (formInfo.phone) {
                                equalList.phone = !reachFiveHelper.isNewPhone(customerModel.profile.phone_number, sessionModel.profile.phone_number);
                            }

                            equalList.trigger = !(equalList.profile && equalList.phone);

                            if (equalList.trigger) {
                                var tknStatus = reachFiveHelper.verifySessionAccessTkn(true);

                                if (tknStatus.success) {
                                    // Update phone_number
                                    if (!equalList.phone) {
                                        reachFiveApiHelper.updateReachfivePhoneWithTnk(formInfo.phone);
                                    }
                                    if (!equalList.profile) {
                                        var profileRequestObj = customerModel.getUserProfileObj(profileFields);
                                        reachFiveApiHelper.updateReachFiveProfile(profileRequestObj);
                                    }
                                }
                            }

                            var target = afterAuth.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true);

                            target = handleCustomerRoute(loggedCustomer, target, afterAuth.isHandlerActionRequire(req.querystring.rurl));

                            res.json({
                                success: true,
                                redirectUrl: target
                            });
                        }
                    } else {
                        formInfo.profileForm.customer.email.valid = false;
                        formInfo.profileForm.customer.email.error = Resource.msg('error.message.unable.to.create.account', 'login', null);

                        res.json({
                            success: false,
                            redirectUrl: formErrors.getFormErrors(profileForm)
                        });
                    }
                });
            } else {
                res.json({
                    success: false,
                    fields: formErrors.getFormErrors(profileForm)
                });
            }
        } else {
            res.setStatusCode(500);
            res.json({
                success: false,
                errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
            });
        }

        return next();
    }
);

/**
 * UserUpdate
 * Endpoint used to create Custom Object with new user data provided from r5 webhook
 */
server.post('UserUpdate', function (req, res, next) {
    try {
        var userObj = JSON.parse(req.body);
        var reachFiveUserCustomObjectType = reachFiveHelper.getReachFiveUserCustomObjectType();
        var user = userObj.user;

        if (empty(user.id)) {
            LOGGER.warn('no user id was provided: ' + user);
            return next();
        }

        var userCustomObj = CustomObjectMgr.getCustomObject(reachFiveUserCustomObjectType, user.id);
        if (empty(userCustomObj)) {
            Transaction.wrap(function () {
                userCustomObj = CustomObjectMgr.createCustomObject(reachFiveUserCustomObjectType, user.id);
            });
        }

        // Add/update new user data to the Custom Object
        Transaction.wrap(function () {
            userCustomObj.custom.user = JSON.stringify(user);
        });
    } catch (error) {
        LOGGER.error('error occured when updating customer: ' + error);
    }

    res.setStatusCode(204);
    res.json({});
    return next();
});

server.get(
    'UncachedContext',
    function (req, res, next) {
        var context = {};

        // Numbers of the SSO login attempts in scope of the same anonymouse session
        var SSO_FORCED_AUTH_SESSION_ATTEMPT = 3;
        var isSessionAuthRequired = false;

        // SSO attempts controller
        // If the user has not been authenticated within "SSO_FORCED_AUTH_SESSION_ATTEMPT" attempts,
        // there is no point in continuing
        if (session.privacy.reachFiveSSOAuthCounter <= SSO_FORCED_AUTH_SESSION_ATTEMPT) {
            isSessionAuthRequired = reachFiveHelper.isReachFiveSessionForcedAuth()
                && !req.currentCustomer.raw.authenticated;
            session.privacy.reachFiveSSOAuthCounter += 1;
        }

        context.isSessionAuthRequired = isSessionAuthRequired;

        res.render('reachfiveinituncached', context);
        next();
});

module.exports = server.exports();