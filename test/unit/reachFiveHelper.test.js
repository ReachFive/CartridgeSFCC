'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const Site = require('dw-api-mock/dw/system/Site');
const Logger = require('dw-api-mock/dw/system/Logger');
const Encoding = require('dw-api-mock/dw/crypto/Encoding');

describe('reachFiveHelper', function() {
    let loggerStub;
    let siteStub;
    let reachFiveHelper;

    beforeEach(function() {
        // Mock des modules Demandware
        siteStub = {
            getCurrent: sinon.stub().returns({
                getCustomPreferenceValue: sinon.stub()
            })
        };
        loggerStub = {
            info: sinon.spy(),
            warn: sinon.spy(),
            error: sinon.spy()
        };
        sinon.stub(Logger, 'getLogger').returns(loggerStub);

        const ReachfiveSession = proxyquire('../../cartridges/int_reachfive/cartridge/models/reachfiveSession', {
            'dw/crypto/Encoding': Encoding,
            'dw/system/Site': Site,
            'dw/system/Logger': Logger
        });
        // Import du fichier à tester avec les mocks
        reachFiveHelper = proxyquire('../../cartridges/int_reachfive/cartridge/scripts/helpers/reachFiveHelper', {
            'dw/system/Site': siteStub,
            'dw/system/Logger': Logger,
            '*/cartridge/models/reachfiveSession': ReachfiveSession
        });
    });

    afterEach(function() {
        require('dw/system/Logger').getLogger.restore();
    });

    it('should return the correct value for getReachFiveDomain', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5Domain').returns('mockDomain');
        expect(reachFiveHelper.getReachFiveDomain()).to.equal('mockDomain');
    });

    it('should return the correct value for getReachFiveApiKey', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ApiKey').returns('mockApiKey');
        expect(reachFiveHelper.getReachFiveApiKey()).to.equal('mockApiKey');
    });

    it('should return the correct value for getReachFiveClientSecret', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ClientSecret').returns('mockClientSecret');
        expect(reachFiveHelper.getReachFiveClientSecret()).to.equal('mockClientSecret');
    });

    it('should return the correct value for getReachFiveProviderId', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reachFiveProviderId').returns('mockProviderId');
        expect(reachFiveHelper.getReachFiveProviderId()).to.equal('mockProviderId');
    });

    it('should return the correct value for isReachFiveEnabled', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('isReachFiveEnabled').returns(true);
        expect(reachFiveHelper.isReachFiveEnabled()).to.be.true;
    });

    it('should return the correct value for isReachFiveTransitionActive', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('isReachFiveTransitionActive').returns(true);
        expect(reachFiveHelper.isReachFiveTransitionActive()).to.be.true;
    });

    it('should return the correct value for getReachFiveTheme', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('isReach5ThemeActive').returns(true);
        expect(reachFiveHelper.getReachFiveTheme()).to.equal('light');
    });

    it('should return the correct value for getReachFiveUiSdkUrl', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5UiSdkUrl').returns('mockUiSdkUrl');
        expect(reachFiveHelper.getReachFiveUiSdkUrl()).to.equal('mockUiSdkUrl');
    });

    it('should return the correct value for getReachFiveCoreSdkUrl', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5CoreSdkUrl').returns('mockCoreSdkUrl');
        expect(reachFiveHelper.getReachFiveCoreSdkUrl()).to.equal('mockCoreSdkUrl');
    });

    it('should return the correct value for isFastRegister', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('isReachFiveFastRegister').returns(true);
        expect(reachFiveHelper.isFastRegister()).to.be.true;
    });

    it('should return the correct value for getReachFiveManagementApiKey', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ManagementApiKey').returns('mockManagementApiKey');
        expect(reachFiveHelper.getReachFiveManagementApiKey()).to.equal('mockManagementApiKey');
    });

    it('should return the correct value for getReachFiveManagementClientSecret', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ManagementClientSecret').returns('mockManagementClientSecret');
        expect(reachFiveHelper.getReachFiveManagementClientSecret()).to.equal('mockManagementClientSecret');
    });

    it('should return the correct value for getReachFiveManagementScope', function() {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ManagementScope').returns('mockManagementScope');
        expect(reachFiveHelper.getReachFiveManagementScope()).to.equal('mockManagementScope');
    });

    it('should return the correct value for getReachFiveProfileFieldsJSON', function() {
        const json = {field1: "value1"};
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ProfileFieldsJSON').returns(JSON.stringify(json));
        expect(reachFiveHelper.getReachFiveProfileFieldsJSON()).to.deep.equal(json);
    });

    it('should log an error if getReachFiveProfileFieldsJSON is invalid', function() {
        const invalidJsonStr = '{"field1": "value1"';
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5ProfileFieldsJSON').returns(invalidJsonStr);
        expect(reachFiveHelper.getReachFiveProfileFieldsJSON()).to.be.null;
        expect(loggerStub.error.calledOnce).to.be.true;
    });
});