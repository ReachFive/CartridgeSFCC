/* eslint-disable indent */
/* eslint-disable no-console */
/* eslint-disable no-undef */
'use strict';

$(function () {
    jQuery(document).ready(function () {
        var dataToken = $('.social-link').data('get-token');
        var domain = $('.social-link').data('domain');
        var demandWareId = $('.social-link').data('externalid');
        var urlLink = $('.social-link').data('url');
        var callbackUrl = $('.social-link').data('callbackurl');
        var isReachFiveLoginAllowed = $('.social-link').data('isreachfiveloginallowed');

        var has_password = "false";
        var nbProvider = 0;
        var token = dataToken;

        if (dataToken !== undefined && demandWareId != null) {
            makeCallToActiveSwitch();
        }

        $('ul.social-link li .switch').click(function (e) {
            e.preventDefault();
            var parent = $(this).parent();
            var active = parent.attr('class');
            var social = parent.attr('id').replace('social-login-', '');

            if (active.indexOf('active') > -1) {
                if (nbProvider === 1 && !isReachFiveLoginAllowed) {
                    makeCallToDeleteSocialAccount(parent);
                } else {
                    makeCallUnlinkSocialAccount(parent, social);
                }
            } else {
                sdkCoreClient.loginWithSocialProvider(social, {
                    responseType: 'token'
                });

                sdkCoreClient.on('authenticated', function (authResult) {
                    var idToken = authResult.idToken;
                    var decodedToken = reachFiveTokenDecode(idToken);
                    var jsonDecodedToken = JSON.parse(decodedToken);
                    var sub = jsonDecodedToken.sub;

                    if (demandWareId && demandWareId !== sub) {
                        $.ajax({
                            url: 'https://'
                                + domain
                                + '/api/v2/users/'
                                + demandWareId
                                + '/merge/'
                                + sub,
                            type: 'POST',
                            headers: { Authorization: 'Bearer ' + token },
                            success: function (responseLink) {
                                nbProvider++;
                                parent.addClass('active');
                                demandWareId = sub;
                            }
                        });
                    } else {
                        $.ajax({
                            url: urlLink + '?externalid=' + sub,
                            type: 'GET',
                            success: function(responseLink) {
                                if (responseLink.isSaved) {
                                    nbProvider++;
                                    parent.addClass('active');
                                }
                            }
                        });
                    }
                });

                sdkCoreClient.on('authentication_failed', function (authResult) {

                });

                sdkCoreClient.on('login_failed', function (authResult) {

                });

                sdkCoreClient.on('signup_failed', function (authResult) {

                });

                sdkCoreClient.on('profile_updated', function (authResult) {

                });
            }
        });

        function makeCallToActiveSwitch() {
            $.ajax({
                url: urlCall(demandWareId),
                type: 'GET',
                headers: { Authorization: 'Bearer ' + token }
            })

            .done(function(response) {
                var identities = response.social_identities;
                nbProvider = identities.length;

                for (var i = 0; i < identities.length; i++) {
                    var el = document.getElementById('social-login-' + identities[i].provider);
                    if (el) {
                        el.className = 'active';
                    }
                }

                has_password = response.has_password;
            })

            .fail(function(xhr, textStatus) {
            });
        }

        function makeCallToDeleteSocialAccount(parent) {
            $.ajax({
                url: urlCall(demandWareId),
                type: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function(responseDelete) {
                    $.ajax({
                        url: urlLink + '?externalid=0',
                        type: 'GET',
                        success: function(responseLink) {
                            if (responseLink.isSaved) {
                                parent.removeClass('active');
                                nbProvider = 0;
                                demandWareId = 0;
                            }
                        }
                    });
                }
            });
        }

        function makeCallUnlinkSocialAccount(parent, social) {
            $.ajax({
                url: 'https://'
                    + domain
                    + '/api/v2/users/'
                    + demandWareId
                    + '/providers/'
                    + social,
                type: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function (responseUnlink) {
                    parent.removeClass('active');
                    nbProvider--;
                }
            });
        }

        function reachFiveTokenDecode(idToken) {
            var partsofidtoken = idToken.split('.')[1];

            if (!partsofidtoken) {
                return null;
            }

            var s = decode_base64(partsofidtoken);

            return s;
        }

        function decode_base64(s) {
            var b = 0;
            var l = 0;
            var r = '';
            s = s.split('');
            var m = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

            for (var i in s) {
                b = (b << 6) + m.indexOf(s[i]);
                l += 6;
                while (l >= 8) r += String.fromCharCode((b >>> (l -= 8)) & 0xff);
            }

            return r.trimRight();
        }

        function urlCall(externalId) {
            var urlCall = 'https://'
                + domain
                + '/api/v2/users/'
                + externalId
                + '?fields=social_identities,has_password';

            return urlCall;
        }
    });
});
