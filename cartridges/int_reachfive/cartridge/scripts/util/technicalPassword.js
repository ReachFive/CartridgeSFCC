'use strict';

var SecureRandom = require('dw/crypto/SecureRandom');
var CustomerMgr = require('dw/customer/CustomerMgr');

var CHARACTER_SETS = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnpqrstuvwxyz',
    '23456789',
    '!@#$%&*()-_=+?'
];
var PASSWORD_LENGTH = 24;
var MAX_ATTEMPTS = 5;

/**
 * Builds one random password with at least one character of each set, in random order.
 *
 * @param {dw.crypto.SecureRandom} random - Random number generator
 * @returns {string} The password
 */
function buildCandidate(random) {
    var allCharacters = CHARACTER_SETS.join('');
    var characters = CHARACTER_SETS.map(function (set) {
        return set.charAt(random.nextInt(set.length));
    });

    while (characters.length < PASSWORD_LENGTH) {
        characters.push(allCharacters.charAt(random.nextInt(allCharacters.length)));
    }

    for (var i = characters.length - 1; i > 0; i -= 1) {
        var j = random.nextInt(i + 1);
        var swap = characters[i];
        characters[i] = characters[j];
        characters[j] = swap;
    }

    return characters.join('');
}

/**
 * Generates the password given to a customer created from a ReachFive profile. The customer never
 * learns it: it only has to pass the site password policy when the customer is created.
 *
 * @returns {string} A password accepted by the site password policy
 * @throws {Error} If no generated password is accepted by the site password policy
 */
function generate() {
    var random = new SecureRandom();

    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        var candidate = buildCandidate(random);
        if (CustomerMgr.isAcceptablePassword(candidate)) {
            return candidate;
        }
    }

    throw new Error('No generated technical password is accepted by the site password policy');
}

module.exports = {
    generate: generate
};
