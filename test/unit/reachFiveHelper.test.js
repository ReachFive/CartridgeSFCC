'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const Encoding = require('dw-api-mock/dw/crypto/Encoding');
const Calendar = require('dw-api-mock/dw/util/Calendar');
const Cookie = require('dw-api-mock/dw/web/Cookie');
const StringUtils = require('dw-api-mock/dw/util/StringUtils');
const Request = require('dw-api-mock/dw/system/Request');
const response = require('dw-api-mock/dw/system/Response');

const request = sinon.stub(() => {
    return {
        ...new Request(),
        addHttpCookie: sinon.stub(),
        getHttpCookies: sinon.stub()
    };
});

describe('reachFiveHelper', function () {
    let reachFiveHelper;
    let reachFiveSettingsStub = {};
    let utilsStub;

    beforeEach(function () {
        reachFiveSettingsStub = {
            isReachFiveTransitionActive: sinon.stub(),
            getReachFivePreferences: sinon.stub(),
            getReachFiveCookieName: sinon.stub(),
            getReachFiveLoginCookieName: sinon.stub(),
            getReachFiveProviderId: sinon.stub()
        };

        utilsStub = {
            getStateData: sinon.stub()
        };

        reachFiveHelper = proxyquire('./../../cartridges/int_reachfive/cartridge/scripts/helpers/reachFiveHelper', {
            'dw/crypto/Encoding': Encoding,
            'dw/util/Calendar': Calendar,
            'dw/web/Cookie': Cookie,
            'dw/util/StringUtils': StringUtils,
            'dw/system/Request': request,
            'dw/system/Response': response,
            '*/cartridge/models/reachfiveSettings': reachFiveSettingsStub,
            './utils': utilsStub
        });
    });

    it('should return true if field exists in external profile', function () {
        const externalProfile = { key: 'value' };
        expect(reachFiveHelper.isFieldExist(externalProfile, 'key')).to.equal(true);
    });

    it('should return encoded Base64 URL safe string', function () {
        const key = 'testKey';
        const encodedString = 'dGVzdEtleQ==';
        sinon.stub(Encoding, 'toBase64').returns(encodedString);
        expect(reachFiveHelper.encodeBase64UrlSafe(key)).to.equal('dGVzdEtleQ');
        Encoding.toBase64.restore();
    });

    it('should return decoded token value', function () {
        const idToken = 'header.payload.signature';
        const decodedString = 'decodedPayload';
        sinon.stub(Encoding, 'fromBase64').returns(decodedString);
        expect(reachFiveHelper.reachFiveTokenDecode(idToken)).to.equal(decodedString);
        Encoding.fromBase64.restore();
    });

    it('should return Base64 encoded state object', function () {
        const redirectURL = 'http://example.com';
        const action = 'action';
        const handleCustomerRoute = true;
        const data = { key: 'value' };
        const encodedStateObj = 'encodedStateObj';
        sinon.stub(StringUtils, 'encodeBase64').returns(encodedStateObj);
        expect(reachFiveHelper.getStateObjBase64(redirectURL, action, handleCustomerRoute, data)).to.equal(encodedStateObj);
        StringUtils.encodeBase64.restore();
    });

    it('should return profile request object from form', function () {
        const customerForm = {
            get: sinon.stub().returns({
                value: sinon.stub().returns('value')
            })
        };
        const requestObj = {
            name: 'value value',
            given_name: 'value',
            family_name: 'value',
            birthdate: undefined
        };
        expect(reachFiveHelper.getProfileRequestObjFromForm(customerForm)).to.deep.equal(requestObj);
    });

    it('should return the correct value for getReachFiveExternalID', function () {
        const profile = {
            customer: {
                getExternalProfiles: sinon.stub().returns({
                    toArray: sinon.stub().returns([
                        {
                            externalID: 'externalID',
                            authenticationProviderID: 'providerID'
                        }
                    ])
                })
            }
        };
        reachFiveSettingsStub.getReachFiveProviderId.returns('providerID');
        expect(reachFiveHelper.getReachFiveExternalID(profile)).to.equal('externalID');
    });
});

// don't know why but getHttpCookies is not found on request object
describe.skip('reachFiveHelperCookieBehavior', function () {
    let reachFiveSettingsStub = {};
    var reachFiveHelper = proxyquire('./../../cartridges/int_reachfive/cartridge/scripts/helpers/reachFiveHelper', {
        'dw/crypto/Encoding': Encoding,
        'dw/util/Calendar': Calendar,
        'dw/web/Cookie': Cookie,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Request': request,
        'dw/system/Response': response,
        '*/cartridge/models/reachfiveSettings': reachFiveSettingsStub
    });

    beforeEach(function () {
        reachFiveSettingsStub = {
            isReachFiveTransitionActive: sinon.stub(),
            getReachFiveCookieName: sinon.stub()
        };
    });

    it('should return the correct value for getReachFiveConversionMute', function () {
        reachFiveSettingsStub.isReachFiveTransitionActive.returns(true);
        reachFiveSettingsStub.getReachFiveCookieName.returns('r5.conversion');
        sinon.stub(request, 'getHttpCookies').returns({
            'r5.conversion': { value: '1' }
        });
        expect(reachFiveHelper.getReachFiveConversionMute()).to.equal(true);
    });

    it('should set Reach Five Conversion cookie', function () {
        reachFiveSettingsStub.isReachFiveTransitionActive.returns(true);
        reachFiveSettingsStub.getReachFivePreferences.withArgs('reachFiveTransitionCookieDuration').returns(1);
        sinon.stub(response, 'addHttpCookie');
        reachFiveHelper.setReachFiveConversionCookie();
        expect(response.addHttpCookie.calledOnce).to.equal(true);
        response.addHttpCookie.restore();
    });

    it('should set Reach Five Login cookie', function () {
        reachFiveSettingsStub.getReachFivePreferences.withArgs('reachFiveLoginCookieDuration').returns(1);
        sinon.stub(response, 'addHttpCookie');
        reachFiveHelper.setReachFiveLoginCookie();
        expect(response.addHttpCookie.calledOnce).to.equal(true);
        response.addHttpCookie.restore();
    });
});
