/* eslint-disable no-unused-vars */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-undef */
/* eslint-disable one-var */
/* eslint-disable no-use-before-define */
/* eslint-disable indent */
'use strict';

/**
 *
 * @module controllers/ReachFiveController
 */

/**
 * Reach Five Modules
 * */
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
var ReachFiveModel = require('*/cartridge/models/ReachFiveModel');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var dwStringUtils = require('dw/util/StringUtils');

/**
 * Script includes
 * */
var app = require(reachFiveHelper.getReachFivePreferences('cartridgeControllersName') + '/cartridge/scripts/app');
var guard = require(reachFiveHelper.getReachFivePreferences('cartridgeControllersName') + '/cartridge/scripts/guard');

/**
 * API Includes
 * */
var CustomerMgr = require('dw/customer/CustomerMgr');
var ContentMgr = require('dw/content/ContentMgr');
var Resource = require('dw/web/Resource');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');
var System = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');

/**
 * Service interface
 * */
var reachFiveService = require('*/cartridge/scripts/interfaces/reachFiveInterface');

/**
 * @function
 * @description Display javascript tags for ReachFive
 * */
function initReachFive() {
	var redirectUrl = '';
	var target = session.privacy.TargetLocation;

	// Need this parameter to redirect correctly
	if (request.httpParameterMap.cart.submitted) {
		session.privacy.TargetLocation = URLUtils.https('COShipping-Start').toString();
	} else if (target) {
		redirectUrl = target;
	}

    // Get request parameters to disable social login to prevent autologin with sso
    var disableSocialLogin = request.httpParameterMap.isParameterSubmitted('disableSocialLogin')
                            && request.httpParameterMap.disableSocialLogin.value === 'true';

	// Render view
	app.getView({
        isReachFiveEnabled: reachFiveHelper.isReachFiveEnabled(),
        isReachFiveLoginAllowed: reachFiveHelper.isReachFiveLoginAllowed(),
        reachFiveUiSdkUrl: reachFiveHelper.getReachFiveUiSdkUrl(),
        reachFiveDomain: reachFiveHelper.getReachFiveDomain(),
        reachFiveApiKey: reachFiveHelper.getReachFiveApiKey(),
        reachFiveLanguageCode: reachFiveHelper.getReachFiveLanguageCode(),
<<<<<<< Updated upstream
=======
        reachFivelocaleCode: reachFiveHelper.getReachFiveLocaleCode(),
>>>>>>> Stashed changes
        callbackUrl: URLUtils.https('ReachFiveController-CallbackReachFiveRequest'),
        theme: reachFiveHelper.getReachFiveTheme(),
        siteID: System.getCurrent().getID(),
        redirectUrl: redirectUrl,
        reachFiveTransition: reachFiveHelper.isReachFiveTransitionActive(),
        disableSocialLogin: disableSocialLogin
	}).render('account/login/reachfiveinit');

    return;
}

/**
 * @function
 * @description Display javascript tags for ReachFive
 * */
 function initReachFiveGlobal() {
    var targetPage = request.httpParameterMap.isParameterSubmitted('state') ? request.httpParameterMap.state.value : request.httpReferer;
    var ignoreSessionAuth = !reachFiveHelper.isReachFiveSessionForcedAuth() || customer.authenticated;

    // Mark Reach Five authentication attempt
    session.privacy.reachfive_auth_attempt = true;

    // Render view
    app.getView({
        isReachFiveEnabled: reachFiveHelper.isReachFiveEnabled(),
        reachFiveCoreSdkUrl: reachFiveHelper.getReachFiveCoreSdkUrl(),
        reachFiveDomain: reachFiveHelper.getReachFiveDomain(),
        reachFiveApiKey: reachFiveHelper.getReachFiveApiKey(),
        reachFiveLanguageCode: reachFiveHelper.getReachFiveLanguageCode(),
<<<<<<< Updated upstream
=======
        reachFivelocaleCode: reachFiveHelper.getReachFiveLocaleCode(),
>>>>>>> Stashed changes
        callbackUrl: URLUtils.https('ReachFiveController-CallbackReachFiveRequest'),
        ajaxLoginUrl: URLUtils.https('ReachFiveController-AjaxLogin'),
        ajaxSignUpUrl: URLUtils.https('ReachFiveController-AjaxSignUp'),
        reachFiveLogoutUrl: URLUtils.https('Login-Logout'),
        siteID: System.getCurrent().getID(),
        stateUrl: targetPage ? dwStringUtils.encodeBase64(targetPage) : null,
        checkSessionRedirectUrl: URLUtils.https('ReachFiveController-CallbackCheckSessionRequest'),
        isSessionAuthRequired: !ignoreSessionAuth,
        reachFiveCookieName: reachFiveHelper.getReachFiveCookieName(),
        reachFiveLoginCookieName: reachFiveHelper.getReachFiveLoginCookieName()
    }).render('components/footer/reachfiveinitglobal');

    return;
}

