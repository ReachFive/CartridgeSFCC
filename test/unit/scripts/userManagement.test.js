'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mock des modules Demandware
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

var Encoding = require('dw-api-mock/dw/crypto/Encoding');
var Site = require('dw-api-mock/dw/system/Site');
// Mock des helpers et settings
const reachFiveSettings = proxyquire(
    '../../../cartridges/int_reachfive/cartridge/models/reachfiveSettings',
    {}
);
var ReachfiveSession = proxyquire(
    '../../../cartridges/int_reachfive/cartridge/models/reachfiveSession',
    {
        'dw/crypto/Encoding': Encoding,
        'dw/system/Site': Site,
        'dw/system/Logger': require('dw-api-mock/dw/system/Logger'),
        '*/cartridge/models/reachfiveSettings': reachFiveSettings
    }
);

const reachFiveHelper = proxyquire(
    '../../../cartridges/int_reachfive/cartridge/scripts/helpers/reachFiveHelper',
    {
        '*/cartridge/models/reachfiveSession': ReachfiveSession,
        '*/cartridge/models/reachfiveSettings': reachFiveSettings
    }
);
const generateTokenForManagementAPI = sinon
    .stub()
    .returns({ ok: true, token: 'mockManagementToken' });

// Import du fichier à tester avec les mocks
const userManagement = proxyquire(
    '../../../cartridges/int_reachfive/cartridge/scripts/interfaces/userManagement',
    {
        './serviceConfig': {
            configureService: configureServiceStub
        },
        './tokenManagement': {
            generateTokenForManagementAPI: generateTokenForManagementAPI
        },
        '~/cartridge/scripts/helpers/reachFiveHelper': reachFiveHelper,
        '~/cartridge/models/reachfiveSettings': reachFiveSettings,
        '~/cartridge/scripts/helpers/utils': proxyquire('../../../cartridges/int_reachfive/cartridge/scripts/helpers/utils', {}),
        'dw/system/Logger': require('dw-api-mock/dw/system/Logger')
    }
);

describe('userManagement', function () {
    beforeEach(function () {
        global.session = session;
    });

    afterEach(function () {
        delete global.session;
    });

    describe('sendVerificationEmail', function () {
        it('should send verification email', function () {
            const result = userManagement.sendVerificationEmail(
                'mockManagementToken',
                'mockExternalID'
            );
            expect(result).to.deep.equal({
                ok: true,
                errorMessage: ''
            });
        });
    });

    describe('sendVerificationPhone', function () {
        it('should send verification phone', function () {
            const result = userManagement.sendVerificationPhone(
                'mockManagementToken',
                'mockExternalID'
            );
            expect(result).to.deep.equal({
                ok: true,
                errorMessage: ''
            });
        });
    });

    describe('updatePassword', function () {
        it('should update password', function () {
            const result = userManagement.updatePassword(
                'mockEmail',
                'mockNewPassword',
                'mockOldPassword',
                'mockClientId'
            );
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });

    describe('getUserFields', function () {
        it('should get user fields', function () {
            const result = userManagement.getUserFields('mockClientId');
            expect(result).to.deep.equal({
                ok: true,
                object: 'mockResponse',
                errorMessage: ''
            });
        });
    });
});
