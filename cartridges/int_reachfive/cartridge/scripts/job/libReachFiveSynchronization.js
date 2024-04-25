'use strict';

/**
 * API
 */
var Transaction = require('dw/system/Transaction');
var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * Script Modules
 */
var reachFiveServiceInterface = require('int_reachfive/cartridge/scripts/interfaces/reachFiveInterface');


/**
 * @function
 * @description Adds API calls errors to the 'reachfiveError' attribute if request is fail
 * @param {string} errorMessage Error message
 * @param {dw.customer.Profile} profile - The current profile
 * */
function addReachFiveProfileError(errorMessage, profile) {
    var LINE_FEED = '\n'; // new line character;

    if (errorMessage && profile) {
        Transaction.wrap(function () {
            profile.custom.reachfiveError = (profile.custom.reachfiveError)
                ? profile.custom.reachfiveError + errorMessage + LINE_FEED + LINE_FEED
                : errorMessage + LINE_FEED + LINE_FEED;
        });
    }
}

/**
 * @function
 * @description Gets gender enum value
 * @param {string} gender - displayValue
 * @return {number} result - gender enum value
 * */
function getGenderValue(gender) {
    var genderValues = {
        male: 1,
        female: 2
    };

    return genderValues[gender];
}

/**
 * @function
 * @description Calls Service to trigger the verification email sending. It updates ReachFive profile addtibutes
 * @param {dw.customer.Profile} profile - The current profile
 * @param {string} managementToken management API token
 * @param {string} reachFiveExternalID ReachFive external profile ID
 * */
function sendVerificationEmail(profile, managementToken, reachFiveExternalID) {
    if (!profile || !managementToken || !reachFiveExternalID) {
        return;
    }

    var result = reachFiveServiceInterface.sendVerificationEmail(managementToken, reachFiveExternalID);

    if (!result.ok) {
        addReachFiveProfileError(result.errorMessage, profile);
    }

    Transaction.wrap(function () {
        profile.custom.reachfiveSendVerificationEmail = false;
    });
}


/**
 * @function
 * @description Calls Service to update ReachFive Email. It updates ReachFive profile addtibutes
 * @param {dw.customer.Profile} profile - The current profile
 * @param {string} managementToken management API token
 * @param {string} reachFiveExternalID ReachFive external profile ID
 * */
function updatePhoneAndEmail(profile, managementToken, reachFiveExternalID) {
    if (!profile || !managementToken || !reachFiveExternalID) {
        return;
    }
    var requestObj = {
        phone_number: profile.getPhoneMobile() ,
        email: profile.getEmail()
    };

    var result = reachFiveServiceInterface.updateProfile(requestObj, managementToken, reachFiveExternalID);

    if (!result.ok) {
        addReachFiveProfileError(result.errorMessage, profile);
    }
    return result;
}

/**
 * @function
 * @description Calls Service to update ReachFive profile. It updates ReachFive profile attributes
 * @param {dw.customer.Profile} profile - The current profile
 * @param {string} managementToken management API token
 * @param {string} reachFiveExternalID ReachFive external profile ID
 * */
function updateProfileField(profile, managementToken, reachFiveExternalID) {
    if (!profile || !managementToken || !reachFiveExternalID) {
        return;
    }

    var requestObj = {
        email: profile.email,
        phone_number: profile.phoneHome,
        phone_mobile: profile.phoneMobile
    };
    var result = reachFiveServiceInterface.updateProfile(requestObj, managementToken, reachFiveExternalID);

    if (!result.ok) {
        addReachFiveProfileError(result.errorMessage, profile);
    }

    Transaction.wrap(function () {
        profile.custom.reachfiveUpdateEmailAddress = false;
    });
}
/**
 * @function
 * @description Sets reach5 Object which includes item for request Object. Use 'reach5ProfileFieldsJSON' Site Preference.
 * which contains fields to synchronize and mapping between SFCC and ReachFive profile fields
 * @param {Object} obj  Current SFCC Object. Profile or CustomerAddress.
 * @param {Object} profileFieldsObj Profile fields Object from 'reach5ProfileFieldsJSON' Site Preference
 * @param {string} reach5ObjType Current ReachFive Object type
 * @return {Object} Result Object with ReachFive data for current item.
 * */