/**
 * @function
 * @description This method will be used as callback for ajax request after reachfive request
 * @return {void}
 *
 * */
function callbackReachFiveRequest() {
	//	Step 2: Handle the Authorization Response
	var code = request.httpParameterMap.code.value;
	var error = request.httpParameterMap.error.value;

	//	session.privacy.TargetLocation = request.httpParameterMap.redirectUrl.value;
	if (error || error === '') {
		var message = !!request.httpParameterMap.error.value ? request.httpParameterMap.error.value : '';
		LOGGER.warn('access denied: reach5 response: ' + message);
		return loginFailed('genericerror');
	}

	//	Step 3: Exchange authorization code for ID token
	var authorizationResponse = reachFiveService.exchangeAuthorizationCodeForIDToken({ code: code });

	if (!authorizationResponse) {
		LOGGER.warn('authorization error : for code ' + code);
		return loginFailed('genericerror');
	}

	var idToken = authorizationResponse.id_token;

	var decoded = reachFiveHelper.reachFiveTokenDecode(idToken);
	var externalProfile = JSON.parse(decoded.toString());

	setReachFiveAuthorizationInSession(authorizationResponse);
	setExternalProfileInSession(externalProfile);

	var email = externalProfile.email;

	if (reachFiveHelper.isReachFiveLoginAllowed() && empty(email)) {
		LOGGER.warn('email empty not allowed : for code ' + code);
		return loginFailed('emailerror');
	}

	var externalID = externalProfile.sub.trim();
	var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
    var Customer = app.getModel('Customer');
    var reachFiveLoginForm = app.getForm('reachfivelogin');
    var isExternalIdSaved = false;
    var target = session.privacy.TargetLocation;
    var loggedCustomer, existingCustomer, isSavedInR5;

    // Logger debug for profile
    LOGGER.debug('Parsed UserId "{0}" from response: {1}', externalID, externalProfile);

    // Check if an account with reachfive provider id exist
    var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(reachFiveProviderId, externalID);

    if (!profile) {
		existingCustomer = !!email ? Customer.retrieveCustomerByLogin(email) : null;
        if (existingCustomer != null && existingCustomer.getExternalProfiles() != null && existingCustomer.getExternalProfiles().length === 0) {
			// Case : We found one customer in Demandware with this login / email. So we have to link customer account with provider reachfive
			// clear fields
			reachFiveLoginForm.clear();
			// Set external ID in session before redirect
			reachFiveLoginForm.setValue('externalid', externalID);
			var socialNameResponse = !empty(externalProfile.auth_type) ? externalProfile.auth_type : '';

            Transaction.wrap(function () {
                existingCustomer.createExternalProfile(reachFiveProviderId, externalID);
            });

			return loginRedirect(URLUtils.https(
				'ReachFiveController-InitLinkAccount',
				'ReachFivesocialName',
				socialNameResponse,
				'email',
				email
			).toString());
        // eslint-disable-next-line no-else-return
        } else {
			// Get profile with email and if email is not null
			if (!!email) {
				profile = CustomerMgr.searchProfiles('email = {0}', 'lastLoginTime desc', email).first();
			}

			// if profile because an email was found, we change external ID and provider ID for the found profile
			if (profile !== null) {
				// Case : If a user has already an account with provider, so no login and password
				// Set external ID and provider ID for the profile found
				isExternalIdSaved = ReachFiveModel.setExternalParams(externalID, profile);
			} else {
				// Case : Create a new customer
				// Create customer with external profile

				// If we want to create a new customer without prefill form
				// eslint-disable-next-line no-lonely-if
				if (!!email && reachFiveHelper.isFastRegister()) {
					profile = ReachFiveModel.createReachFiveCustomer(externalID, externalProfile);
				} else {
					prefillForm(externalID, externalProfile);
					target = URLUtils.https('ReachFiveController-StartPrefillRegister').toString();

					return loginRedirect(target);
				}
			}
			// Login externally customer
			if (profile) {
				loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile, email);
                reachFiveHelper.setReachFiveLoginCookie();
			}
			// If customer was logged, redirect to account show
			if (loggedCustomer) {
				// Save ID Demandware of customer with Reach Five API Rest.
				isSavedInR5 = afterLogin();
				return loginRedirect(target);
			}
		}
     } else {
		// Case : Login a customer with reachfive provider
		// Login externally customer
		loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile);
        reachFiveHelper.setReachFiveLoginCookie();

        return loginRedirect(target);
     }
     // If any condition above was validated, the externally login failed
     return loginFailed('genericerror');
}

