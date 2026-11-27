'use strict';

var BaseProfile = require('~/cartridge/models/profile/base');

/**
 * @constructor
 * @classdesc Profile model created from Reachfive object origin
 * @param {Object} profileObj initiate object
 *
 */
function ReachfiveProfile(profileObj) {
    this.profile = profileObj || null;

    BaseProfile.call(this, this.profile);
}


ReachfiveProfile.prototype = Object.create(BaseProfile.prototype);
ReachfiveProfile.prototype.constructor = ReachfiveProfile;

/**
 * @function
 * @description Social identities of the profile, as returned by the Management API
 * @return {Array} identities with a user ID, except the local and lite ones
 * */
ReachfiveProfile.prototype.getSocialIdentities = function () {
    return ((this.profile && this.profile.identities) || []).filter(function (identity) {
        return identity.user_id && identity.provider && identity.provider !== 'local' && identity.provider !== 'lite';
    });
};

module.exports = ReachfiveProfile;
