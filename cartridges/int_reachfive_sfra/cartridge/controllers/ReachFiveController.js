'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Reach Five Modules
 * */
var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
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

    var reditectUrl = target;
    if (loggedCustomer && customerRoute) {
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            Transaction.wrap(function () {
                currentBasket.setCustomerEmail(loggedCustomer.profile.email);
            });
        } else {
            reditectUrl = URLUtils.url('Cart-Show').toString();
        }
    }

    return reditectUrl;
}

server.get(
	'CallbackReachFiveRequest',
	function (req, res, next) {
		//	Step 2: Handle the Authorization Response
		var code = request.httpParameterMap.code.value;
		var error = request.httpParameterMap.error.value;

		//	session.privacy.TargetLocation = request.httpParameterMap.redirectUrl.value;
		if (error || error === '') {
			var message = !!request.httpParameterMap.error_description.value ? request.httpParameterMap.error_description.value : '';
			LOGGER.warn('access denied: reach5 response: ' + message);

			loginFailedNoCode(message, res);
			return next();
		}

		//	Step 3: Exchange authorization code for ID token
		var authorizationResponse = reachFiveService.exchangeAuthorizationCodeForIDToken({ code: code });

		if (!authorizationResponse) {
			LOGGER.warn('authorization error : for code ' + code);
			loginFailed('genericerror', res);
			return next();
		}

		var idToken = authorizationResponse.id_token;
		var decoded = reachFiveHelper.reachFiveTokenDecode(idToken);
		var externalProfile = JSON.parse(decoded.toString());

		setReachFiveAuthorizationInSession(authorizationResponse);
		setExternalProfileInSession(externalProfile);

		var email = externalProfile.email;

		if (reachFiveHelper.isReachFiveLoginAllowed() && empty(email)) {
			LOGGER.warn('email empty not allowed : for code ' + code);
			loginFailed('emailerror', res);
			return next();
		}

		var externalID = externalProfile.sub.trim();
		var reachFiveProviderId = reachFiveHelper.getReachFiveProviderId();
		var reachFiveLoginForm = server.forms.getForm('reachfivelogin');
		var isExternalIdSaved = false;
		var loggedCustomer, existingCustomer, isSavedInR5;
		var reachFiveUserInfo = null;
		var reachFiveConsents = null;
        var PASSWORD_TYPES = [
            'password',
            'phone_number_password',
            'refresh',
            'webauthn',
            'login_as',
            'sms'
        ];

        // Determinate correct target for page
        var target = session.privacy.TargetLocation;
        var stateObj = {
            redirectURL: null,
            handleCustomerRoute: false
        };
        if (request.httpParameterMap.isParameterSubmitted('state')) {
            var stateObjStr = dwStringUtils.decodeBase64(request.httpParameterMap.state.value);
            try {
                stateObj = JSON.parse(stateObjStr);
            } catch (err) {
                LOGGER.error('Error during state object parsing: {0}', err);
            }
            if (stateObj.redirectURL) {
                target = stateObj.redirectURL;
            }
        } else if (!target) {
            target = URLUtils.https('Account-Show').toString();
        }

		// Logger debug for profile
		LOGGER.debug('Parsed UserId "{0}" from response: {1}', externalID, externalProfile);

		// Check if an account with reachfive provider id exist
		var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(reachFiveProviderId, externalID);

		if (!profile) {
			existingCustomer = !!email ? CustomerMgr.getCustomerByLogin(email) : null;
			if (existingCustomer != null && existingCustomer.getExternalProfiles() != null && existingCustomer.getExternalProfiles().length === 0) {
				// Case : We found one customer in Demandware with this login / email. So we have to link customer account with provider reachfive
				// clear fields
				reachFiveLoginForm.clear();
				// Set external ID in session before redirect
				reachFiveLoginForm.externalid.value = externalID;
				var socialNameResponse = !empty(externalProfile.auth_type) ? externalProfile.auth_type : '';

                var profilesLinked = false;
                if (PASSWORD_TYPES.indexOf(socialNameResponse) === -1) {
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
					if (!!email && (reachFiveHelper.isFastRegister() || externalProfile.auth_type === 'password')) {
						reachFiveUserInfo = reachFiveService.getUserInfo(authorizationResponse.access_token);

						if (reachFiveUserInfo.ok) {
							reachFiveConsents = reachFiveUserInfo.object.consents;
						} else {
							LOGGER.warn('getUserInfo issue. reach5 service response: ' + reachFiveUserInfo.errorMessage);
						}

						profile = ReachFiveModel.createReachFiveCustomer(externalID, externalProfile, reachFiveConsents);
					} else {
						prefillForm(externalID, externalProfile);
						target = URLUtils.https('ReachFiveController-StartPrefillRegister').toString();
                        var profileSettledObj = reachFiveHelper.settleReachFiveProfileObject(externalProfile);
                        req.session.privacyCache.set('reachFivePrefilRegister', JSON.stringify(profileSettledObj));

						loginRedirect(target, res);
						return next();
						// LOGGER.debug('Creating customer with prefill form');
					}
				}
				// Login externally customer
				if (profile) {
					loggedCustomer = ReachFiveModel.loginReachFiveCustomer(externalID, profile, email);
				}
				// If customer was logged, redirect to account show
				if (loggedCustomer) {
					// Save ID Demandware of customer with Reach Five API Rest.
					// isSavedInR5 = afterLogin();
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
 * Set Reachfive Authorization in Session
 * @param {Object} authorizationResponse Service Response
 */
function setReachFiveAuthorizationInSession(authorizationResponse) {
	session.privacy.access_token = authorizationResponse.access_token;
	session.privacy.id_token = authorizationResponse.id_token;
}

/**
 * Set External Profile in Session
 * @param {Object} externalProfile External Profile Object
 */
function setExternalProfileInSession(externalProfile) {
	session.privacy.auth_type = externalProfile.auth_type;
	LOGGER.debug('Setting External Profile in Session');
}

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

		res.render('account/login/reachfivelinkform', {
            disableSSOLogin: true,
			rememberMe: rememberMe,
			userName: userName,
			actionUrl: URLUtils.https('ReachFiveController-HandleLinkForm'),
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
		var checkoutLogin = req.querystring.checkoutLogin;
		// var redirectURL = session.privacy.TargetLocation;

		Transaction.wrap(function () {
			authenticatedCustomer = CustomerMgr.loginCustomer(email, password, rememberMe);
		});
		if (authenticatedCustomer && authenticatedCustomer.authenticated) {
			var externalID = reachFiveLoginForm.externalid.value;
			// TODO: TargetLocation not used
            var redirectURL = session.privacy.TargetLocation;
			var isExternalIdSaved = false;

			if (externalID) {
				// Set external ID and provider ID on customer credentials
				isExternalIdSaved = ReachFiveModel.setExternalParams(externalID, customer.getProfile());
				// Save ID Demandware of customer in Reach Five
				// var isSavedInR5 = afterLogin();
			}

			var targetUrl = checkoutLogin ? URLUtils.url('Checkout-Begin') : URLUtils.url('Account-Show');

			loginRedirect(targetUrl, res);
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
 * @description After reachfive login process we need to send to reachfive the demandware customer number. we'll use the API Rest of Reachfive for this request
 * @return {boolean} True if session is cleaned
 * */
function afterLogin() {
    // TODO: Potentialy not used
	// Set Session authentication type
	session.privacy.auth_type = 'sfcc';
	// TODO: NOT USED. Delete target URL in session after login
	if (session.privacy.TargetLocation) {
		delete session.privacy.TargetLocation;
	}
	return true;
}

/**
 * @function
 * @description Fill the creation form fields with the reach5 callback customer object
 * @param {string} externalID External Identifier
 * @param {Object} externalProfile External Profile
 * */
var prefillForm = function (externalID, externalProfile) {
	// prefill form profile
	var profileForm = server.forms.getForm('profile');
	var reachFiveLoginForm = server.forms.getForm('reachfivelogin');

	// clear fields before prefill
	reachFiveLoginForm.clear();
	profileForm.clear();

	// Set external ID and provider ID for later
	reachFiveLoginForm.externalid.value = externalID;

	// Complete customer's profile with firstname, lastname, email and birthday if exists
	if (reachFiveHelper.isFieldExist(externalProfile, 'family_name')) {
		profileForm.customer.lastname.value = externalProfile.family_name;
	}

	if (reachFiveHelper.isFieldExist(externalProfile, 'given_name')) {
		profileForm.customer.firstname.value = externalProfile.given_name;
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
        if (req.session.privacyCache.get('reachFivePrefilRegister')) {
            var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', 1, 'preg', 1).relative().toString();

            var breadcrumbs = [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ];

            var profileForm = server.forms.getForm('profile');

            res.render('/account/loginPrefill', {
                disableSSOLogin: true,
                profileForm: profileForm,
                breadcrumbs: breadcrumbs,
                createAccountUrl: createAccountUrl
            });
        } else {
            res.redirect(URLUtils.url('Login-Show'));
        }

        next();
    }
);

// TODO: Not used. Remove
server.get('afterPrefillSave', function (req, res, next) {
    var reachFiveLoginForm = server.forms.getForm('reachfivelogin');
    var externalID = reachFiveLoginForm.externalid.value;
    var profile = customer.getProfile();

    // Save external parameters on profile
    var isSavedExternalParameters = ReachFiveModel.setExternalParams(externalID, profile);

    return isSavedExternalParameters;
});

server.post(
	'SaveProfileR5',
	server.middleware.https,
	csrfProtection.validateAjaxRequest,
	function (req, res, next) {
		var formErrors = require('*/cartridge/scripts/formErrors');
		var profileForm = server.forms.getForm('profile');
		var result = {
			firstName: profileForm.customer.firstname.value,
			lastName: profileForm.customer.lastname.value,
			profileForm: profileForm
		};

		if (profileForm.valid) {
			res.setViewData(result);
			this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
				var formInfo = res.getViewData();
				var customer = CustomerMgr.getCustomerByCustomerNumber(
					req.currentCustomer.profile.customerNo
				);
				var profile = customer.getProfile();

                // Prepare ReachFive request Object
                var profileRequestObj = {
                    name: formInfo.firstName + ' ' + formInfo.lastName,
                    given_name: formInfo.firstName,
                    family_name: formInfo.lastName
                };

                // Update ReachFive remote with Identity API
                var updateResult = reachFiveHelper.updateReachFiveProfile(profileRequestObj);

                if (updateResult && updateResult.ok) {
                    Transaction.wrap(function () {
                        profile.setFirstName(formInfo.firstName);
                        profile.setLastName(formInfo.lastName);
                    });

                    delete formInfo.profileForm;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                } else {
                    formInfo.profileForm.customer.lastname.valid = false;
                    formInfo.profileForm.customer.lastname.error = Resource.msg('reachfive.server.error', 'reachfive', null);
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
	'SaveProfileSocialLogin',
	server.middleware.https,
	csrfProtection.validateAjaxRequest,
	function (req, res, next) {
		var formErrors = require('*/cartridge/scripts/formErrors');
		var profileForm = server.forms.getForm('profile');

		// form validation
		if (profileForm.customer.email.value.toLowerCase() !== profileForm.customer.emailconfirm.value.toLowerCase()) {
			profileForm.valid = false;
			profileForm.customer.email.valid = false;
			profileForm.customer.emailconfirm.valid = false;
			profileForm.customer.emailconfirm.error =
				Resource.msg('error.message.mismatch.email', 'forms', null);
		}

		var result = {
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
				var formInfo = res.getViewData();
				var customer = CustomerMgr.getCustomerByCustomerNumber(
					req.currentCustomer.profile.customerNo
				);
				var profile = customer.getProfile();

                // Prepare ReachFive request Object
                var profileRequestObj = {
                    name: formInfo.firstName + ' ' + formInfo.lastName,
                    given_name: formInfo.firstName,
                    family_name: formInfo.lastName
                    // phone_number: formInfo.phone
                };

                // Update ReachFive remote with Identity API
                var updateResult = reachFiveHelper.updateReachFiveProfile(profileRequestObj);

                if (updateResult && updateResult.ok) {
                    var customerLogin;
                    var status;

                    delete formInfo.confirmEmail;

                    Transaction.wrap(function () {
                        profile.setFirstName(formInfo.firstName);
                        profile.setLastName(formInfo.lastName);
                        profile.setEmail(formInfo.email);
                        profile.setPhoneHome(formInfo.phone);
                    });

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                } else {
                    // Response errors processing
                    var errorField = 'emailconfirm';
                    var errorMessage = Resource.msg('reachfive.server.error', 'reachfive', null);
                    if (updateResult && updateResult.object && updateResult.object.error === 'invalid_request' && updateResult.object.error_details.length) {
                        if (updateResult.object.error_details[0].field === 'phone_number') {
                            errorField = 'phone';
                        } else if (updateResult.object.error_details[0].field === 'given_name') {
                            errorField = 'firstname';
                        } else if (updateResult.object.error_details[0].field === 'family_name') {
                            errorField = 'lastname';
                        }
                        errorMessage = updateResult.object.error_details[0].message;
                    }

                    formInfo.profileForm.customer[errorField].valid = false;
                    formInfo.profileForm.customer[errorField].error = errorMessage;

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