/**
 * @function
 * @description This method will be used as callback for ajax request after check session request
 * @return {void}
 *
 * */
 function callbackCheckSessionRequest() {
	//	Step 2: Handle the Authorization Response
	var code = request.httpParameterMap.code.value;
    var stateUrl = request.httpParameterMap.isParameterSubmitted('state')
        ? dwStringUtils.decodeBase64(request.httpParameterMap.state.value)
        : URLUtils.https('Account-Show').toString();
	var error = request.httpParameterMap.error.value;

	//	session.privacy.TargetLocation = request.httpParameterMap.redirectUrl.value;
	if (error || error === '') {
		var message = !!request.httpParameterMap.error.value ? request.httpParameterMap.error.value : '';
		LOGGER.warn('access denied: reach5 response: ' + message);
		return loginFailed('genericerror');
	}

	//	Step 3: Exchange authorization code for ID token
	var authorizationResponse = reachFiveService.exchangeAuthorizationCodeForIDToken({
        code: code,
        redirectUrl: URLUtils.https('ReachFiveController-CallbackCheckSessionRequest').toString()
    });

	if (!authorizationResponse) {
		LOGGER.warn('authorization error : for code ' + code);
		return loginFailed('genericerror');
	}

	var idToken = authorizationResponse.id_token;
	var decoded = reachFiveHelper.reachFiveTokenDecode(idToken);
	var externalProfile = JSON.parse(decoded.toString());

	setReachFiveAuthorizationInSession(authorizationResponse);
	setExternalProfileInSession(externalProfile);

	var email = externalProfile.email;

	if (reachFiveHelper.isReachFiveLoginAllowed() && empty(email)) {
		LOGGER.warn('email empty not allowed : for code ' + code);
		return loginFailed('emailerror');
	}

	var externalID = externalProfile.sub.trim();
	var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
    var loggedCustomer;

    // Logger debug for profile
    LOGGER.debug('Parsed UserId "{0}" from response: {1}', externalID, externalProfile);

    // Check if an account with reachfive provider id exist
    var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(reachFiveProviderId, externalID);

    if (profile) {
        // Case : Login a customer with reachfive provider
        // Login externally customer
        loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile);
        reachFiveHelper.setReachFiveLoginCookie();

        return loginRedirect(stateUrl);
    }
    // If any condition above was validated, the externally login failed
    return loginFailed('genericerror');
}

/**
 * Set Reachfive Authorization in Session
 * @param {Object} authorizationResponse Service Response
 */
function setReachFiveAuthorizationInSession(authorizationResponse) {
	session.privacy.access_token = authorizationResponse.access_token;
	session.privacy.id_token = authorizationResponse.id_token;
}

/**
 * Set External Profil in Session
 * @param {Object} externalProfile External Profil Object
 */