function setReach5Obj(obj, profileFieldsObj, reach5ObjType) {
    var StringUtils = require('dw/util/StringUtils');
    var Calendar = require('dw/util/Calendar');

    var CUSTOM = 'custom';

    var fieldsObj = profileFieldsObj[reach5ObjType];
    var resultObj = {};

    if (!fieldsObj) {
        return resultObj;
    }

    var value = null;
    // var key = null;
    var key2 = null;
    var customKey = null;

    // for (key in fieldsObj) { // eslint-disable-line no-restricted-syntax
    Object.keys(fieldsObj).forEach(function (key) {
        if (Object.hasOwnProperty.call(fieldsObj, key)) {
            key2 = fieldsObj[key];

            if (key.indexOf(CUSTOM + '.') === 0) {
                customKey = key.replace(CUSTOM + '.', '');
                value = obj[CUSTOM][customKey];
            } else {
                value = obj[key];
            }

            // Get EnumValuе. EnumValue has a base value and a display value.
            if (value && !empty(value.value)) {
                if (key === 'gender') {
                    resultObj[key2] = (value.value) ? value.displayValue.toLowerCase() : null;
                } else {
                    resultObj[key2] = value.displayValue;
                }
            } else if (value && key === 'birthday') {
                resultObj[key2] = StringUtils.formatCalendar(new Calendar(new Date(value)), 'yyyy-MM-dd');
            } else {
                value = (empty(value)) ? null : value;

                if (reach5ObjType === 'consents') {
                    if (value !== null) {
                        resultObj[key2] = {};
                        resultObj[key2].granted = value;
                    }
                } else {
                    resultObj[key2] = value;
                }
            }
        }
    });
    // }

    return resultObj;
}

/**
 * @function
 * @description Creates request Object with profile its addresses, consents and custom_fields data. Use 'reach5ProfileFieldsJSON' Site Preference.
 * which contains fields to synchronize and mapping between SFCC and ReachFive profile fields
 * @param {Object} profileFieldsObj profile fields Object from 'reach5ProfileFieldsJSON' Site Preference
 * @param {dw.customer.Profile} profile - The current profile
 * @return {Object} Result request Object.
 * */
function createProfileRequestObj(profileFieldsObj, profile) {
    var resultObj = {};
    var fieldsObj = profileFieldsObj.profile;
    var addrFieldsObj = profileFieldsObj.address;
    var consentsFieldsObj = profileFieldsObj.consents;
    var customFieldsObj = profileFieldsObj.custom_fields;

    if (fieldsObj) {
        resultObj = setReach5Obj(profile, profileFieldsObj, 'profile');
    }

    if (addrFieldsObj && profile.addressBook && profile.addressBook && profile.addressBook.addresses.length) {
        var addresses = profile.addressBook.addresses;
        var address = null;
        var addressObj = null;
        var defaultAddrId = profile.addressBook.preferredAddress && profile.addressBook.preferredAddress.UUID;

        resultObj.addresses = [];

        for (var i = 0, l = addresses.length; i < l; i++) {
            address = addresses[i];
            addressObj = {};

            if (defaultAddrId && address.UUID === defaultAddrId) {
                addressObj.default = true;
            }

            addressObj = setReach5Obj(address, profileFieldsObj, 'address');

            resultObj.addresses.push(addressObj);
        }
    }

    if (consentsFieldsObj) {
        resultObj.consents = setReach5Obj(profile, profileFieldsObj, 'consents');
    }

    if (customFieldsObj) {
        resultObj.custom_fields = setReach5Obj(profile, profileFieldsObj, 'custom_fields');
    }

    return resultObj;
}

/**
 * @function
 * @description Calls Service to update ReachFive profile. It updates ReachFive profile addtibutes
 * @param {Object} profileFieldsObj profile fields Object from 'reach5ProfileFieldsJSON' Site Preference
 * @param {dw.customer.Profile} profile - The current profile
 * @param {string} managementToken Management API token
 * @param {string} reachFiveExternalID ReachFive external profile ID
 * */
