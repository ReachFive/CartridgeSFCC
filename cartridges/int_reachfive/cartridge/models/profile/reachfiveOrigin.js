'use strict';

var BaseProfile = require('~/cartridge/models/profile/base');

/**
 * @constructor
 * @classdesc Profile model created from Reachfive object origin
 * @param {Object} profileObj initiate object
 *
 */
function ReachfiveProfile(profileObj) {
    this.profile = null;
    if (profileObj) {
        Object.keys(profileObj).forEach(function (prop) {
            if (!empty(profileObj[prop])) {
                this[prop] = profileObj[prop];
            }
        }, this.profile);
        this.profile = profileObj;
    }

    BaseProfile.call(this, this.profile);
}

ReachfiveProfile.prototype = Object.create(BaseProfile.prototype);
ReachfiveProfile.prototype.constructor = ReachfiveProfile;

module.exports = ReachfiveProfile;
