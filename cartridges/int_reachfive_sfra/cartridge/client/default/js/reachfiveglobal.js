'use strict';

$(function () {
    var SELECTOR = {
        BTN: {
            LOGOUT: 'a[href$="Login-Logout"]'
        }
    };

    var TARGET = {
        BODY: document.querySelector('body'),
        PREFILL_FORM: document.querySelector('.prefill-form-ajax'),
        LOGIN_LINK: document.querySelector('a[href*="Login-Show"]')

    };

    // Check session handler
    if (reach5Const.isSessionAuthRequired) {
        sdkCoreClient.getSessionInfo()
        .then(function (sessionInfo) {
            if (sessionInfo && sessionInfo.isAuthenticated) {
                sdkCoreClient.loginFromSession({
                    redirectUri: reach5Const.callbackUrl,
                    state: reach5Const.stateObjBase64
                });
            }
        });
    }

    // Logout handler
    TARGET.BODY.addEventListener('click', function (event) {
        if (event.target.matches(SELECTOR.BTN.LOGOUT)) {
            event.preventDefault();

            sdkCoreClient.getSessionInfo()
            .then(function (sessionInfo) {
                if (sessionInfo && sessionInfo.isAuthenticated) {
                    sdkCoreClient.logout({
                        redirectTo: reach5Const.reachFiveLogoutUrl
                    });
                } else {
                    window.location.href = event.target.href;
                }
            })
            .catch(function () {
                window.location.href = event.target.href;
            });
        }
    });
    
    if(TARGET.PREFILL_FORM) {
        TARGET.PREFILL_FORM.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            
            fetch('ReachFiveController-SubmitProfileSocialLogin', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if(data.action === 'loginRedirect'){
                        window.location.href = data.redirectUrl
                    }
                }
            })
            .catch(err => console.error(err));
        });
    }

    if(TARGET.LOGIN_LINK) {
        sdkCoreClient.getSessionInfo()
        .then(function (sessionInfo) {
            if (sessionInfo && sessionInfo.isAuthenticated) {
                TARGET.LOGIN_LINK.addEventListener('click', function(e) {
                    e.preventDefault()
                    sdkCoreClient.logout({
                        redirectTo: reach5Const.reachFiveLoginUrl
                    });
                });
            }
        })
    }

    // TARGET.BODY.addEventListener('reachfive-profile-update', function (event) {
    //     var data = event.detail;

    //     if (data && data.updateUrl) {
    //         var tokenEl = document.querySelector('#csrf-token');
    //         var tokenName = tokenEl.getAttribute('name');
    //         var tokenValue = tokenEl.value;

    //         var formObj = {
    //             source: data.source
    //         };
    //         formObj[tokenName] = tokenValue;

    //         var formData = '';
    //         Object.keys(formObj).forEach(function (key, index) {
    //             formData += (index ? '&' : '') + key + '=' + formObj[key];
    //         });

    //         var xhr = new XMLHttpRequest();
    //         xhr.responseType = 'json';
    //         xhr.open('POST', data.updateUrl);
    //         xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    //         xhr.onload = function () {
    //             if (xhr.status === 200 && xhr.response.success) {
    //                 window.location.href = xhr.response.redirectUrl;
    //             }
    //             // TODO: Remove this console logs also for error scenario
    //             // console.table(xhr.response.data); // eslint-disable-line no-console
    //         };
    //         xhr.onerror = function () {
    //             // DO NOTHING? because of widget form process
    //             // console.log('Error', resp);
    //         };
    //         xhr.send(formData);
    //     }
    // });
});
