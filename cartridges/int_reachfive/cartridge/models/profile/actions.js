'use strict';

/*
TODO: This variable should be moved in external files and split on 2 part "system" and "custom"

This variable used as object action descriptor for Reachfive profile object (https://developer.reachfive.com/docs/models-user-profile.html#the-user-profile-object).
Each element has specific structure:
'given_name' : { - Profile pointer, may contain words separated by spaces (this is how nesting is described).
    data: 'profile', - name of the Salesforce system object, to which the function will be applied
    type: 'simpleMethod', - pointer to the operation type, can take the following values: 'simpleMethod', 'customProperty', 'function'
    set: 'setFirstName', - name of the function to write the value
    get: 'getFirstName' - name of the function to read the value
}
This object was created as an instruction for a program to save data from the standard Reachfive user profile object into a Salesforce profile object
*/
var actionsObj = {
    given_name: {
        data: 'profile',
        type: 'simpleMethod',
        set: 'setFirstName',
        get: 'getFirstName'
    },
    family_name: {
        data: 'profile',
        type: 'simpleMethod',
        set: 'setLastName',
        get: 'getLastName'
    },
    email: {
        data: 'profile',
        type: 'simpleMethod',
        set: 'setEmail',
        get: 'getEmail'
    },
    phone_number: {
        data: 'profile',
        type: 'simpleMethod',
        set: 'setPhoneHome',
        get: 'getPhoneHome'
    },
    birthdate: {
        data: 'profile',
        type: 'function',
        set: 'setBirthdate',
        get: 'getBirthdate'
    },
    'consents newsletter': {
        data: 'profile',
        type: 'function',
        set: 'setConsentsNewsletter',
        get: 'getConsentsNewsletter'
    },
    'emails verified': {
        data: 'profile',
        type: 'function',
        set: 'setEmailVerified',
        get: 'getEmailVerified'
    }
};

/**
 * @function
 * @description Action object constructor
 * */
function Actions() {
    this.actionsContent = actionsObj;
}

Actions.prototype = {
    /**
     * @function
     * @description BACKBONE METHOD, please !!! IN CASE OVERRIDE DO WITH CARE !!!
     * @description Run appropriate profile data setter for a value
     * @param {dw.customer.Customer} customer Salesforce customer
     * @param {dw.customer.Profile} profile Salesforce customer profile
     * @param {string} profilePointer reachfive profile property pointer
     * @param {string|Object} value value to update
     * */
    set: function (customer, profile, profilePointer, value) {
        var Transaction = require('dw/system/Transaction');

        var action = this.actionsContent[profilePointer];

        if (action) {
            var ormObject;

            if (action.data === 'profile') {
                ormObject = profile;
            } else if (action.data === 'address') {
                ormObject = customer.getAddressBook();
            } else {
                ormObject = customer;
            }

            if (action.type === 'simpleMethod') {
                // Prevent redundant identical save in database
                if (ormObject[action.get].call(ormObject) !== value) {
                    Transaction.wrap(function () {
                        ormObject[action.set].call(ormObject, value);
                    });
                }
            } else if (action.type === 'customProperty') {
                if (ormObject.custom[action.get] !== value) {
                    Transaction.wrap(function () {
                        ormObject.custom[action.set] = value;
                    });
                }
            } else if (action.type === 'function') {
                var that = this;
                Transaction.wrap(function () {
                    that[action.set].call(that, ormObject, value);
                });
            }
        }
    },
    setBirthdate: function (profile, value) {
        var Calendar = require('dw/util/Calendar');
        var calendar = new Calendar();
        calendar.parseByFormat(value, 'yyyy-MM-dd');
        profile.setBirthday(calendar.getTime());
    },
    getBirthdate: function (profile) {
        var dwStringUtils = require('dw/util/StringUtils');
        var Calendar = require('dw/util/Calendar');
        var birthdayCal = new Calendar(profile.birthday);

        return dwStringUtils.formatCalendar(birthdayCal, 'yyyy-MM-dd');
    },
    setConsentsNewsletter: function (profile, value) {
        if (value && this.getConsentsNewsletter(profile) !== value.granted) {
            profile.custom.isNewsletter = value.granted;
        }
    },
    getConsentsNewsletter: function (profile) {
        return profile.custom.isNewsletter;
    },
    setEmailVerified: function (profile, value) {
        if (value && this.getEmailVerified(profile) !== value[0]) {
            profile.setEmail(value[0]);
        }
    },
    getEmailVerified: function (profile) {
        return profile.email;
    }
};

module.exports = Actions;
