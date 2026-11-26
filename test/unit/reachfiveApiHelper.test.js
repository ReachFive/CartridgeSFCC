'use strict';

/* eslint-env mocha */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();

var expect = chai.expect;

var EMAIL = 'jane@example.com';
var PASSWORD = 'secret';
var TARGET = '/account';
var PROFILE_ID = 'original-profile';
var SOCIAL_PROFILE_ID = 'social-profile';
var KAKAO = { provider: 'kakaotalk', user_id: '123' };

/**
 * Loads reachfiveApiHelper with its dependencies mocked.
 * @param {Object} options Answers of the mocked dependencies, see the defaults below
 * @returns {Object} The helper, the calls it made and the messages it logged
 */
function loadHelper(options) {
    var opts = Object.assign({
        loginAllowed: true,
        customer: { externalProfiles: [{ authenticationProviderID: 'ReachFive', externalID: PROFILE_ID }] },
        passwordLogin: { ok: true, object: { tkn: 'one-time-token' } },
        linkedCustomerProfile: null,
        token: { ok: true, token: 'management-token' },
        socialProfile: { ok: true, object: { has_password: false, identities: [KAKAO] } },
        deletion: { ok: true },
        addition: { ok: true }
    }, options);
    var calls = [];
    var logs = [];

    /**
     * Stub of the base profile model.
     * @param {Object} profile Profile
     */
    function BaseProfile(profile) {
        this.profile = profile;
    }
    var ReachfiveProfile = proxyquire('../../cartridges/int_reachfive/cartridge/models/profile/reachfiveOrigin', {
        '~/cartridge/models/profile/base': BaseProfile
    });

    var helper = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/helpers/reachfiveApiHelper', {
        'dw/system/Logger': {
            getLogger: function () {
                return {
                    warn: function (message) { logs.push(message); },
                    error: function (message) { logs.push(message); }
                };
            }
        },
        'dw/customer/CustomerMgr': {
            getCustomerByLogin: function () { return opts.customer; },
            getExternallyAuthenticatedCustomerProfile: function () { return opts.linkedCustomerProfile; }
        },
        '*/cartridge/models/profile/reachfiveOrigin': ReachfiveProfile,
        '*/cartridge/models/reachfiveSession': {},
        '*/cartridge/scripts/helpers/reachFiveHelper': {
            isReachFiveLoginAllowed: function () { return opts.loginAllowed; },
            getReachFiveProviderId: function () { return 'ReachFive'; },
            createLoginRedirectUrl: function (tkn, target) { return 'authorize?tkn=' + tkn + '&target=' + target; }
        },
        '*/cartridge/scripts/interfaces/reachFiveInterface': {
            passwordLogin: function () { calls.push('passwordLogin'); return opts.passwordLogin; },
            generateTokenForManagementAPI: function () { calls.push('token'); return opts.token; },
            getManagementUser: function (token, userId) { calls.push('get ' + userId); return opts.socialProfile; },
            deleteManagementUser: function (token, userId) { calls.push('delete ' + userId); return opts.deletion; },
            addManagementIdentity: function (token, userId, identity) {
                calls.push('add ' + identity.provider + ' to ' + userId);
                return opts.addition;
            }
        }
    });

    return { helper: helper, calls: calls, logs: logs };
}

