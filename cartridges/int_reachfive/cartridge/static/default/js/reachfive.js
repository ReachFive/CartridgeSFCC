/* eslint-disable indent */
/* eslint-disable no-console */
/* eslint-disable no-undef */
'use strict';

window.addEventListener('DOMContentLoaded', function() {
    var socialLink = document.querySelector('.social-link');
    var dataToken = socialLink ? socialLink.getAttribute('data-get-token') : undefined;
    var domain = socialLink ? socialLink.getAttribute('data-domain') : undefined;
    var demandWareId = socialLink ? socialLink.getAttribute('data-externalid'): undefined;
    var urlLink = socialLink ? socialLink.getAttribute('data-url') : undefined;
    var callbackUrl = socialLink ? socialLink.getAttribute('data-callbackurl') : undefined;
    var isReachFiveLoginAllowed = socialLink ? socialLink.getAttribute('data-isreachfiveloginallowed') : undefined;

    var has_password = "false";
    var nbProvider = 0;
    var token = dataToken;

    if (dataToken !== undefined && demandWareId != null) {
        makeCallToActiveSwitch();
    }

    var socialLinksSwitches = document.querySelectorAll('ul.social-link li .switch');

    socialLinksSwitches.forEach(function(socialLinksSwitch) {
        socialLinksSwitch.addEventListener('click', function(e) {
            e.preventDefault();
            var parent = this.parentNode;
            var active = parent.getAttribute('class');
            var social = parent.getAttribute('id').replace('social-login-', '');

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
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', 'https://' + domain + '/api/v2/users/' + demandWareId + '/merge/' + sub);
                        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                        xhr.onload = function() {
                            nbProvider++;
                            parent.classList.add('active');
                            demandWareId = sub;
                        };
                        xhr.send();
                    } else {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', urlLink + '?externalid=' + sub);
                        xhr.onload = function() {
                            var responseLink = JSON.parse(xhr.responseText);
                            if (responseLink.isSaved) {
                                nbProvider++;
                                parent.classList.add('active');
                            }
                        };
                        xhr.send();
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
    });

    function makeCallToActiveSwitch() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    var identities = response.social_identities;
                    nbProvider = identities.length;

                    for (var i = 0; i < identities.length; i++) {
                        var el = document.getElementById('social-login-' + identities[i].provider);
                        if (el) {
                            el.className = 'active';
                        }
                    }

                    has_password = response.has_password;
                } else {
                    console.log('Request failed. Status:', xhr.status);
                }
            }
        };
        xhr.open('GET', urlCall(demandWareId));
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.send();
    }

    function makeCallToDeleteSocialAccount(parent) {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', urlCall(demandWareId));
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onload = function() {
            if (xhr.status === 200) {
                var xhr2 = new XMLHttpRequest();
                xhr2.open('GET', urlLink + '?externalid=0');
                xhr2.onload = function() {
                    if (xhr2.status === 200) {
                    var responseLink = JSON.parse(xhr2.responseText);
                        if (responseLink.isSaved) {
                            parent.classList.remove('active');
                            nbProvider = 0;
                            demandWareId = 0;
                        }
                    }
                };
                xhr2.send();
            }
        };
        xhr.send();
    }

    function makeCallUnlinkSocialAccount(parent, social) {
        var url = 'https://' + domain + '/api/v2/users/' + demandWareId + '/providers/' + social;

        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.onload = function() {
            if (xhr.status === 200) {
                parent.classList.remove('active');
                nbProvider--;
            }
        };

        xhr.send();
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
        
        for (var i = 0; i < s.length; i++) {
            b = (b << 6) + m.indexOf(s[i]);
            l += 6;
            while (l >= 8) {
                r += String.fromCharCode((b >>> (l -= 8)) & 0xff);
            }
        }
        
        return r.trim();
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