function setExternalProfileInSession(externalProfile) {
	session.privacy.auth_type = externalProfile.auth_type;
}

/**
 * @function
 * @description Display link login form. Case : We found an account which external email is equal to one account login email.
 */
function initLinkAccount() {
    // Update Meta on page
	var pageMeta = require(reachFiveHelper.getReachFivePreferences('cartridgeControllersName') + '/cartridge/scripts/meta');
    var content = ContentMgr.getContent('myaccount-linkAccountLogin');

    if (content) {
        pageMeta.update(content);
    }

    // Clear Login from
    var loginForm = app.getForm('login');
    loginForm.clear();

    // Prefill login form if the user is registered
    if (request.httpParameterMap.email) {
        loginForm.setValue('username', request.httpParameterMap.email.value);
        loginForm.setValue('rememberme', true);
    }

    // Prepare view and render
    app.getView({
        RegistrationStatus: false,
        ReachFivesocialName: request.httpParameterMap.ReachFivesocialName.stringValue,
        ShowStandardLoginToLinkAccount: true,
        ContinueURL: URLUtils.https('ReachFiveController-HandleLinkForm')
    }).render('account/login/reachfivelinkform');
    return;
}

/**
 * @function
 * @description Form handler for the link login form. Handles the following actions
 */
function handleLinkForm() {
	var loginForm = app.getForm('login');
	var reachFiveLogin = app.getForm('reachfivelogin');

    loginForm.handleAction({
        login: function () {
			var Customer = app.getModel('Customer');
			var success = Customer.login(loginForm.getValue('username'), loginForm.getValue('password'), loginForm.getValue('rememberme'));

			if (!success) {
				loginForm.get('loginsucceeded').invalidate();
				app.getView({
					RegistrationStatus: false,
					ContinueURL: URLUtils.https('ReachFiveController-HandleLinkForm')
				}).render('account/login/reachfivelinkform');
				return;
            // eslint-disable-next-line no-else-return
            } else {
                loginForm.clear();
            }

            // In case of successful login
            // Save external id and Provider ID for the next social login
            var externalID = reachFiveLogin.getValue('externalid');
            var redirectURL = session.privacy.TargetLocation;
            var isExternalIdSaved = false;

            if (externalID) {
				// Set external ID and provider ID on customer credentials
				isExternalIdSaved = ReachFiveModel.setExternalParams(externalID, customer.getProfile());
				// Save ID Demandware of customer in Reach Five
				var isSavedInR5 = afterLogin();
				// Clear Form after login
				reachFiveLogin.clear();
			}

            if (!redirectURL) {
				redirectURL = URLUtils.https('Account-Show').toString();
            }
            // Redirect customer
            response.redirect(redirectURL);

            return;
        },
        error: function () {
            app.getView('Login').render();
            return;
        }
    });
}

/**
 * @function
 * @description this method will be used if one step of reachfive process failed. We will redirect to target URL
 * @param {string} errorCode Error Code
 * @return {void}
 * */
function loginFailed(errorCode) {
	var t = Resource.msg('reachfive.' + errorCode, 'reachfive', 'Error during process login');
	return app.getView('Login', { errorMsg: t }).render();
}

/**
 * @function
 * @description Redirect Customer to target URL if login reachfive process succeeded
 * @param {string} targetUrl Target URL
 * */
function loginRedirect(targetUrl) {
	if (!targetUrl || targetUrl === '') {
		// eslint-disable-next-line no-param-reassign
		targetUrl = URLUtils.https('Account-Show').toString();
	}
	response.redirect(targetUrl);
	return;
}

/**
 * @function
 * @description Link 2 accounts.
 */
function LinkAccounts() {
	var httpParameterMap = request.httpParameterMap;
	var externalid = !httpParameterMap.externalid.empty ? httpParameterMap.externalid.stringValue : null;
	var isExternalIdSaved = ReachFiveModel.setExternalParams(externalid, customer.getProfile());
	var r = require('*/cartridge/scripts/util/Response');
	r.renderJSON({ id: externalid, isSaved: isExternalIdSaved });
}

