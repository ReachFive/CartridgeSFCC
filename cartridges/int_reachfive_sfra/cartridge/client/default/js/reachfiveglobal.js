'use strict';

var customerHelpers = require('base/checkout/customer');

$(function () {
    var SELECTOR = {
        BTN: {
            LOGOUT: 'a[href$="Login-Logout"]',
            CHECKOUT_LOGIN: '.js-submit-reachfive-login'
        },
        FORM: {
            LOGIN: 'form.login',
            CHECKOUT_LOGIN: '#registered-customer'
        }
    };

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
    $('body').on('click', SELECTOR.BTN.LOGOUT, function (event) {
        event.preventDefault();
        sdkCoreClient.getSessionInfo()
        .then(function (sessionInfo) {
            if (sessionInfo && sessionInfo.isAuthenticated) {
                sdkCoreClient.logout({
                    redirectTo: reach5Const.reachFiveLogoutUrl
                });
            } else {
                window.location.href = $(event.target).attr('href');
            }
        });
    });

    // Login handler
    $(SELECTOR.FORM.LOGIN).on('login:error', function (event, data) {
        if (data.reachFiveLogin) {
            var $form = $(event.currentTarget);
            sdkCoreClient.loginWithPassword({
                email: $form.find('#login-form-email').val(),
                password: $form.find('#login-form-password').val(),
                auth: {
                    redirectUri: reach5Const.callbackUrl,
                    origin: reach5Const.siteID,
                    state: data.reachFiveStateObj
                }
            })
            .catch(function () {
                // console.error(err);
            });
        }
    });

    // Checkout login handler
    $('body').on('click', SELECTOR.BTN.CHECKOUT_LOGIN, function (event) {
        event.preventDefault();
        customerHelpers.methods.clearErrors();

        var $customerForm = $(SELECTOR.FORM.CHECKOUT_LOGIN);
        $.ajax({
            url: $customerForm.attr('action'),
            type: 'post',
            data: $customerForm.serialize(),
            success: function (data) {
                if (data.error) {
                    customerHelpers.methods.customerFormResponse(new $.Deferred(), data);
                } else {
                    sdkCoreClient.loginWithPassword({
                        email: $customerForm.find('#email').val(),
                        password: $customerForm.find('#password').val(),
                        auth: {
                            redirectUri: reach5Const.callbackUrl,
                            origin: reach5Const.siteID,
                            state: data.stateObjBase64
                        }
                    })
                    .catch(function () {
                        // console.error(err);
                    });
                }
            },
            error: function (err) {
                if (err.responseJSON && err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });
    });
});
