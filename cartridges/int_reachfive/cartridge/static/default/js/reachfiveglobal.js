/* eslint-disable indent */
/* eslint-disable no-console */
/* eslint-disable no-undef */
'use strict';

document.addEventListener('DOMContentLoaded', function() {
    if (reach5Const.isSessionAuthRequired && document.cookie.indexOf('r5.login') >= 0) {
        sdkCoreClient.getSessionInfo()
        .then(function(sessionInfo) {
            if (sessionInfo && sessionInfo.isAuthenticated) {
                sdkCoreClient.loginFromSession({
                    redirectUri: reach5Const.checkSessionRedirectUrl,
                    state: reach5Const.stateUrl
                });
            }
        });
    }

    function displayError(el, errorMsg, errorClass) {
        errorClass = errorClass || 'error-form';
        var errorCont = el.querySelector('.' + errorClass);
        if (errorCont) {
            errorCont.textContent = errorMsg;
        } else {
            var newErrorCont = document.createElement('div');
            newErrorCont.className = errorClass;
            newErrorCont.textContent = errorMsg;
            el.insertBefore(newErrorCont, el.firstChild);
        }
    }

    function processFormErrors(form, errors) {
        var error, el, errorCont;
        for (var i = 0, length = errors.length; i < length; i++) {
            error = errors[i];
            el = form.querySelector('[name^="' + error.name + '"]');
            if (el) {
                errorCont = el.closest('.form-row').querySelector('.form-caption');
                if (errorCont) {
                    errorCont.classList.add('error-message');
                    errorCont.textContent = error.error;
                }
            }
        }
    }

    function invalidateFormErrors(form) {
        var errorfields = form.querySelectorAll('.error-message');
        errorfields.forEach(function (errorfield) {
            errorfield.classList.remove('error-message');
            errorfield.textContent = '';
        });
    }

    function displayQueryParamError() {
        const urlParams = new URLSearchParams(window.location.search);
        const errormsg = urlParams.get('errormsg');
        if (errormsg != null) {
            let errorElement = document.getElementById('error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'error';
                document.body.insertBefore(errorElement, document.body.firstChild);
            }
            errorElement.textContent = errormsg;
            errorElement.style.display = 'block';
        }
    }

    // Call the function to display query param error
    displayQueryParamError();

    // Conversion functions
    document.addEventListener('submit', function(event) {
        event.preventDefault();
        var form = event.target.closest('.reach5-login-ajax');
        var formData = new FormData(form);
    
        fetch(reach5Const.ajaxLoginUrl, {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .then(function(data) {
            if (!data.error) {
                sdkCoreClient.loginWithPassword({
                    email: form.querySelector('[name^="dwfrm_login_username"]').value,
                    password: form.querySelector('[name^="dwfrm_login_password"]').value,
                    auth: {
                        redirectUri: reach5Const.callbackUrl,
                        origin: reach5Const.siteID
                    }
                });
            } else if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else if (data.errorMessage) {
                displayError(form, data.errorMessage);
            }
        })
        .catch(function(error) {
            displayError(form, 'Unexpected error');
            console.error(error);
        });
    });

    document.addEventListener('submit', function(event) {
        if (!event.target.classList.contains('reach5-signup-ajax')) {
            return;
        }

        event.preventDefault();
        var form = event.target;
        var formData = new FormData(form);
    
        var xhr = new XMLHttpRequest();
        xhr.open('POST', reach5Const.ajaxSignUpUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    invalidateFormErrors(form);
                    if (!data.error) {
                        sdkCoreClient.loginWithPassword({
                            email: form.querySelector('[name^="dwfrm_profile_customer_email"]').value,
                            password: form.querySelector('[name^="dwfrm_profile_login_password"]').value,
                            auth: {
                                redirectUri: reach5Const.callbackUrl,
                                origin: reach5Const.siteID
                            }
                        });
                    } else if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else if (data.errorFields.length) {
                        processFormErrors(form, data.errorFields);
                    }
                } else {
                    displayError(form, 'Unexpected error');
                }
            }
        };
        xhr.send(new URLSearchParams(formData).toString());
    });

    // Customer logout handler
    document.addEventListener('click', function(event) {
        var target = event.target;
        var logoutLink = target.closest('.account-logout a, a.user-logout');
    
        if (logoutLink) {
            event.preventDefault();
            document.cookie = reach5Const.reachFiveLoginCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = reach5Const.reachFiveCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            sdkCoreClient.logout({redirectTo: reach5Const.reachFiveLogoutUrl});
        }
    });

    // ReachFive core client handlers
    if (window.hasOwnProperty('sdkUiClient')
        && reach5Const.isSessionAccessToken
        && document.getElementById('re-auth-container')
        && document.getElementById('social-accounts-container')) {

        sdkCoreClient.on('authenticated', function(authResult) {
            sdkUiClient.showSocialAccounts({
                accessToken: authResult.accessToken,
                container: 'social-accounts-container'
            });
        });
    }
});
