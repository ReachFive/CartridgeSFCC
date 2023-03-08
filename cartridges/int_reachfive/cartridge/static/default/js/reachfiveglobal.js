/* eslint-disable indent */
/* eslint-disable no-console */
/* eslint-disable no-undef */
'use strict';

$(function () {
    if (reach5Const.isSessionAuthRequired && document.cookie.indexOf('r5.login') >= 0) {
        sdkCoreClient.getSessionInfo()
        .then(function(sessionInfo) {
            if (sessionInfo && sessionInfo.isAuthenticated) {
                sdkCoreClient.loginFromSession({
                    redirectUri: reach5Const.checkSessionRedirectUrl,
                    state: reach5Const.stateUrl
                });
            }
        })
    }

    function displayError($el, errorMsg, errorClass) {
        errorClass = errorClass || 'error-form';
        var $errorCont = $el.find('.' + errorClass);
        if ($errorCont.length) {
            $errorCont.text(errorMsg);
        } else {
            $el.prepend('<div class="'+ errorClass +'">' + errorMsg + '</div>');
        }
    }

    function processFormErrors($form, errors) {
        var error;
        var $el;
        var $errorCont;
        for (var i = 0, length = errors.length; i < length; i++) {
            error = errors[i];
            $el = $form.find('[name^="' + error.name + '"]');
            if ($el.length) {
                $errorCont = $el.closest('.form-row').find('.form-caption');
                if ($errorCont.length) {
                    $errorCont.first().addClass('error-message');
                    $errorCont.first().text(error.error);
                }
            }
        }
    }

    function invalidateFormErrors($form) {
        var $errorfields = $form.find('.error-message');
        $errorfields.removeClass('error-message');
        $errorfields.text('');
    }

    // Conversion functions
    $(document).on('submit', '.reach5-login-ajax', function(event) {
        event.preventDefault();
        var $form = $(event.currentTarget);
        var formData = $form.serialize();

        $.ajax({
            url: reach5Const.ajaxLoginUrl,
            type: 'post',
            dataType: 'json',
            data: formData
        })
        .done(function (data) {
            if (!data.error) {
                sdkCoreClient.loginWithPassword({
                    email: $form.find('[name^="dwfrm_login_username"]').val(),
                    password: $form.find('[name^="dwfrm_login_password"]').val(),
                    auth: {
                        redirectUri: reach5Const.callbackUrl,
                        origin: reach5Const.siteID
                    }
                });
            } else if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else if (data.errorMessage) {
                displayError($form, data.errorMessage);
            }
        })
        .fail(function () {
            displayError($form, 'Unexpected error');
        });
    });

    $(document).on('submit', '.reach5-signup-ajax', function(event) {
        event.preventDefault();
        var $form = $(event.currentTarget);
        var formData = $form.serialize();

        $.ajax({
            url: reach5Const.ajaxSignUpUrl,
            type: 'post',
            dataType: 'json',
            data: formData
        })
        .done(function (data) {
            // Invalidate form errors
            invalidateFormErrors($form);
            if (!data.error) {
                sdkCoreClient.loginWithPassword({
                    email: $form.find('[name^="dwfrm_profile_customer_email"]').val(),
                    password: $form.find('[name^="dwfrm_profile_login_password"]').val(),
                    auth: {
                        redirectUri: reach5Const.callbackUrl,
                        origin: reach5Const.siteID
                    }
                });
            } else if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else if (data.errorFields.length) {
                processFormErrors($form, data.errorFields);
            }
        })
        .fail(function () {
            displayError($form, 'Unexpected error');
        });
    });

    // Customer logout handler
    $(document).on('click', '.account-logout a, a.user-logout', function(event) {
        event.preventDefault();

        document.cookie = reach5Const.reachFiveLoginCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = reach5Const.reachFiveCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        sdkCoreClient.logout({redirectTo: reach5Const.reachFiveLogoutUrl});
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
