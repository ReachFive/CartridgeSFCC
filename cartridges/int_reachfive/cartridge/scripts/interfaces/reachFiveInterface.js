'use strict';

const tokenManagement = require('./tokenManagement');
const profileManagement = require('./profileManagement');
const userManagement = require('./userManagement');

module.exports = {
    generateTokenForManagementAPI: tokenManagement.generateTokenForManagementAPI,
    exchangeAuthorizationCodeForIDToken: tokenManagement.exchangeAuthorizationCodeForIDToken,
    retrieveAccessTokenWithRefresh: tokenManagement.retrieveAccessTokenWithRefresh,
    generateToken: tokenManagement.generateToken,
    updateEmail: profileManagement.updateEmail,
    updatePhone: profileManagement.updatePhone,
    updateProfile: profileManagement.updateProfile,
    updateProfileIdentityAPI: profileManagement.updateProfileIdentityAPI,
    sendVerificationEmail: userManagement.sendVerificationEmail,
    getUserProfile: profileManagement.getUserProfile,
    signUp: userManagement.signUp,
    updatePassword: userManagement.updatePassword,
    oauthToken: tokenManagement.oauthToken,
    passwordLogin: userManagement.passwordLogin,
    deleteUser: userManagement.deleteUser,
    getUserFields: userManagement.getUserFields,
    sendVerificationPhone: userManagement.sendVerificationPhone
};