/**
 * @function
 * @description Delete target URL in session after login
 * @return {boolean} True if successfull login
 * */
function afterLogin() {
	// Delete target URL in session after login
	if (session.privacy.TargetLocation) {
		delete session.privacy.TargetLocation;
	}
	return true;
}


/**
 * @function
 * @description Fill the creation form fields with the reach5 callback customer object
 * @param {string} externalID External ID
 * @param {Object} externalProfile External Profil
 * */
var prefillForm = function (externalID, externalProfile) {
	// prefill form profile
	var profileForm = app.getForm('profile.customer');
	var reachFiveLoginForm = app.getForm('reachfivelogin');

	// clear fields before prefill
	reachFiveLoginForm.clear();
	profileForm.clear();

	// Set external ID and provider ID for later
	reachFiveLoginForm.setValue('externalid', externalID);

	// Complete customer's profile with firstname, lastname, email and birthday if exists
	if (reachFiveHelper.isFieldExist(externalProfile, 'family_name')) {
		profileForm.setValue('lastname', externalProfile.family_name);
	}

	if (reachFiveHelper.isFieldExist(externalProfile, 'given_name')) {
		profileForm.setValue('firstname', externalProfile.given_name);
	}

	if (reachFiveHelper.isFieldExist(externalProfile, 'email')) {
		profileForm.setValue('email', externalProfile.email);
	}

	if (reachFiveHelper.isFieldExist(externalProfile, 'birthdate')) {
		var c = new Calendar();
		c.parseByFormat(externalProfile.birthdate, 'yyyy-MM-dd');
		profileForm.setValue('birthday', c.getTime());
	}
};

/**
 * Clears the profile form, adds the email address from login as the profile email address,
 * and renders customer registration page.
 */
function startPrefillRegister() {
    if (app.getForm('login.username').value() !== null) {
        app.getForm('profile.customer.email').object.value = app.getForm('login.username').object.value;
    }

    app.getView({
        ContinueURL: URLUtils.https('Account-RegistrationForm'),
        disableSocialLogin: true
    }).render('account/user/registration');
}

/**
 * Action after Prefill
 * @returns {boolean} True or False
 */
function afterPrefillSave() {
	var reachFiveLoginForm = app.getForm('reachfivelogin');
	var externalID = reachFiveLoginForm.getValue('externalid');
	var profile = customer.getProfile();
	// Save external parameters on profile
	return ReachFiveModel.setExternalParams(externalID, profile);
}

/**
 * Show Social Accounts
 */
function showSocialAccounts() {
	var	isReachFiveEnabled = reachFiveHelper.isReachFiveEnabled();
	var	isReachFiveLoginAllowed = reachFiveHelper.isReachFiveLoginAllowed();
	var reachFiveLogin = app.getForm('reachfivelogin');
	var externalID = customer.getExternalProfiles().iterator().next.getExternalID();
	var accessToken = reachFiveService.generateToken();
	var callbackUrl = URLUtils.https('Account-EditProfile');
	// Render view
    app.getView({
		IsReachFiveEnabled: isReachFiveEnabled,
		IsReachFiveLoginAllowed: isReachFiveLoginAllowed,
		AccessToken: accessToken,
		ExternalID: externalID,
		CallbackUrl: callbackUrl
    }).render('account/login/showreachfivesociallogincomponent');
    return;
}

/**
 * Internal function that reads the URL that should be redirected to after successful login
 * @return {dw.web.Url} The URL to redirect to in case of success
 * or {@link module:controllers/Account~Show|Account controller Show function} in case of failure.
 */
 function getTargetUrl() {
    if (session.custom.TargetLocation) {
        var target = session.custom.TargetLocation;
        delete session.custom.TargetLocation;
        // @TODO make sure only path, no hosts are allowed as redirect target
        dw.system.Logger.info('Redirecting to "{0}" after successful login', target);
        return decodeURI(target);
    }

    return URLUtils.https('Account-Show');
}

/**
 * ReachFive Login for conversion option
 * For ajax requests, renders the account/login/reachfiveloginjson
 */
