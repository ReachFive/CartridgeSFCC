'use strict';

/**
 * @typedef {import('@types/models/profile/action.d.ts').ActionsObject} ActionsObject
 * @typedef {import('@types/models/profile/action.d.ts').ActionDescriptor} ActionDescriptor
 */

const actionsObj = {
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

const ACTION_TYPES = {
    SIMPLE_METHOD: 'simpleMethod',
    CUSTOM_PROPERTY: 'customProperty',
    FUNCTION: 'function'
};

/**
 * @constructor
 * @classdesc Manages actions for ReachFive profile data.
 */
function Actions() {
    this.actionsContent = actionsObj;
}

Actions.prototype = {
    /**
     * Runs the appropriate profile data setter for a value.
     *
     * @param {dw.customer.Customer} customer - Salesforce customer.
     * @param {dw.customer.Profile} profile - Salesforce customer profile.
     * @param {string} profilePointer - ReachFive profile property pointer.
     * @param {string|Object} value - The value to update.
     */
    set: function (customer, profile, profilePointer, value) {
        const action = this.actionsContent[profilePointer];

        if (action) {
            const ormObject = this.getORMObject(customer, profile, action.data);
            this.updateValue(ormObject, action, value);
        }
    },

    /**
     * Retrieves the appropriate ORM object based on the data type.
     *
     * @param {dw.customer.Customer} customer - Salesforce customer.
     * @param {dw.customer.Profile} profile - Salesforce customer profile.
     * @param {string} dataType - The data type ('profile', 'address', etc.).
     * @returns {Object} - The ORM object.
     */
    getORMObject: function (customer, profile, dataType) {
        switch (dataType) {
            case 'profile':
                return profile;
            case 'address':
                return customer.getAddressBook();
            default:
                return customer;
        }
    },

    /**
     * Updates the value based on the action type.
     *
     * @param {Object} ormObject - The ORM object.
     * @param {ActionDescriptor} action - The action descriptor.
     * @param {string|Object} value - The value to update.
     */
    updateValue: function (ormObject, action, value) {
        switch (action.type) {
            case ACTION_TYPES.SIMPLE_METHOD:
                this.updateSimpleMethod(ormObject, action, value);
                break;
            case ACTION_TYPES.CUSTOM_PROPERTY:
                this.updateCustomProperty(ormObject, action, value);
                break;
            case ACTION_TYPES.FUNCTION:
                this.updateFunction(ormObject, action, value);
                break;
            default:
                throw new Error('Invalid action type');
        }
    },

    /**
     * Updates a value using a simple method.
     *
     * @param {Object} ormObject - The ORM object.
     * @param {ActionDescriptor} action - The action descriptor.
     * @param {string|Object} value - The value to update.
     */
    updateSimpleMethod: function (ormObject, action, value) {
        const Transaction = require('dw/system/Transaction');
        if (ormObject[action.get].call(ormObject) !== value) {
            Transaction.wrap(() => {
                ormObject[action.set].call(ormObject, value);
            });
        }
    },

    /**
     * Updates a custom property value.
     *
     * @param {Object} ormObject - The ORM object.
     * @param {ActionDescriptor} action - The action descriptor.
     * @param {string|Object} value - The value to update.
     */
    updateCustomProperty: function (ormObject, action, value) {
        const Transaction = require('dw/system/Transaction');
        if (ormObject.custom[action.get] !== value) {
            Transaction.wrap(() => {
                ormObject.custom[action.set] = value;
            });
        }
    },

    /**
     * Updates a value using a custom function.
     *
     * @param {Object} ormObject - The ORM object.
     * @param {ActionDescriptor} action - The action descriptor.
     * @param {string|Object} value - The value to update.
     */
    updateFunction: function (ormObject, action, value) {
        const Transaction = require('dw/system/Transaction');
        Transaction.wrap(() => {
            this[action.set].call(this, ormObject, value);
        });
    },

    /**
     * Sets the birthdate for a profile.
     *
     * @param {dw.customer.Profile} profile - The profile object.
     * @param {string} value - The birthdate value.
     */
    setBirthdate: function (profile, value) {
        const Calendar = require('dw/util/Calendar');
        const calendar = new Calendar();
        calendar.parseByFormat(value, 'yyyy-MM-dd');
        profile.setBirthday(calendar.getTime());
    },

    /**
     * Gets the birthdate for a profile.
     *
     * @param {dw.customer.Profile} profile - The profile object.
     * @returns {string} - The formatted birthdate.
     */
    getBirthdate: function (profile) {
        const dwStringUtils = require('dw/util/StringUtils');
        const Calendar = require('dw/util/Calendar');
        const birthdayCal = new Calendar(profile.birthday);
        return dwStringUtils.formatCalendar(birthdayCal, 'yyyy-MM-dd');
    },

    /**
     * Sets the newsletter consent for a profile.
     *
     * @param {dw.customer.Profile} profile - The profile object.
     * @param {Object} value - The consent value.
     */
    setConsentsNewsletter: function (profile, value) {
        if (value && this.getConsentsNewsletter(profile) !== value.granted) {
            profile.custom.isNewsletter = value.granted;
        }
    },

    /**
     * Gets the newsletter consent for a profile.
     *
     * @param {dw.customer.Profile} profile - The profile object.
     * @returns {boolean} - The consent status.
     */
    getConsentsNewsletter: function (profile) {
        return profile.custom.isNewsletter;
    },

    /**
     * Sets the verified email for a profile.
     *
     * @param {dw.customer.Profile} profile - The profile object.
     * @param {Array} value - The verified email value.
     */
    setEmailVerified: function (profile, value) {
        if (value && this.getEmailVerified(profile) !== value[0]) {
            profile.setEmail(value[0]);
        }
    },

    /**
     * Gets the verified email for a profile.
     *
     * @param {dw.customer.Profile} profile - The profile object.
     * @returns {string} - The verified email.
     */
    getEmailVerified: function (profile) {
        return profile.email;
    }
};

module.exports = Actions;
