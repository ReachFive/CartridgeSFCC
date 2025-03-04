'use strict';

/**
 * Merges two objects into a new object. Properties from the second object
 * will overwrite properties from the first object if they have the same key.
 *
 * @param {Object} obj1 - The first object to merge.
 * @param {Object} obj2 - The second object to merge.
 * @returns {Object} A new object containing properties from both obj1 and obj2.
 */
function mergeObjects(obj1, obj2) {
    return Object.assign({}, obj1, obj2);
}

module.exports = {
    mergeObjects: mergeObjects
};
