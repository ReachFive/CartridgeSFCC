'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const Logger = require('dw-api-mock/dw/system/Logger');
const Site = require('dw-api-mock/dw/system/Site');
const Locale = require('dw-api-mock/dw/util/Locale');

describe('reachfiveSettings', function () {
    let loggerStub;
    let siteStub;
    let reachfiveSettings;

    beforeEach(function () {
        loggerStub = {
            error: sinon.spy()
        };
        siteStub = {
            getCurrent: sinon.stub().returns({
                getCustomPreferenceValue: sinon.stub()
            })
        };

        sinon.stub(Logger, 'getLogger').returns(loggerStub);
        sinon.stub(Site, 'getCurrent').returns(siteStub.getCurrent());

        reachfiveSettings = proxyquire('../../../cartridges/int_reachfive/cartridge/models/reachfiveSettings', {
            'dw/system/Site': Site,
            'dw/system/Logger': Logger,
            'dw/util/Locale': Locale
        });
    });

    afterEach(function () {
        Logger.getLogger.restore();
        Site.getCurrent.restore();
    });

    it('should return the correct value for getReachFiveTheme', function () {
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('isReach5ThemeActive').returns(true);
        expect(reachfiveSettings.getReachFiveTheme()).to.equal('light');
    });

    it('should return the correct value for getReachFiveLanguageCode', function () {
        sinon.stub(Locale, 'getLocale').returns({
            getLanguage: () => 'en'
        });
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5SupportedLanguageCodes').returns(['en', 'fr']);
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5DefaultLanguageCode').returns('en');
        expect(reachfiveSettings.getReachFiveLanguageCode()).to.equal('en');
        Locale.getLocale.restore();
    });

    it('should return the default language code if current language is not supported', function () {
        sinon.stub(Locale, 'getLocale').returns({
            getLanguage: () => 'de'
        });
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5SupportedLanguageCodes').returns(['en', 'fr']);
        siteStub.getCurrent().getCustomPreferenceValue.withArgs('reach5DefaultLanguageCode').returns('en');
        expect(reachfiveSettings.getReachFiveLanguageCode()).to.equal('en');
        Locale.getLocale.restore();
    });

    it('should return the correct value for getReachFiveLocaleCode', function () {
        sinon.stub(Locale, 'getLocale').returns({
            getCountry: () => 'US'
        });
        expect(reachfiveSettings.getReachFiveLocaleCode()).to.equal('US');
        Locale.getLocale.restore();
    });
});
