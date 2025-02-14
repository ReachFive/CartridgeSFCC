'use strict';

var configureService = require('./serviceConfig').configureService;
var reachFiveHelper = require('~/cartridge/scripts/helpers/reachFiveHelper');
var generateTokenForManagementAPI = require('./tokenManagement').generateTokenForManagementAPI;

function sendVerificationEmail(managementToken, reachFiveExternalID) {
    var service = configureService('reachfive.verifyemail.post', { user_id: reachFiveExternalID });
    service.addHeader('Authorization', 'Bearer ' + managementToken);

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

function sendVerificationPhone(managementToken, reachFiveExternalID) {
    var service = configureService('reachfive.verifyphone.post', { user_id: reachFiveExternalID });
    service.addHeader('Authorization', 'Bearer ' + managementToken);

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

function signUp(login, password, profile) {
    var requestParams = {
        client_id: reachfiveSettings.reach5ApiKey,
        scope: 'openid profile email phone',
        data: {
            given_name: profile.firstName,
            family_name: profile.lastName,
            email: login,
            password: password,
            consents: {
                newsletter: {
                    granted: false,
                    consent_type: 'opt-in'
                }
            }
        }
    };

    if (profile && profile.phoneHome) {
        requestParams.data.phone_number = profile.phoneHome;
    }

    var service = configureService('reachfive.signup.post');
    service.setRequestMethod('POST');

    var serviceResult = service.call(requestParams);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

function updatePassword(email, newPassword, oldPassword, clientId) {
    var requestParams = {
        client_id: clientId || reachFiveHelper.getReachFiveApiKey(),
        email: email,
        password: newPassword,
        old_password: oldPassword
    };

    var service = configureService('reachfive.updatepassword.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestParams);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

function passwordLogin(requestFields) {
    var baseFields = {
        client_id: reachfiveSettings.reach5ApiKey
    };

    var requestObj = mergeObjects(baseFields, requestFields);

    var service = configureService('reachfive.passwordlogin.post');
    service.setRequestMethod('POST');

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

function deleteUser(customer) {
    var managementToken = generateTokenForManagementAPI();

    var clientId = reachFiveHelper.getReachFiveExternalID(customer);
    if (clientId) {
        var service = configureService('reachfive.deleteuser', { user_id: clientId });
        service.setRequestMethod('DELETE');
        service.addHeader('Authorization', 'Bearer ' + managementToken.token);

        var serviceResult = service.call();
        return {
            ok: serviceResult.ok,
            errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : null
        };
    }
    return null;
}

function getUserFields(clientId) {
    var managementTokenObj = generateTokenForManagementAPI();
    if (!clientId || !managementTokenObj.ok) {
        return { ok: false, errorMessage: 'Missing userId or failed to obtain management token' };
    }

    var managementToken = managementTokenObj.token;
    var service = configureService('reachfive.getuser', { user_id: clientId });
    service.setRequestMethod('GET');
    service.addHeader('Authorization', 'Bearer ' + managementToken);
    service.addHeader('Content-type', 'application/json');

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

module.exports = {
    sendVerificationEmail: sendVerificationEmail,
    sendVerificationPhone: sendVerificationPhone,
    signUp: signUp,
    updatePassword: updatePassword,
    passwordLogin: passwordLogin,
    deleteUser: deleteUser,
    getUserFields: getUserFields
};