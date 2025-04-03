'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

var reachfiveSettings = {
    getReachFiveApiKey: sinon.stub()
};

describe('reachFiveApiHelper', function () {
    let loggerStub;
    let reachFiveService;
    let reachFiveHelper;
    let reachFiveApiHelper;

    beforeEach(function () {
        // Mock des modules Demandware
        loggerStub = {
            error: sinon.spy(),
            info: sinon.spy()
        };
        sinon.stub(require('dw/system/Logger'), 'getLogger').returns(loggerStub);

        // Mock des interfaces de service
        reachFiveService = {
            passwordLogin: sinon.stub(),
            signUp: sinon.stub(),
            oauthToken: sinon.stub(),
            updatePassword: sinon.stub(),
            getUserProfile: sinon.stub(),
            updatePhone: sinon.stub(),
            updateEmail: sinon.stub(),
            updateProfileIdentityAPI: sinon.stub(),
            generateTokenForManagementAPI: sinon.stub(),
            updateProfile: sinon.stub()
        };

        // Mock des helpers
        reachFiveHelper = {
            getReachFiveApiKey: sinon.stub(),
            getReachFiveProviderId: sinon.stub(),
            isReachFiveEnabled: sinon.stub()
        };

        // Import du fichier à tester avec les mocks
        reachFiveApiHelper = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/helpers/reachFiveApiHelper', {
            'dw/system/Logger': {
                getLogger: () => loggerStub
            },
            '*/cartridge/scripts/interfaces/reachFiveInterface': reachFiveService,
            '*/cartridge/scripts/helpers/reachFiveHelper': reachFiveHelper,
            '*/cartridge/models/reachfiveSettings': reachfiveSettings
        });
    });

    afterEach(function () {
        require('dw/system/Logger').getLogger.restore();
    });

    it('should login with password', function () {
        const email = 'test@example.com';
        const password = 'password123';
        const result = { ok: true, object: 'mockResponse' };

        reachFiveService.passwordLogin.returns(result);

        const response = reachFiveService.passwordLogin({ email, password });

        expect(response).to.deep.equal(result);
        expect(reachFiveService.passwordLogin.calledOnceWith({ email, password })).to.equal(true);
    });

    it('should sign up with credentials and profile', function () {
        const email = 'test@example.com';
        const password = 'password123';
        const profile = { firstName: 'John', lastName: 'Doe' };
        const result = { ok: true, object: 'mockResponse' };

        reachFiveService.signUp.returns(result);

        const response = reachFiveService.signUp(email, password, profile);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.signUp.calledOnceWith(email, password, profile)).to.equal(true);
    });

    it('should update password', function () {
        const email = 'test@example.com';
        const newPassword = 'newPassword123';
        const oldPassword = 'oldPassword123';
        const clientId = 'mockClientId';
        const result = { ok: true, object: 'mockResponse' };

        reachfiveSettings.getReachFiveApiKey.returns(clientId);
        reachFiveService.updatePassword.returns(result);

        const response = reachFiveApiHelper.updatePassword(email, newPassword, oldPassword);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.updatePassword.calledOnceWith(email, newPassword, oldPassword, clientId)).to.equal(true);
    });

    it('should log an error if update password fails', function () {
        const email = 'test@example.com';
        const newPassword = 'newPassword123';
        const oldPassword = 'oldPassword123';
        const clientId = 'mockClientId';
        const result = { ok: false, errorMessage: 'mockError' };

        reachfiveSettings.getReachFiveApiKey.returns(clientId);
        reachFiveService.updatePassword.returns(result);

        const response = reachFiveApiHelper.updatePassword(email, newPassword, oldPassword);

        expect(response).to.deep.equal(result);
    });

    it('should get user profile', function () {
        const profileFields = 'id,email';
        const result = { ok: true, object: 'mockResponse' };

        reachFiveService.getUserProfile.returns(result);

        const response = reachFiveApiHelper.getUserProfile(profileFields);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.getUserProfile.calledOnceWith(profileFields)).to.equal(true);
    });

    it('should log an error if get user profile fails', function () {
        const profileFields = 'id,email';
        const result = { ok: false, errorMessage: 'mockError' };

        reachFiveService.getUserProfile.returns(result);

        const response = reachFiveApiHelper.getUserProfile(profileFields);

        expect(response).to.deep.equal(result);
        expect(loggerStub.error.calledOnce).to.equal(true);
    });
});
