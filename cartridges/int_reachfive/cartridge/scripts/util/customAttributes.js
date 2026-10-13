'use strict';

var LOGGER = require('dw/system/Logger').getLogger('loginReachFive');

/**
 * Reads a custom attribute that the instance may not declare. An instance that deployed the code
 * without importing the cartridge metadata has no such attribute, and reading it throws.
 *
 * @param {dw.object.ExtensibleObject} object - Object holding the custom attribute
 * @param {string} attributeId - Custom attribute ID
 * @returns {*} The attribute value, or null if the attribute is not declared
 */
function getCustomAttribute(object, attributeId) {
    if (!object || !object.custom) {
        return null;
    }
    // No `in` check: on a real custom attributes object it is false for a declared attribute without a value.
    try {
        return object.custom[attributeId];
    } catch (e) {
        return null;
    }
}

/**
 * Writes a custom attribute that the instance may not declare. Must be called inside a transaction.
 *
 * @param {dw.object.ExtensibleObject} object - Object holding the custom attribute
 * @param {string} attributeId - Custom attribute ID
 * @param {*} value - Value to store
 * @returns {boolean} true if the value was stored, false if the attribute is not declared
 */
function setCustomAttribute(object, attributeId, value) {
    if (object && object.custom) {
        try {
            object.custom[attributeId] = value;
            return true;
        } catch (e) {
            // Writing an undeclared attribute throws.
        }
    }
    LOGGER.warn('Custom attribute {0} is not declared on this instance, value not stored. Import the cartridge metadata (system-objecttype-extensions.xml).', attributeId);
    return false;
}

module.exports = {
    getCustomAttribute: getCustomAttribute,
    setCustomAttribute: setCustomAttribute
};
