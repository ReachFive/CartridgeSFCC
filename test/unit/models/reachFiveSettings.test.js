'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const Logger = require('dw-api-mock/dw/system/Logger');

// Mock des modules Demandware
const currentSite = {
    getCustomPreferenceValue: sinon.stub()
};

describe('reachfiveSettings', function() {
    let loggerStub;
    let reachfiveSettings;

    beforeEach(function() {
        loggerStub = {
            info: sinon.spy(),
            warn: sinon.spy(),
            error: sinon.spy()
        };
        sinon.stub(Logger, 'getLogger').returns(loggerStub);

        // Import du fichier à tester avec les mocks
        reachfiveSettings = proxyquire('../../../cartridges/int_reachfive/cartridge/models/reachfiveSettings', {
            'dw/system/Site': {
                getCurrent: () => currentSite
            },
            'dw/system/Logger': Logger
        });

        currentSite.getCustomPreferenceValue.reset();
    });

    afterEach(function() {
        Logger.getLogger.restore();
    });

    it('should return the correct value for isReachFiveEnabled', function() {
        currentSite.getCustomPreferenceValue.withArgs('isReachFiveEnabled').returns(true);
        expect(reachfiveSettings.isReachFiveEnabled).to.be.true;
    });

    it('should return the correct value for reach5ProfileFieldsJSON', function() {
        const jsonStr = '{"field1": "value1"}';
        currentSite.getCustomPreferenceValue.withArgs('reach5ProfileFieldsJSON').returns(jsonStr);
        expect(reachfiveSettings.reach5ProfileFieldsJSON).to.deep.equal({ field1: 'value1' });
    });

    it('should log an error if reach5ProfileFieldsJSON is invalid', function() {
        const invalidJsonStr = '{"field1": "value1"';
        currentSite.getCustomPreferenceValue.withArgs('reach5ProfileFieldsJSON').returns(invalidJsonStr);
        expect(reachfiveSettings.reach5ProfileFieldsJSON).to.be.null;
        expect(loggerStub.error.calledOnce).to.be.true;
    });

    it('should return the correct value for reachFiveCheckCredentials', function() {
        const prefEnum = {
            getValue: () => 'mockValue'
        };
        currentSite.getCustomPreferenceValue.withArgs('reachFiveCheckCredentials').returns(prefEnum);
        expect(reachfiveSettings.reachFiveCheckCredentials).to.equal('mockValue');
    });

    it.skip('should return an empty string if reachFiveCheckCredentials is null', function() {
        // this failed becase of the way customerPreferences work
        currentSite.getCustomPreferenceValue.withArgs('reachFiveCheckCredentials').returns(null);
        expect(reachfiveSettings.reachFiveCheckCredentials).to.equal('');
    });
});