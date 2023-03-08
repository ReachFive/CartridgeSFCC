'use strict';

/**
 * Holds the constructor of the Reachfive global init hook helper
 *
 * @constructor
 */
function initGlobal() {}

/**
 * render footer resource content for Attentive Mobile
 * @returns {string} html string
 * @param {Object} pdict Pipeline dictionary
*/
initGlobal.afterFooter = function (pdict) {
    var ISML = require('dw/template/ISML');
    var URLUtils = require('dw/web/URLUtils');
    // var dwStringUtils = require('dw/util/StringUtils');
    var System = require('dw/system/Site');
    var reachFiveHelper = require('*/cartridge/scripts/helpers/reachFiveHelper');

    if (!reachFiveHelper.isReachFiveEnabled()) {
        return '';
    }

    var context = {};
    var handleCustomerRoute = false;
    var targetPage = request.httpURL.https();
    var oneTimeLoginTkn = reachFiveHelper.cutOnetimeTknFromSession();

    if (oneTimeLoginTkn) {
        context.loginRedirectUrl = reachFiveHelper.createLoginRedirectUrl(oneTimeLoginTkn, targetPage.toString());
    } else {
        // List of the pages where ReachFive UI sdk need to be loaded
        var UI_INIT_ACTIONS = [
            'Order-Track',
            'Login-Show',
            'Account-Show',
            'Account-EditPassword',
            'Account-EditProfile',
            'Checkout-Begin'
        ];

        var isLoadUISDK = UI_INIT_ACTIONS.indexOf(pdict.action) !== -1;

        // Modify target page in order to correct processing after-login and after-register redirect
        var signUpTargetPage = request.httpURL.https();
        if (['Login-Show', 'Account-EditPassword'].indexOf(pdict.action) !== -1) {
            targetPage = URLUtils.url('Account-Show', 'registration', false).relative();
            signUpTargetPage = URLUtils.url('Account-Show', 'registration', 'submitted').relative();
        } else if (['Checkout-Begin'].indexOf(pdict.action) !== -1) {
            handleCustomerRoute = true;
            targetPage = URLUtils.https('Checkout-Begin', 'stage', 'shipping').abs();
            signUpTargetPage = URLUtils.url('Account-Show', 'registration', 'submitted').relative();
        }

        var stateObjBase64 = reachFiveHelper.getStateObjBase64(targetPage.toString(), handleCustomerRoute);
        var signUpStateObjBase64 = reachFiveHelper.getStateObjBase64(signUpTargetPage.toString(), handleCustomerRoute);

        if (pdict.disableSSOLogin) {
            context.isSessionAuthRequired = false;
        }

        context.loadUISDK = isLoadUISDK;
        context.reachFiveCoreSdkUrl = reachFiveHelper.getReachFiveCoreSdkUrl();
        context.reachFiveDomain = reachFiveHelper.getReachFiveDomain();
        context.reachFiveApiKey = reachFiveHelper.getReachFiveApiKey();
        context.reachFiveLanguageCode = reachFiveHelper.getReachFiveLanguageCode();
        context.callbackUrl = URLUtils.https('ReachFiveController-CallbackReachFiveRequest');
        context.reachFiveLogoutUrl = URLUtils.https('Login-Logout');
        context.siteID = System.getCurrent().getID();
        context.stateUrl = targetPage;
        context.stateObjBase64 = stateObjBase64;
        context.reachFiveCookieName = reachFiveHelper.getReachFiveCookieName();
        context.reachFiveLoginCookieName = reachFiveHelper.getReachFiveLoginCookieName();
        context.reachFiveAccess_token = session.privacy.access_token;

        if (isLoadUISDK) {
            context.isReachFiveLoginAllowed = reachFiveHelper.isReachFiveLoginAllowed();
            context.reachFiveUiSdkUrl = reachFiveHelper.getReachFiveUiSdkUrl();
            context.signUpStateObjBase64 = signUpStateObjBase64;
            context.resetPassLoginUrl = URLUtils.https('Login-Show');
            context.isTransitionActive = reachFiveHelper.isReachFiveTransitionActive();
        }
    }

    return ISML.renderTemplate('reachfiveinitglobal', context);
};

module.exports = initGlobal;
