'use strict';

var BaseProfile = require('~/cartridge/models/profile/base');

/**
 * Internal class function returns Reachfive profile id from customer profiles
 * @param {dw.customer.Customer} customer - Customer object
 * @return {string|null} result of search
 */
function getReachfiveProfileId(customer) {
    var collection = require('*/cartridge/scripts/util/collections');

    var externalProfiles = customer.getExternalProfiles();
    var result = null;
    var profile = collection.find(externalProfiles, function (item) {
        return item.authenticationProviderID === BaseProfile.PROVIDER_ID;
    });

    if (profile) {
        result = profile.getExternalID();
    }

    return result;
}

/**
 * @constructor
 * @classdesc Profile model created from Salesforce object origin
 *
 * @param {dw.customer.Customer} customer - Global customer object
 */
function CustomerProfile(customer) {
    this.profile = null;

    if (customer && customer.profile) {
        // Unique class variables
        this.customerNo = customer.profile.getCustomerNo();
        this.login = customer.profile.credentials.getLogin();
        this.salesforcePasswordSet = customer.profile.credentials.isPasswordSet();
        this.hasTechnicalPassword = customer.profile.custom.reachfiveHasTechnicalPassword;

        // Base class variables
        this.profile = {
            id: getReachfiveProfileId(customer),
            name: '' + customer.profile.getFirstName() + ' ' + customer.profile.getLastName(),
            given_name: customer.profile.getFirstName(),
            family_name: customer.profile.getLastName(),
            email: customer.profile.getEmail(),
            phone_number: customer.profile.getPhoneHome()
        };

        var birthday = customer.profile.getBirthday();
        if (birthday) {
            this.profile.birthdate = ''
                + birthday.getFullYear()
                + '-' + (birthday.getMonth() + 1)
                + '-' + birthday.getDate();
        }
    }
    BaseProfile.call(this, this.profile);
}

CustomerProfile.prototype = Object.create(BaseProfile.prototype);
CustomerProfile.prototype.constructor = CustomerProfile;

module.exports = CustomerProfile;
