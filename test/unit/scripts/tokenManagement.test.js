'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mock des modules Demandware
const LocalServiceRegistry = require('dw-api-mock/dw/svc/LocalServiceRegistry');
const URLUtils = require('dw-api-mock/dw/web/URLUtils');
const Resource = require('dw-api-mock/dw/web/Resource');
const Logger = require('dw-api-mock/dw/system/Logger');

var Encoding = require('dw-api-mock/dw/crypto/Encoding');
var Site = require('dw-api-mock/dw/system/Site');
var ReachfiveSession = proxyquire('../../../cartridges/int_reachfive/cartridge/models/reachfiveSession', {
    'dw/crypto/Encoding': Encoding,
    'dw/system/Site': Site,
    'dw/system/Logger': require('dw-api-mock/dw/system/Logger')
});

// Mock des helpers et settings
const reachFiveHelper = proxyquire('../../../cartridges/int_reachfive/cartridge/scripts/helpers/reachFiveHelper', {
    '*/cartridge/models/reachfiveSession': ReachfiveSession
});
const reachFiveSettings = proxyquire('../../../cartridges/int_reachfive/cartridge/models/reachfiveSettings', {});

// Mock de `serviceConfig`
const configureServiceStub = sinon.stub().returns({
    setRequestMethod: sinon.stub(),
    addHeader: sinon.stub(),
    call: sinon.stub().returns({
        ok: true,
        object: 'mockResponse',
        errorMessage: 'mockErrorMessage'
    })
});

// Import du fichier à tester avec les mocks
const tokenManagement = proxyquire('../../../cartridges/int_reachfive/cartridge/scripts/interfaces/tokenManagement', {
    './serviceConfig': {
        configureService: configureServiceStub
    },
    'dw/web/URLUtils': URLUtils,
    'dw/web/Resource': Resource,
    'dw/system/Logger': Logger,
    '~/cartridge/scripts/helpers/reachFiveHelper': reachFiveHelper,
    '*/cartridge/models/reachfiveSettings': reachFiveSettings,
});

describe('tokenManagement', function() {
    describe('oauthToken', function() {
        it('should retrieve OAuth token', function() {
            const result = tokenManagement.oauthToken({ grant_type: 'client_credentials' });
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });

    describe('generateTokenForManagementAPI', function() {
        it('should generate token for management API', function() {
            const result = tokenManagement.generateTokenForManagementAPI();
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });
    describe('retrieveAccessTokenWithRefresh', function() {
        it('should retrieve access token with refresh', function() {
            const result = tokenManagement.retrieveAccessTokenWithRefresh('mockRefreshToken');
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });
});