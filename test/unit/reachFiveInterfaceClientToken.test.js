'use strict';

/* eslint-env mocha */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();

var expect = chai.expect;

/**
 * Loads reachFiveInterface with the service registry mocked.
 * @param {Object} serviceResults Result of each service call, by service name
 * @param {Array} calledServices Collects the name of each service called
 * @param {string} externalID ReachFive ID returned for the customer
 * @returns {Object} The interface module
 */
function loadInterface(serviceResults, calledServices, externalID) {
    return proxyquire('../../cartridges/int_reachfive/cartridge/scripts/interfaces/reachFiveInterface', {
        'dw/svc/LocalServiceRegistry': {
            createService: function (serviceName) {
                return {
                    setRequestMethod: function () {},
                    addHeader: function () {},
                    call: function () {
                        calledServices.push(serviceName);
                        return serviceResults[serviceName];
                    }
                };
            }
        },
        'dw/web/URLUtils': {},
        'dw/customer/CustomerMgr': {},
        'dw/system/Site': {},
        'dw/crypto/Encoding': {},
        'dw/util/Bytes': {},
        '~/cartridge/scripts/helpers/reachFiveHelper': {
            getReachFiveApiKey: function () { return 'api-key'; },
            getReachFiveClientSecret: function () { return 'api-secret'; },
            getReachFiveManagementApiKey: function () { return 'management-key'; },
            getReachFiveManagementClientSecret: function () { return 'management-secret'; },
            getReachFiveManagementScope: function () { return 'manage:users'; },
            getReachFiveExternalID: function () { return externalID; }
        },
        '*/cartridge/models/reachfiveSettings': { reach5ApiKey: 'api-key', reach5ClientSecret: 'api-secret' }
    });
}

describe('reachFiveInterface.generateToken', function () {
    it('should return the access token of the client credentials call', function () {
        var reachFiveInterface = loadInterface({
            'reachfive.rest.auth': { ok: true, object: { access_token: 'abc123' } }
        }, [], null);

        expect(reachFiveInterface.generateToken()).to.equal('abc123');
    });

    it('should return no token when the token call fails', function () {
        var reachFiveInterface = loadInterface({
            'reachfive.rest.auth': { ok: false, object: null, errorMessage: 'invalid_client' }
        }, [], null);

        expect(reachFiveInterface.generateToken()).to.equal(null);
    });
});

describe('reachFiveInterface.deleteUser', function () {
    it('should not call the delete service when the Management API token call fails', function () {
        var calledServices = [];
        var reachFiveInterface = loadInterface({
            'reachfive.rest.auth': { ok: false, object: null, errorMessage: 'invalid_client' }
        }, calledServices, 'reachfive-user-id');

        var result = reachFiveInterface.deleteUser({});

        expect(result.ok).to.equal(false);
        expect(result.errorMessage).to.equal('invalid_client');
        expect(calledServices).to.deep.equal(['reachfive.rest.auth']);
    });

    it('should call the delete service when the Management API token call succeeds', function () {
        var calledServices = [];
        var reachFiveInterface = loadInterface({
            'reachfive.rest.auth': { ok: true, object: { access_token: 'abc123' } },
            'reachfive.deleteuser': { ok: true }
        }, calledServices, 'reachfive-user-id');

        var result = reachFiveInterface.deleteUser({});

        expect(result.ok).to.equal(true);
        expect(calledServices).to.deep.equal(['reachfive.rest.auth', 'reachfive.deleteuser']);
    });
});
