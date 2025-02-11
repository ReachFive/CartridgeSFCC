'use strict';

var configureService = require('./serviceConfig').configureService;

function updateEmail(requestObj) {
    var service = configureService('reachfive.updateemail.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

function updatePhone(requestObj) {
    var service = configureService('reachfive.updatephone.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.errorMessage : ''
    };
}

function updateProfile(requestObj, managementToken, reachFiveExternalID) {
    var service = configureService('reachfive.updateprofile.put', { user_id: reachFiveExternalID });
    service.setRequestMethod('PUT');
    service.addHeader('Authorization', 'Bearer ' + managementToken);

    var serviceResult = service.call(requestObj);
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

function updateProfileIdentityAPI(requestObj) {
    var service = configureService('reachfive.update.profile.post');
    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call(requestObj);
    var servResObject;

    try {
        servResObject = JSON.parse(serviceResult.errorMessage);
    } catch (error) {
        servResObject = serviceResult.object;
    }

    return {
        ok: serviceResult.ok,
        object: servResObject,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

function getUserProfile(profileFields) {
    var service = configureService('reachfive.userinfo.get', { profile_fields: profileFields });
    service.setRequestMethod('GET');
    service.addHeader('Authorization', 'Bearer ' + session.privacy.access_token);

    var serviceResult = service.call();
    return {
        ok: serviceResult.ok,
        object: serviceResult.object,
        errorMessage: (!serviceResult.ok) ? serviceResult.error + ' ' + serviceResult.errorMessage : ''
    };
}

module.exports = {
    updateEmail: updateEmail,
    updatePhone: updatePhone,
    updateProfile: updateProfile,
    updateProfileIdentityAPI: updateProfileIdentityAPI,
    getUserProfile: getUserProfile
};