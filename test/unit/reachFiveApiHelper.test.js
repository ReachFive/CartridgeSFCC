'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('reachfiveApiHelper', function() {
    let loggerStub;
    let reachFiveService;
    let reachFiveHelper;
    let reachfiveApiHelper;

    beforeEach(function() {
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
        reachfiveApiHelper = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/helpers/reachfiveApiHelper', {
            'dw/system/Logger': {
                getLogger: () => loggerStub
            },
            '*/cartridge/scripts/interfaces/reachFiveInterface': reachFiveService,
            '*/cartridge/scripts/helpers/reachFiveHelper': reachFiveHelper
        });
    });

    afterEach(function() {
        require('dw/system/Logger').getLogger.restore();
    });

    it('should login with password', function() {
        const email = 'test@example.com';
        const password = 'password123';
        const result = { ok: true, object: 'mockResponse' };

        reachFiveService.passwordLogin.returns(result);

        const response = reachfiveApiHelper.loginWithPassword(email, password);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.passwordLogin.calledOnceWith({ email, password })).to.be.true;
    });

    it('should sign up with credentials and profile', function() {
        const credentialsObj = { email: 'test@example.com', password: 'password123' };
        const profile = { firstName: 'John', lastName: 'Doe' };
        const result = { ok: true, object: 'mockResponse' };

        reachFiveService.signUp.returns(result);

        const response = reachfiveApiHelper.signUp(credentialsObj, profile);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.signUp.calledOnceWith(credentialsObj.email, credentialsObj.password, profile)).to.be.true;
    });

    it('should update password', function() {
        const email = 'test@example.com';
        const newPassword = 'newPassword123';
        const oldPassword = 'oldPassword123';
        const clientId = 'mockClientId';
        const result = { ok: true, object: 'mockResponse' };

        reachFiveHelper.getReachFiveApiKey.returns(clientId);
        reachFiveService.updatePassword.returns(result);

        const response = reachfiveApiHelper.updatePassword(email, newPassword, oldPassword);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.updatePassword.calledOnceWith(email, newPassword, oldPassword, clientId)).to.be.true;
    });

    it('should log an error if update password fails', function() {
        const email = 'test@example.com';
        const newPassword = 'newPassword123';
        const oldPassword = 'oldPassword123';
        const clientId = 'mockClientId';
        const result = { ok: false, errorMessage: 'mockError' };

        reachFiveHelper.getReachFiveApiKey.returns(clientId);
        reachFiveService.updatePassword.returns(result);

        const response = reachfiveApiHelper.updatePassword(email, newPassword, oldPassword);

        expect(response).to.deep.equal(result);
    });

    it('should get user profile', function() {
        const profileFields = 'id,email';
        const result = { ok: true, object: 'mockResponse' };

        reachFiveService.getUserProfile.returns(result);

        const response = reachfiveApiHelper.getUserProfile(profileFields);

        expect(response).to.deep.equal(result);
        expect(reachFiveService.getUserProfile.calledOnceWith(profileFields)).to.be.true;
    });

    it('should log an error if get user profile fails', function() {
        const profileFields = 'id,email';
        const result = { ok: false, errorMessage: 'mockError' };

        reachFiveService.getUserProfile.returns(result);

        const response = reachfiveApiHelper.getUserProfile(profileFields);

        expect(response).to.deep.equal(result);
        expect(loggerStub.error.calledOnce).to.be.true;
    });
});