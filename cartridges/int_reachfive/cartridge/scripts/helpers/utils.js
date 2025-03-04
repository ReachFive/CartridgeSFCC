'use strict';

function mergeObjects(obj1, obj2) {
    return Object.assign({}, obj1, obj2);
}

module.exports = {
    mergeObjects: mergeObjects
};