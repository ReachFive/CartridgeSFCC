'use strict';

// TODO: change next request into settings model
var PROVIDER_ID = require('*/cartridge/models/reachfiveSettings').getReachFiveProviderId();
var PATH_DELIMITER = ' ';
// TODO: Mock object need to be transferred in preferences
var propertyObj = {
    given_name: 'John',
    family_name: 'Doe',
    birthdate: '1983-11-13',
    email: 'john.doe@example.com',
    email_verified: true,
    emails: {
        verified: [
            'john.doe@example.com'
        ],
        unverified: [
            'other@example.com'
        ]
    },
    gender: 'male',
    phone_number: '+33612345678',
    addresses: [
        {
            id: 0,
            default: true,
            address_type: 'billing',
            street_address: '10 rue Chaptal',
            locality: 'Paris',
            postal_code: '75009',
            region: 'Île-de-France',
            country: 'France',
            recipient: 'Matthieu Winoc',
            phone_number: '0723538943'
        }
    ],
    custom_fields: {
        loyalty_card_number: '19872359235'
    },
    consents: {
        newsletter: {
            // consent_type: 'opt-in',
            // granted: true,
            // date: '2018-05-25T15:41:09.671321Z',
            // consent_version: {
            //     version_id: 1,
            //     language: 'fr'
            // }
        }
    }
};

/**
 * @constructor
 * @classdesc Profile data model
 *
 * @param {Object} profile - Reachfive profile object
 * @param {string} profile.id - Reachfive profile id ("AVqvOB58Fg6nZfQ0ZqXt")
 * @param {string} profile.name - Reachfive profile name ("John Doe")
 * @param {string} profile.given_name - Reachfive profile firstname ("John")
 * @param {string} profile.family_name - Reachfive profile lastname ("Doe")
 * @param {string} profile.email - Reachfive profile email ("john.doe[@]example.com")
 * @param {string} profile.phone_number - Reachfive profile phone ("+33612345678")
 * @param {string} [profile.birthdate] - Reachfive profile birthday ("1983-11-13")
 */
function BaseProfile(profile) {
    this.profile = profile;
}

/**
 * @function
 * @description Return value of the property with deep path arr
 * @param {Object} obj property object
 * @param {array} pathArr property object
 * @return {Object|array|string|undefined} result
 * */
function getValueByArrPath(obj, pathArr) {
    return pathArr.reduce(function (accumulator, value) {
        return accumulator ? accumulator[value] : accumulator;
    }, obj);
}

/**
 * @function
 * @description Return array with request property values
 * @param {Object} propObj property object
 * @return {array} result
 * */
function getRequestPropArr(propObj) {
    var valueArr = [];
    var propObjEl;

    /**
     * @function
     * @description Recusive function for reduce process
     * @param {array} accumulator array with property path values
     * @param {string} currentValue current property name
     * @param {number} index current index
     * @param {array} arr object keys array
     * @return {array} result
     * */
    function reduceObj(accumulator, currentValue, index, arr) {
        var result = accumulator;

        if (index !== 0) {
            valueArr.pop();
        }
        valueArr.push(currentValue);

        propObjEl = getValueByArrPath(propObj, valueArr);

        if (typeof propObjEl === 'object'
            && Object.keys(propObjEl).length > 0
            && !Array.isArray(propObjEl)) {
            result = Object.keys(propObjEl).reduce(reduceObj, accumulator);
        } else {
            result.push(valueArr.join(PATH_DELIMITER));
        }

        if (index === arr.length - 1) {
            valueArr.pop();
        }

        return result;
    }

    var propertyArray = Object.keys(propObj).reduce(reduceObj, []);

    return propertyArray;
}

// Class constants
BaseProfile.PROVIDER_ID = PROVIDER_ID;

BaseProfile.prototype = {
    /**
     * @description Update Salesforce User Profile
     *
     * @param {string} [fields] - comma separated list of fields to update
     */
    updateCustomerProfile: function (fields) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var ActionsModel = require('*/cartridge/models/profile/actions');
        var profile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(PROVIDER_ID, this.profile.id);

        if (profile) {
            var customer = profile.getCustomer();
            var conveyorArr = [];

            if (fields) {
                conveyorArr = fields.split(',');
            } else {
                // Prepare conveyor array
                // TODO: propertyObj - this is a configuration object taken from preferences
                // TODO: The structure of this JSON the same as reachfive user profile model
                // TODO: Put only required fields
                conveyorArr = getRequestPropArr(propertyObj);
            }
            var actionsModel = new ActionsModel();
            var reachfiveProfile = this.profile;

            conveyorArr.forEach(function (propPathStr) {
                var propPathArr = propPathStr.split(PATH_DELIMITER);
                var value = getValueByArrPath(this, propPathArr);

                if (!empty(value)) {
                    actionsModel.set(customer, profile, propPathStr, value);
                }
            }, reachfiveProfile);
        }
    },
    getUserProfileObj: function (fieldsStr) {
        var fields = fieldsStr || 'id,email,given_name,family_name';
        var fieldsArr = fields.split(',');
        var result = {};
        var profile = this.profile;

        result = fieldsArr.reduce(function (accumulator, valuePath) {
            var pathArr = valuePath.split(PATH_DELIMITER);
            var value = getValueByArrPath(profile, pathArr);
            var pointer = accumulator;

            if (value) {
                pathArr.forEach(function (key, index, arr) {
                    if (index === (arr.length - 1)) {
                        pointer[key] = value;
                    } else {
                        if (!pointer[key]) {
                            pointer[key] = {};
                        }
                        pointer = pointer[key];
                    }
                });
            }

            return pointer;
        }, result);

        return result;
    },
    /**
     * @description Compare 2 objects for identity by specified fields
     *
     * @param {Object} obj - Object with the same properties structure as current or the same type
     * @prop {Object} obj.profile - tested profile object
     * @param {string} [fields] - comma separated list of fields to check if exist
     * @return {boolean} result of check
     */
    equal: function (obj, fields) {
        var result = true;
        var profile = obj && obj.profile;
        var keys = [];

        if (fields) {
            keys = fields.split(',');
        } else {
            keys = Object.keys(this.profile);
        }

        if (keys.length && !empty(profile)) {
            keys.forEach(function (key) {
                if (this[key] !== profile[key]) {
                    result = false;
                }
            }, this.profile);
        } else {
            result = false;
        }

        return result;
    }
};

module.exports = BaseProfile;
