'use strict';

/**
 * Holds the constructor of the Reachfive global init hook helper
 *
 * @constructor
 */
function initGlobal() {}

/**
 * render footer resource content for Attentive Mobile
 * @param {Object} pdict Pipeline dictionary
 * @returns {string} html string
*/
initGlobal.afterFooter = function (pdict) {
    var ISML = require('dw/template/ISML');
    var URLUtils = require('dw/web/URLUtils');
    var System = require('dw/system/Site');
    var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');
    var ReachfiveSessionModel = require('*/cartridge/models/reachfiveSession');

    if (!reachFiveHelper.isReachFiveEnabled()) {
        return '';
    }

    var context = {};
    var handleCustomerRoute = false;
    var targetPage = request.httpURL.https();
    var reachfiveSession = new ReachfiveSessionModel();

    if (reachfiveSession.isOneTimeTkn()) {
        context.loginRedirectUrl = reachFiveHelper.createLoginRedirectUrl(reachfiveSession.one_time_token, targetPage.toString());
    } else {
        // List of the pages where ReachFive UI sdk need to be loaded
        var UI_INIT_PAGES = [
            'Order-Track',
            'Login-Show',
            'Account-Show',
            'Account-EditPassword',
            // 'Account-EditProfile',
            'Checkout-Begin'
        ];
        var ACCOUNT_REDIRECT_PAGES = [
            'Login-Show',
            'Account-EditPassword',
            'CSRF-Fail'
        ];

        var isLoadUISDK = UI_INIT_PAGES.indexOf(pdict.action) !== -1;

        // Modify target page in order to correct processing after-login and after-register redirect
        var signUpTargetPage = request.httpURL.https();
        if (ACCOUNT_REDIRECT_PAGES.indexOf(pdict.action) !== -1) {
            targetPage = URLUtils.url('Account-Show', 'registration', false).relative();
            signUpTargetPage = URLUtils.url('Account-Show', 'registration', 'submitted').relative();
        } else if (['Checkout-Begin'].indexOf(pdict.action) !== -1) {
            handleCustomerRoute = true;
            targetPage = URLUtils.https('Checkout-Begin', 'stage', 'shipping').abs();
            signUpTargetPage = URLUtils.url('Account-Show', 'registration', 'submitted').relative();
        }

        var data = request.httpParameterMap.data.value; //Get the query param data in order to store it in the state value
        var stateObjBase64 = reachFiveHelper.getStateObjBase64(targetPage.toString(), pdict.action, handleCustomerRoute, data);
        var signUpStateObjBase64 = reachFiveHelper.getStateObjBase64(signUpTargetPage.toString(), pdict.action, handleCustomerRoute);

        if (pdict.disableSSOLogin) {
            context.isSessionAuthRequired = false;
        }

        context.loadUISDK = isLoadUISDK;
        context.reachFiveCoreSdkUrl = reachFiveHelper.getReachFiveCoreSdkUrl();
        context.reachFiveDomain = reachFiveHelper.getReachFiveDomain();
        context.reachFiveApiKey = reachFiveHelper.getReachFiveApiKey();
        context.reachFiveLanguageCode = reachFiveHelper.getReachFiveLanguageCode();
        context.reachFivelocaleCode = reachFiveHelper.getReachFiveLocaleCode();
        context.callbackUrl = URLUtils.https('ReachFiveController-CallbackReachFiveRequest');
        context.reachFiveLogoutUrl = URLUtils.https('Login-Logout');
        context.reachFiveLoginUrl = URLUtils.https('Login-Show');
        context.siteID = System.getCurrent().getID();
        context.stateUrl = targetPage;
        context.stateObjBase64 = stateObjBase64;
        context.reachFiveCookieName = reachFiveHelper.getReachFiveCookieName();
        context.reachFiveLoginCookieName = reachFiveHelper.getReachFiveLoginCookieName();
        context.reachFiveAccess_token = reachfiveSession.access_token;
        context.reachFiveProviderAccessToken = reachfiveSession.provider_access_token;

        if (isLoadUISDK) {
            context.isReachFiveLoginAllowed = reachFiveHelper.isReachFiveLoginAllowed();
            context.reachFiveUiSdkUrl = reachFiveHelper.getReachFiveUiSdkUrl();
            context.signUpStateObjBase64 = signUpStateObjBase64;
            context.resetPassLoginUrl = URLUtils.https('Login-Show');
            context.isTransitionActive = reachFiveHelper.isReachFiveTransitionActive();
            context.updateProfileUrl = URLUtils.url('ReachFiveController-UpdateCustomer');
        }
    }

    return ISML.renderTemplate('reachfiveinitglobal', context);
};

module.exports = initGlobal;