function updateProfile(profileFieldsObj, profile, managementToken, reachFiveExternalID) {
    if (!profile || !managementToken || !reachFiveExternalID) {
        return;
    }

    var requestObj = createProfileRequestObj(profileFieldsObj, profile);
    var result = reachFiveServiceInterface.updateProfile(requestObj, managementToken, reachFiveExternalID);

    if (!result.ok) {
        addReachFiveProfileError(result.errorMessage, profile);
    }

    Transaction.wrap(function () {
        profile.custom.reachfiveUpdateProfile = false;
    });
}

/**
 * @function
 * @description Cleans up Profile 'reachfiveError' attribute
 * @param {dw.customer.Profile} profile - The current profile
 * */
function cleanUpProfileErrorAttr(profile) {
    if (profile && profile.custom.reachfiveError) {
        Transaction.wrap(function () {
            profile.custom.reachfiveError = '';
        });
    }
}

/**
 * @function
 * @description Use 'reach5ProfileFieldsJSON' Site Preference.
 *  which contains fields to synchronize and mapping between ReachFive and SFCC profile fields
 * @param {Object} profileFieldsObj Profile fields Object from 'reach5ProfileFieldsJSON' Site Preference
 * @param {dw.customer.Profile} profile - The current profile
 * @param {Object} reachFiveUser  Current SFCC Object. Profile or CustomerAddress.
 * @param {string} reach5ObjType Current ReachFive Object type
 * @return {void}
 * */
function setR5toSFCCProfile(profileFieldsObj, profile, reachFiveUser, reach5ObjType) {
    var CUSTOM = 'custom';
    var fieldsObj = profileFieldsObj[reach5ObjType];

    if (!fieldsObj) {
        return;
    }

    // for (key in fieldsObj) { // eslint-disable-line no-restricted-syntax
    Object.keys(fieldsObj).forEach(function (key) {
        var value = null;
        var key2 = null;
        var customKey = null;

        if (Object.hasOwnProperty.call(fieldsObj, key)) {
            key2 = fieldsObj[key];

            if (key.indexOf(CUSTOM + '.') === 0) {
                customKey = key.replace(CUSTOM + '.', '');
                value = reachFiveUser[CUSTOM][customKey];
            } else {
                value = reachFiveUser[key];
            }

            // Get EnumValuе. EnumValue has a base value and a display value.
            if (value && key2 === 'gender') {
                profile[key2] = getGenderValue(value);
            } else if (value && key2 === 'birthday') {
                profile[key2] = new Date(value);
            } else {
                value = (empty(value)) ? null : value;

                if (reach5ObjType === 'consents') {
                    profile[key2] = {};
                    profile[key2].granted = value;
                } else {
                    profile[key2] = value;
                }
            }
        }
    });
}

/**
 * @function
 * @description Updates SFCC customer profile based on ReachFive user webhooks
 * @param {Object} profileFieldsObj profile fields Object from 'reach5ProfileFieldsJSON' Site Preference
 * @param {dw.customer.Profile} profile - The current profile
 * @param {string} reachFiveUser - reachFive Custom Object to use for profile update.
 * @param {string} reach5ObjType Current ReachFive Object type
 * */
function updateSFCCProfile(profileFieldsObj, profile, reachFiveUser, reach5ObjType) {
    if (!profileFieldsObj || !profile || !reachFiveUser || !reach5ObjType) {
        return;
    }
    Transaction.wrap(function () {
        setR5toSFCCProfile(profileFieldsObj, profile, reachFiveUser, reach5ObjType);
    });
}

/**
 * Export modules
 */
module.exports = {
    sendVerificationEmail: sendVerificationEmail,
    updateProfile: updateProfile,
    cleanUpProfileErrorAttr: cleanUpProfileErrorAttr,
    updateSFCCProfile: updateSFCCProfile,
    updateProfileField: updateProfileField
};
