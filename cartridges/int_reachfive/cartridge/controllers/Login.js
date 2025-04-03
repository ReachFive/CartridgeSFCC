// Here we can add behavior with OAuth2.0 using native Oauth openId Connect handle by Reach5

var LOGGER = require('dw/system/Logger').getLogger('reachfive');
var server = require('server');
server.extend(module.superModule);

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var { isReachFiveEnabled } = require('*/cartridge/models/reachfiveSettings');

// here we need to logout from reach5 too
server.append('Logout', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');

    CustomerMgr.logoutCustomer(false);
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

/**
 * Login-OAuthLogin : This endpoint invokes the External OAuth Providers Login
 * @name Base/Login-OAuthLogin
 * @function
 * @memberof Login
 * @param {typeof server.middleware} httpsMiddleware - server.middleware.https
 * @param {typeof server.middleware} consentMiddleware - consentTracking.consent
 * @param {dw.web.HttpParameter} oauthProvider - ID of the OAuth Provider. e.g. Facebook, Google
 * @param {dw.web.HttpParameter} oauthLoginTargetEndPoint - Valid values for this parameter are 1 or 2. These values are mapped in oAuthRenentryRedirectEndpoints.js
 * @param {string} category - sensitive
 * @param {string} renders - isml if there is an error
 * @param {string} serverfunction - get
 */
// Sample endPpoint:
// https://zzka-002.dx.commercecloud.salesforce.com/on/demandware.store/Sites-RefArch-Site/en_US/Login-OAuthLogin?oauthLoginTargetEndPoint=1&oauthProvider=reachslas
// We replace native behavior because or limited targetEndPoint
// Thus we don't need to set the targetEndPoint in url
// https://zzka-002.dx.commercecloud.salesforce.com/on/demandware.store/Sites-RefArch-Site/en_US/Login-OAuthLogin?oauthProvider=reachslas
server.replace(
    'OAuthLogin',
    server.middleware.https,
    consentTracking.consent,
    function (req, res, next) {
        var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
        var Resource = require('dw/web/Resource');
        // perhaps better to add some behavior like redirectEndPoint allowed...
        // see default OAuthLogin endpoint
        // firstly, we need to check if Reach5 is enabled and if the request is coming for Reach5
        
        // get reach5 configuration to get AuthProviderName by Organization Preferences
        var oauthProvider = req.querystring.oauthProvider;
        if (isReachFiveEnabled 
            && oauthProvider
            && oauthProvider === 'reach_five'
        ) {            
            oauthProvider = Array.isArray(oauthProvider) ? oauthProvider[0] : oauthProvider;
            var result = oauthLoginFlowMgr.initiateOAuthLogin(oauthProvider);
            req.session.privacyCache.set('OAuthProviderId', oauthProvider);

            if (result) {
                // res.json({
                //     msg: 'OAuthLogin',
                //     location: result.location
                // })
                // return next();
                res.redirect(result.location);
            } else {
                res.render('/error', {
                    message: Resource.msg(
                        'error.oauth.login.failure',
                        'login',
                        null
                    )
                });

                return next();
            }
        } else {
            res.render('/error', {
                message: Resource.msg(
                    'error.oauth.login.failure',
                    'login',
                    null
                )
            });

            return next();
        }

        return next();
    }
);

/**
 * Login-OAuthReentry : This endpoint is called by the External OAuth Login Provider (Facebook, Google etc. to re-enter storefront after shopper logs in using their service
 * @name Base/Login-OAuthReentry
 * @function
 * @memberof Login
 * @param {typeof server.middleware} httpsMiddleware - server.middleware.https
 * @param {typeof server.middleware} consentMiddleware - consentTracking.consent
 * @param {dw.web.HttpParameter} code - given by facebook
 * @param {dw.web.HttpParameter} state - given by facebook
 * @param {string} category - sensitive
 * @param {string} renders - isml only if there is a error
 * @param {string} serverfunction - get
 */
server.replace(
    'OAuthReentry',
    server.middleware.https,
    consentTracking.consent,
    function (req, res, next) {
        // why not put these requires at the top of the file?
        var URLUtils = require('dw/web/URLUtils');
        var OAuthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');
        var HTTPClient = require('dw/net/HTTPClient');

        var { getStateData } = require('*/cartridge/scripts/helpers/reachFiveHelper');

        var stateObj;
        try {
            stateObj = getStateData(req);
        } catch (e) {
            LOGGER.error('Error while parsing state data: {0}', e.message);
        }
        var destination = stateObj.target || req.session.privacyCache.store.oauthLoginTargetEndPoint;

        // Get the data from the state object
        var accessTokenResponse = OAuthLoginFlowMgr.obtainAccessToken();
        var userInfoResponse = OAuthLoginFlowMgr.obtainUserInfo(accessTokenResponse.oauthProviderId, accessTokenResponse.accessToken);
        var userInfo = userInfoResponse.userInfo;

        var oauthProviderID = accessTokenResponse.oauthProviderId;
        var isReach5Provider = oauthProviderID && oauthProviderID.indexOf('reach_five') !== -1;
        if (!oauthProviderID) {
            res.render('/error', {
                message: Resource.msg(
                    'error.oauth.login.failure',
                    'login',
                    null
                )
            });
            return next();
        }

        if (!userInfo) {
            if (isReach5Provider) {
                // it seems that the response is empty, we need to make a call to the userinfo endpoint
                // this is because reach5 don't handle the userinfo endpoint call with httpparameters map
                var httpClient = new HTTPClient();
                httpClient.setRequestHeader(
                    'Authorization',
                    'Bearer '
                        + accessTokenResponse.accessToken
                );
                httpClient.open(
                    'GET',
                    'https://katalon-testing.reach5.net/identity/v1/userinfo'
                );
                httpClient.setTimeout(3000);
                httpClient.send();
                try {
                    userInfo = JSON.parse(httpClient.text);
                } catch (e) {
                    res.render('/error', {
                        message: Resource.msg(
                            'error.oauth.login.failure',
                            'login',
                            null
                        )
                    });
                    LOGGER.error('Error while parsing userinfo response: {0}', e.message);
                    return next();
                }
            } else {
                res.render('/error', {
                    message: Resource.msg(
                        'error.oauth.login.failure',
                        'login',
                        null
                    )
                });

                return next();
            }
        }

        if (!userInfo) {
            res.render('/error', {
                message: Resource.msg(
                    'error.oauth.login.failure',
                    'login',
                    null
                )
            });

            return next();
        }

        // var userID = externalProfile.id || externalProfile.uid || externalProfile.user_id;
        var userID = userInfo.id
            || userInfo.uid
            || userInfo.user_id
            || userInfo.sub;
        if (!userID) {
            res.render('/error', {
                message: Resource.msg(
                    'error.oauth.login.failure',
                    'login',
                    null
                )
            });

            return next();
        }

        var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
            oauthProviderID,
            userID
        );

        if (!authenticatedCustomerProfile) {
            // Create new profile
            Transaction.wrap(() => {
                var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
                    oauthProviderID,
                    userID
                );
                // need to add email to this externalProfile, not yet done by sfcc
                newCustomer.getExternalProfile(oauthProviderID, userID).setEmail(userInfo.email);
                
                authenticatedCustomerProfile = newCustomer.getProfile();
                // this will be deprecated and need password...
                authenticatedCustomerProfile.getCredentials().setLogin(userInfo.email);
                
                if (!authenticatedCustomerProfile) {
                    throw new Error('Could not get authenticated customer profile');
                }
                var firstName;
                var lastName;
                var email;

                // Google comes with a 'name' property that holds first and last name.
                if (typeof userInfo.name === 'object') {
                    firstName = userInfo.name.givenName;
                    lastName = userInfo.name.familyName;
                } else {
                    // The other providers use one of these, GitHub has just a 'name'.
                    firstName = userInfo['first-name']
                        || userInfo.first_name
                        || userInfo.name;

                    lastName = userInfo['last-name']
                        || userInfo.last_name
                        || userInfo.name;
                }

                email = userInfo['email-address'] || userInfo.email;

                if (!email) {
                    var emails = userInfo.emails;

                    if (emails && emails.length) {
                        email = userInfo.emails[0].value;
                    }
                }

                authenticatedCustomerProfile.setFirstName(firstName);
                authenticatedCustomerProfile.setLastName(lastName);
                authenticatedCustomerProfile.setEmail(email);
            });
        }

        if (!authenticatedCustomerProfile) {
            res.render('/error', {
                message: Resource.msg(
                    'error.oauth.login.failure',
                    'login',
                    null
                )
            });

            return next();
        }

        var credentials = authenticatedCustomerProfile.getCredentials();
        if (credentials.isEnabled()) {
            Transaction.wrap(function () {
                CustomerMgr.loginExternallyAuthenticatedCustomer(
                    oauthProviderID,
                    userID,
                    false
                );
            });
        } else {
            res.render('/error', {
                message: Resource.msg(
                    'error.oauth.login.failure',
                    'login',
                    null
                )
            });

            return next();
        }

        req.session.privacyCache.clear();
        if (isReach5Provider) {
            res.redirect(destination);
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }

        return next();
    }
);

module.exports = server.exports();