function ajaxLogin() {
    var loginForm = app.getForm('login');

    var jsonObj = {
        error: true,
        errorFields: []
    };
    var username = loginForm.getValue('username');
    var password = loginForm.getValue('password');
    var rememberMe = loginForm.getValue('rememberme');
    var authenticatedCustomer = null;

    var TempCustomer = CustomerMgr.getCustomerByLogin(username);

    if (typeof (TempCustomer) !== 'undefined' && TempCustomer !== null && TempCustomer.profile !== null && TempCustomer.profile.credentials.locked) {
        jsonObj.errorMessage = Resource.msg('account.login.logininclude.locked', 'account', null);
    } else if (TempCustomer != null && TempCustomer.profile != null && (TempCustomer.profile.credentials.remainingLoginAttempts === 1)) {
        jsonObj.errorMessage = Resource.msg('account.login.logininclude.willbelocked', 'account', null);
    } else {
        authenticatedCustomer = Transaction.wrap(function () {
            return CustomerMgr.loginCustomer(username, password, rememberMe);
        });
    }

    if (authenticatedCustomer) {
    // Check does it customer has external reach five profile if yes - logout, return success response
    // If matched external reach five profile does not exist try to create profile with this login and pass
        // If profile was created proper - logout, return success response
        // If profile was not created because of password policy - return error or force customer to create external profile with new password ????????
        // If profile already exist - !!!!!!!!!!! not described behavior, potential risk.
        var profile = customer.profile;
        if (customer && profile) {
            var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();

            // Check does the customer profile already contain reachfive account
            var customerReachFiveProfile = reachFiveHelper.getCustomerReachFiveExtProfile(customer);

            if (!customerReachFiveProfile) {
                // Sign up customer R5 account with same login and password
                var signUpResult = reachFiveService.signUp(username, password, profile);

                if (signUpResult.ok) {
                    Transaction.wrap(function () {
                        customerReachFiveProfile = customer.createExternalProfile(reachFiveProviderId, signUpResult.object.id);
                    });
                } else {
                    // TODO: Error during new customer registration need to be processed separatly
                    //      Potentially we could return some specific error and block logging
                    //      Or detect signUpResult.errorMessage and based on error display something
                    jsonObj.redirectUrl = getTargetUrl();
                }
            }

            if (customerReachFiveProfile) {
                jsonObj.error = false;
            }
        }
    } else {
        // Customer was not propertly logged need to return error
        if (!Object.hasOwnProperty.call(jsonObj, 'errorMessage')) {
            jsonObj.errorMessage = Resource.msg('account.login.logininclude.loginerror', 'account', null);
        }
        loginForm.get('loginsucceeded').invalidate();
    }

    // Render view
    app.getView({ data: jsonObj }).render('account/login/reachfivejson');
    return;
}

/**
 * ReachFive SignUp for conversion option
 * For ajax requests, renders the account/login/reachfivejson
 */
