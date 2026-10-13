'use strict';

/* eslint-env mocha */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();

var expect = chai.expect;

/**
 * Loads reachFiveInterface with the token service answering `serviceResult`.
 * @param {Object} serviceResult Result of the 'reachfive.rest.auth' service call
 * @returns {Object} The interface module
 */
function loadInterface(serviceResult) {
    return proxyquire('../../cartridges/int_reachfive/cartridge/scripts/interfaces/reachFiveInterface', {
        'dw/svc/LocalServiceRegistry': {
            createService: function () {
                return { call: function () { return serviceResult; } };
            }
        },
        'dw/web/URLUtils': {},
        'dw/customer/CustomerMgr': {},
        'dw/system/Site': {},
        'dw/crypto/Encoding': {},
        'dw/util/Bytes': {},
        '~/cartridge/scripts/helpers/reachFiveHelper': {
            getReachFiveManagementApiKey: function () { return 'management-key'; },
            getReachFiveManagementClientSecret: function () { return 'management-secret'; },
            getReachFiveManagementScope: function () { return 'manage:users'; }
        },
        '*/cartridge/models/reachfiveSettings': { reach5ApiKey: 'api-key', reach5ClientSecret: 'api-secret' }
    });
}

describe('reachFiveInterface.generateTokenForManagementAPI', function () {
    it('should return the access token in `token`, which the Management API callers read', function () {
        var reachFiveInterface = loadInterface({ ok: true, object: { access_token: 'abc123' } });

        var result = reachFiveInterface.generateTokenForManagementAPI();

        expect(result.ok).to.equal(true);
        expect(result.token).to.equal('abc123');
    });

    it('should return no token and the error message when the token call fails', function () {
        var reachFiveInterface = loadInterface({ ok: false, errorMessage: 'invalid_client' });

        var result = reachFiveInterface.generateTokenForManagementAPI();

        expect(result.ok).to.equal(false);
        expect(result.token).to.equal(undefined);
        expect(result.errorMessage).to.equal('invalid_client');
    });
});
