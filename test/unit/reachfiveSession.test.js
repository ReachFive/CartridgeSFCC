const chai = require('chai');
const sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var Encoding = require('dw-api-mock/dw/crypto/Encoding');
var Site = require('dw-api-mock/dw/system/Site');
var ReachfiveSession = proxyquire('../../cartridges/int_reachfive/cartridge/models/reachfiveSession', {
    'dw/crypto/Encoding': Encoding,
    'dw/system/Site': Site,
});

// Thi is a mock of the Demandware global object
require('dw-api-mock/demandware-globals');
require('app-module-path').addPath(process.cwd() + '/cartridges');

const expect = chai.expect;

describe('ReachfiveSession', function () {
    let session;

    beforeEach(function () {
        session = {
            privacy: {}
        };
        global.session = session;
    });

    afterEach(function () {
        delete global.session;
    });

    it('should initialize session with authRespObj', function () {
        const authRespObj = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            provider_access_token: 'provider_access_token',
            token_type: 'Bearer',
            expires_in: '3600'
        };
        // we do like this because of mocking the Encoding, see, dw/crypto/Encoding from dw-api-mock
        authRespObj.id_token = `header.${JSON.stringify(authRespObj)}.signature`;

        const reachfiveSession = new ReachfiveSession(authRespObj);

        expect(session.privacy.access_token).to.equal(authRespObj.access_token);
        expect(session.privacy.refresh_token).to.equal(authRespObj.refresh_token);
        expect(session.privacy.provider_access_token).to.equal(authRespObj.provider_access_token);
    });

    it('should initialize session with authRespObj evenIf verylong googleId img', function () {
        // Test limit of 2000 for string https://salesforcecommercecloud.github.io/b2c-dev-doc/docs/current/scriptapi/html/index.html?target=class_dw_system_Session.html
        const min = 97; // ASCII Code of 'a'
        const max = 122; // ASCII Code of 'z'
        const randomChar = () => String.fromCharCode(Math.floor(Math.random() * (max - min + 1)) + min);
        const someLongString = Array.from({ length: 2000 }, (_, i) => i).map(randomChar).join('');
        const authRespObj = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            provider_access_token: 'provider_access_token',
            token_type: 'Bearer',
            expires_in: '3600',
            picture: someLongString
        };
        // we do like this because of mocking the Encoding, see, dw/crypto/Encoding from dw-api-mock
        authRespObj.id_token = `header.${JSON.stringify(authRespObj)}.signature`;

        const reachfiveSession = new ReachfiveSession(authRespObj);

        expect(session.privacy.profile.picture).to.be.undefined;
        expect(session.privacy.access_token).to.equal(authRespObj.access_token);
        expect(session.privacy.refresh_token).to.equal(authRespObj.refresh_token);
        expect(session.privacy.provider_access_token).to.equal(authRespObj.provider_access_token);
    });

    it('should split name if kakao provider and sitePref is True', function () {
        const authRespObj = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            provider_access_token: 'provider_access_token',
            token_type: 'Bearer',
            expires_in: '3600',
            name: '최혜선',
            auth_type: 'kakaotalk'
        };
        var idToken = `header.${JSON.stringify(authRespObj)}.signature`;
        authRespObj.id_token = idToken;
        
        sinon.stub(Site, 'getCurrent').returns({
            ID: 'bystub',
            customPreferences: {
                isReachFiveEnableKakaoTalkNameSplit: true
            },
            getCustomPreferenceValue: (key) => {
                if (key === 'isReachFiveEnableKakaoTalkNameSplit') {
                    return true;
                }
                return 'grr';
            }
        });

        const reachfiveSession = new ReachfiveSession(authRespObj);

        Site.getCurrent.restore();

        expect(session.privacy.profile.firstName).to.equal('혜선');
        expect(session.privacy.profile.lastName).to.equal('최');
    });

    it('should don\'t split name if kakao provider and sitePref undifined or false', function () {
        const authRespObj = {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            provider_access_token: 'provider_access_token',
            token_type: 'Bearer',
            expires_in: '3600',
            name: '최혜선',
            auth_type: 'kakaotalk'
        };
        var idToken = `header.${JSON.stringify(authRespObj)}.signature`;
        authRespObj.id_token = idToken;
        
        const reachfiveSession = new ReachfiveSession(authRespObj);

        expect(session.privacy.profile.firstName).to.be.undefined;
        expect(session.privacy.profile.lastName).to.be.undefined;
    });

});