function ajaxSignUp() {
    var email, emailConfirmation, orderNo, profileValidation, password, passwordConfirmation, existingCustomer, Customer, target;

    Customer = app.getModel('Customer');
    email = app.getForm('profile.customer.email').value();
    emailConfirmation = app.getForm('profile.customer.emailconfirm').value();
    orderNo = app.getForm('profile.customer.orderNo').value();
    profileValidation = true;
    var jsonObj = {
        error: true,
        errorFields: []
    };

    if (email !== emailConfirmation) {
        app.getForm('profile.customer.emailconfirm').invalidate();
        profileValidation = false;

        jsonObj.errorFields.push({
            name: session.forms.profile.customer.emailconfirm.htmlName,
            error: Resource.msg(session.forms.profile.customer.emailconfirm.error, 'forms', null)
        });
    }

    password = app.getForm('profile.login.password').value();
    passwordConfirmation = app.getForm('profile.login.passwordconfirm').value();

    if (password !== passwordConfirmation) {
        app.getForm('profile.login.passwordconfirm').invalidate();
        profileValidation = false;

        jsonObj.errorFields.push({
            name: session.forms.profile.login.passwordconfirm.htmlName,
            error: Resource.msg(session.forms.profile.login.passwordconfirm.error, 'forms', null)
        });
    }

    // Checks if login is already taken.
    existingCustomer = Customer.retrieveCustomerByLogin(email);
    if (existingCustomer !== null) {
        app.getForm('profile.customer.email').invalidate();
        profileValidation = false;

        jsonObj.errorFields.push({
            name: session.forms.profile.customer.email.htmlName,
            error: Resource.msg(session.forms.profile.customer.email.error, 'forms', null)
        });
    }

    if (profileValidation) {
        profileValidation = Customer.createAccount(email, password, app.getForm('profile'));

        if (orderNo) {
            var orders = OrderMgr.searchOrders('orderNo={0} AND status!={1}', 'creationDate desc', orderNo,
                    dw.order.Order.ORDER_STATUS_REPLACED);
            if (orders) {
                var foundOrder = orders.next();
                Transaction.wrap(function () {
                    foundOrder.customer = profileValidation;
                });
                session.custom.TargetLocation = URLUtils.https('Account-Show', 'Registration', 'true');
            }
        }
    }

    if (profileValidation) {
        // Sign up customer R5 account with same login and password
        var signUpResult = reachFiveService.signUp(email, password, profileValidation.profile);
        var customerReachFiveProfile = null;
        var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();

        if (signUpResult.ok) {
            Transaction.wrap(function () {
                customerReachFiveProfile = profileValidation.createExternalProfile(reachFiveProviderId, signUpResult.object.id);
            });
        } else {
            // TODO: Error during new customer registration need to be processed separatly
            //      Potentially we could return some specific error and block logging
            //      Or detect signUpResult.errorMessage and based on error display something
            jsonObj.redirectUrl = getTargetUrl();
        }

        if (customerReachFiveProfile) {
            jsonObj.error = false;
        }

        app.getForm('profile').clear();
    }

    // Render view
    app.getView({ data: jsonObj }).render('account/login/reachfivejson');
    return;
}

/*
 * Web exposed methods
 */
/**
 * @see module:controllers/ReachFiveController~Init */
exports.Init = guard.ensure(['get', 'https'], initReachFive);
/**
 * @see module:controllers/ReachFiveController~InitGlobal */
exports.InitGlobal = guard.ensure(['get', 'https'], initReachFiveGlobal);
/** Form handler for the login form.
 * @see module:controllers/ReachFiveController~CallbackReachFiveRequest */
exports.CallbackReachFiveRequest = guard.ensure(['get', 'https'], callbackReachFiveRequest);
/** @see module:controllers/ReachFiveController~CallbackCheckSessionRequest */
exports.CallbackCheckSessionRequest = guard.ensure(['get', 'https'], callbackCheckSessionRequest);
/** @see module:controllers/ReachFiveController~InitLinkAccount */
exports.InitLinkAccount = guard.ensure(['get', 'https'], initLinkAccount);
/** @see module:controllers/ReachFiveController~HandleLinkForm */
exports.HandleLinkForm = guard.ensure(['post', 'https'], handleLinkForm);
/** @see {@link module:controllers/ReachFiveController~startPrefillRegister} */
exports.StartPrefillRegister = guard.ensure(['https'], startPrefillRegister);
/** @see module:controllers/ReachFiveController~LinkAccounts */
exports.LinkAccounts = guard.ensure(['get', 'https'], LinkAccounts);
/** @see module:controllers/ReachFiveController~ShowSocialAccounts */
exports.ShowSocialAccounts = guard.ensure(['get', 'https', 'loggedIn'], showSocialAccounts);
exports.afterPrefillSave = guard.ensure(['get', 'https'], afterPrefillSave);
/** Return AJAX login result operation for conversion state
 * @see module:controllers/ReachFiveController~AjaxLogin */
exports.AjaxLogin = guard.ensure(['https', 'post', 'csrf'], ajaxLogin);
/** Return AJAX Sign Up result operation for conversion state
 * @see module:controllers/ReachFiveController~AjaxLogin */
exports.AjaxSignUp = guard.ensure(['https', 'post', 'csrf'], ajaxSignUp);
