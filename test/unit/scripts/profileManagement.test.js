'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mock des modules Demandware
const LocalServiceRegistry = require('dw-api-mock/dw/svc/LocalServiceRegistry');
const session = {
    privacy: {
        access_token: 'mockAccessToken'
    }
};

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
const profileManagement = proxyquire('../../../cartridges/int_reachfive/cartridge/scripts/interfaces/profileManagement', {
    './serviceConfig': {
        configureService: configureServiceStub
    },
    'dw/system/Logger': require('dw-api-mock/dw/system/Logger')
});

describe('profileManagement', function() {
    beforeEach(function() {
        global.session = session;
    });

    afterEach(function() {
        delete global.session;
    });

    describe('updateEmail', function() {
        it('should update email', function() {
            const result = profileManagement.updateEmail({ email: 'mockEmail' });
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });

    describe('updatePhone', function() {
        it('should update phone', function() {
            const result = profileManagement.updatePhone({ phone: 'mockPhone' });
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });

    describe('updateProfile', function() {
        it('should update profile', function() {
            const result = profileManagement.updateProfile({ profile: 'mockProfile' }, 'mockToken', 'mockID');
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });

    describe('updateProfileIdentityAPI', function() {
        it('should update profile identity API', function() {
            const result = profileManagement.updateProfileIdentityAPI({ profile: 'mockProfile' });
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });

    describe('getUserProfile', function() {
        it('should get user profile', function() {
            const result = profileManagement.getUserProfile('mockFields');
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });
});