describe('reachfiveApiHelper', function () {
    var previousEmpty;

    before(function () {
        previousEmpty = global.empty;
        global.empty = function (value) {
            return value === null || value === undefined || value === '';
        };
    });

    after(function () {
        global.empty = previousEmpty;
    });

    describe('getLinkFormLoginRedirectUrl', function () {
        it('should log in with the Purse Identity password and merge the social profile', function () {
            var loaded = loadHelper();

            var url = loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, SOCIAL_PROFILE_ID);

            expect(url).to.equal('authorize?tkn=one-time-token&target=/account');
            expect(loaded.calls).to.deep.equal([
                'passwordLogin',
                'token',
                'get ' + SOCIAL_PROFILE_ID,
                'delete ' + SOCIAL_PROFILE_ID,
                'add kakaotalk to ' + PROFILE_ID
            ]);
        });

        it('should return null without calling Purse Identity when the Purse Identity login is not allowed', function () {
            var loaded = loadHelper({ loginAllowed: false });

            expect(loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, SOCIAL_PROFILE_ID)).to.equal(null);
            expect(loaded.calls).to.deep.equal([]);
        });

        it('should return null without calling Purse Identity when the customer is not linked to Purse Identity', function () {
            var loaded = loadHelper({ customer: { externalProfiles: [] } });

            expect(loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, SOCIAL_PROFILE_ID)).to.equal(null);
            expect(loaded.calls).to.deep.equal([]);
        });

        it('should return null and merge nothing when the password is wrong', function () {
            var loaded = loadHelper({ passwordLogin: { ok: false, errorMessage: 'invalid_grant' } });

            expect(loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, SOCIAL_PROFILE_ID)).to.equal(null);
            expect(loaded.calls).to.deep.equal(['passwordLogin']);
        });

        it('should log in and log a warning when the session has no social profile', function () {
            var loaded = loadHelper();

            expect(loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, null)).to.equal('authorize?tkn=one-time-token&target=/account');
            expect(loaded.calls).to.deep.equal(['passwordLogin']);
            expect(loaded.logs[0]).to.contain('No social profile in session');
        });
    });

    describe('merge of the social profile', function () {
        /**
         * Runs the link form login with the given answers.
         * @param {Object} options Answers of the mocked dependencies
         * @returns {Object} The URL returned, the calls made and the messages logged
         */
        function linkFormLogin(options) {
            var loaded = loadHelper(options);
            var url = loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, SOCIAL_PROFILE_ID);
            return { url: url, calls: loaded.calls, logs: loaded.logs };
        }

        it('should do nothing when the social profile is the profile of the customer', function () {
            var loaded = loadHelper();

            loaded.helper.getLinkFormLoginRedirectUrl(EMAIL, PASSWORD, TARGET, PROFILE_ID);

            expect(loaded.calls).to.deep.equal(['passwordLogin']);
        });

        it('should not delete a social profile that a customer is linked to', function () {
            var result = linkFormLogin({ linkedCustomerProfile: {} });

            expect(result.url).to.not.equal(null);
            expect(result.calls).to.deep.equal(['passwordLogin']);
            expect(result.logs[0]).to.contain('a customer is linked to it');
        });

        it('should stop when no Management API token is issued', function () {
            var result = linkFormLogin({ token: { ok: false, errorMessage: 'invalid_client' } });

            expect(result.url).to.not.equal(null);
            expect(result.calls).to.deep.equal(['passwordLogin', 'token']);
            expect(result.logs[0]).to.contain('no Management API token');
        });

        it('should not delete a social profile that has a password', function () {
            var result = linkFormLogin({ socialProfile: { ok: true, object: { has_password: true, identities: [KAKAO] } } });

            expect(result.calls).to.not.include('delete ' + SOCIAL_PROFILE_ID);
            expect(result.logs[0]).to.contain('it has a password');
        });

        it('should not delete a social profile without social identity', function () {
            var result = linkFormLogin({ socialProfile: { ok: true, object: { has_password: false, identities: [{ provider: 'local', user_id: '1' }] } } });

            expect(result.calls).to.not.include('delete ' + SOCIAL_PROFILE_ID);
            expect(result.logs[0]).to.contain('it has no social identity');
        });

        it('should not add the identity when the social profile is not deleted', function () {
            var result = linkFormLogin({ deletion: { ok: false, errorMessage: 'forbidden' } });

            expect(result.calls).to.not.include('add kakaotalk to ' + PROFILE_ID);
            expect(result.logs[0]).to.contain('cannot delete it');
        });

        it('should log an identity that is not added, and still log in', function () {
            var result = linkFormLogin({ addition: { ok: false, errorMessage: 'conflict' } });

            expect(result.url).to.not.equal(null);
            expect(result.logs[0]).to.contain('not added to');
        });
    });
});
