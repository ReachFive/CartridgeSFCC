/* eslint-disable */
'use strict';
!(function () {
    $((function () { var e = 'a[href$="Login-Logout"]'; var t = { BODY: document.querySelector('body') }; reach5Const.isSessionAuthRequired && sdkCoreClient.getSessionInfo().then((function (e) { e && e.isAuthenticated && sdkCoreClient.loginFromSession({ redirectUri: reach5Const.callbackUrl, state: reach5Const.stateObjBase64 }); })), t.BODY.addEventListener('click', (function (t) { t.target.matches(e) && (t.preventDefault(), sdkCoreClient.getSessionInfo().then((function (e) { e && e.isAuthenticated ? sdkCoreClient.logout({ redirectTo: reach5Const.reachFiveLogoutUrl }) : window.location.href = t.target.href; })).catch((function () { window.location.href = t.target.href; }))); })); }));
}());
