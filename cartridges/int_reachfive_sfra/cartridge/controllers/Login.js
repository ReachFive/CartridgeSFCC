'use strict';

var server = require('server');
server.extend(module.superModule);

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

//here we need to logout from reach5 too
server.append('Logout', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');

    CustomerMgr.logoutCustomer(false);
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

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

/**
 * Login-OAuthLogin : This endpoint invokes the External OAuth Providers Login
 * @name Base/Login-OAuthLogin
 * @function
 * @memberof Login
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - oauthProvider - ID of the OAuth Provider. e.g. Facebook, Google
 * @param {querystringparameter} - oauthLoginTargetEndPoint - Valid values for this parameter are 1 or 2. These values are mapped in oAuthRenentryRedirectEndpoints.js
 * @param {category} - sensitive
 * @param {renders} - isml if there is an error
 * @param {serverfunction} - get
 */
server.replace('OAuthLogin', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var Resource = require('dw/web/Resource');
    // perhaps better to add some behavior like redirectEndPoint allowed...
    // see default OAuthLogin endpoint
    if (req.querystring.oauthProvider) {
        var oauthProvider = req.querystring.oauthProvider;
        var result = oauthLoginFlowMgr.initiateOAuthLogin(oauthProvider);
        req.session.privacyCache.set('OAuthProviderId', oauthProvider);
        session.custom.OAuthProviderID = oauthProvider;

        if (result) {
            res.redirect(result.location);
        } else {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });

            return next();
        }
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    return next();
});

/**
 * Login-OAuthReentry : This endpoint is called by the External OAuth Login Provider (Facebook, Google etc. to re-enter storefront after shopper logs in using their service
 * @name Base/Login-OAuthReentry
 * @function
 * @memberof Login
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - code - given by facebook
 * @param {querystringparameter} - state - given by facebook
 * @param {category} - sensitive
 * @param {renders} - isml only if there is a error
 * @param {serverfunction} - get
 */
server.replace('OAuthReentry', server.middleware.https, consentTracking.consent, function (req, res, next) {
    // why not put these requires at the top of the file?
    var URLUtils = require('dw/web/URLUtils');
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');

    // pay attention to handle this if you use Multi Oauth Providers
    // var destination = req.session.privacyCache.store.oauthLoginTargetEndPoint;
    // destination is hanfdle by state
    var stateObj = getStateData(req);
    var destination = stateObj.target;

    //Get the data from the state object
    var data = stateObj.data;

    /*
    var accessTokenResponse = oauthLoginFlowMgr.obtainAccessToken();
    var userInfoResponse = oauthLoginFlowMgr.obtainUserInfo(accessTokenResponse.oauthProviderId, accessTokenResponse.accessToken);
    var userInfo = userInfoResponse.userInfo;
    var response = userInfoResponse.userInfo;
    var oauthProviderID = accessTokenResponse.oauthProviderId;

    /** */
    var finalizeOAuthLoginResult = oauthLoginFlowMgr.finalizeOAuthLogin();
    if (!finalizeOAuthLoginResult || !finalizeOAuthLoginResult.userInfoResponse) {
        res.redirect(URLUtils.url('Login-Show'));
        return next();
    }
    var response = finalizeOAuthLoginResult.userInfoResponse.userInfo;
    var oauthProviderID = finalizeOAuthLoginResult.accessTokenResponse.oauthProviderId;
    if (!oauthProviderID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    if (!response && oauthProviderID.indexOf('reachfive')!==-1) {
        // it seems that the response is empty, we need to make a call to the userinfo endpoint
        // this is because reach5 don't handle the userinfo endpoint call with httpparameters map
        // check if it's steel needed...
        var httpClient = new HTTPClient();
        httpClient.setRequestHeader('Authorization', 'Bearer ' + finalizeOAuthLoginResult.accessTokenResponse.accessToken);
        httpClient.open('GET', 'https://sandbox-tif.reach5.net/identity/v1/userinfo');
        httpClient.setTimeout(3000);
        httpClient.send();
        response = httpClient.text;
    }
    
    if (!response) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var externalProfile = JSON.parse(response);
    if (!externalProfile) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    // var userID = externalProfile.id || externalProfile.uid || externalProfile.user_id;
    var userID = externalProfile.id || externalProfile.uid || externalProfile.user_id || externalProfile.sub;
    if (!userID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
        oauthProviderID,
        userID
    );

    if (!authenticatedCustomerProfile) {
        // Create new profile
        Transaction.wrap(function () {
            var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
                oauthProviderID,
                userID
            );

            authenticatedCustomerProfile = newCustomer.getProfile();
            var firstName;
            var lastName;
            var email;

            // Google comes with a 'name' property that holds first and last name.
            if (typeof externalProfile.name === 'object') {
                firstName = externalProfile.name.givenName;
                lastName = externalProfile.name.familyName;
            } else {
                // The other providers use one of these, GitHub has just a 'name'.
                firstName = externalProfile['first-name']
                    || externalProfile.first_name
                    || externalProfile.name;

                lastName = externalProfile['last-name']
                    || externalProfile.last_name
                    || externalProfile.name;
            }

            email = externalProfile['email-address'] || externalProfile.email;

            if (!email) {
                var emails = externalProfile.emails;

                if (emails && emails.length) {
                    email = externalProfile.emails[0].value;
                }
            }

            authenticatedCustomerProfile.setFirstName(firstName);
            authenticatedCustomerProfile.setLastName(lastName);
            authenticatedCustomerProfile.setEmail(email);
        });
    }

    var credentials = authenticatedCustomerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, userID, false);
            // did we handle this behavior here ?
            // perhaps better in hooks/shopAuth.js
            if (credentials.getLogin() !==  authenticatedCustomerProfile.getEmail()) {
                credentials.setLogin(authenticatedCustomerProfile.getEmail());
            }
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    req.session.privacyCache.clear();
    res.redirect(URLUtils.url(destination));

    return next();
});


module.exports = server.exports();
